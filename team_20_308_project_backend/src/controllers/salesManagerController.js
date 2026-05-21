const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const { Op } = require("sequelize");
const User = require("../models/user");
const { generateInvoicePDFStream } = require("../services/invoiceService");
const emailService = require("../services/emailService");
// ✅ Ürün fiyatı ve maliyet belirle
exports.setProductPriceAndCost = async (req, res) => {
  const { id } = req.params;
  const { price, cost } = req.body;

  // Fiyatın geçerli olup olmadığını kontrol et
  if (price === undefined || isNaN(price) || price <= 0) {
    return res.status(400).json({ message: "Valid price is required." });
  }

  // Cost'un geçerli olup olmadığını kontrol et
  if (cost !== undefined && (isNaN(cost) || cost < 0)) {
    return res.status(400).json({ message: "Valid cost is required." });
  }

  try {
    // Ürünü bul
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Fiyatı güncelle
    product.price = price;

    // Cost verilmişse güncelle, verilmemişse fiyatın %50'sini ata
    if (cost !== undefined) {
      product.cost = cost;
    } else {
      product.cost = price * 0.5;
    }

    await product.save();

    res.status(200).json({
      message: `Product '${product.name}' updated successfully.`,
      product,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 📝 Kar/Zarar Raporu
exports.getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Tarih aralığı kontrolü
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    // Başlangıç ve bitiş tarihlerini dönüştürme
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Bitiş tarihini bir gün ileri al

    // Veritabanından teslim edilen siparişleri getirme
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.in]: [
            "delivered",
            "refund-requested",
            "in-transit",
            "processing",
          ],
        },
        createdAt: {
          [Op.between]: [start, end], // tarih aralığı
        },
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    let totalRevenue = 0;
    let totalCost = 0;

    // Siparişlerin maliyet ve gelir hesaplaması
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const revenue = item.price * item.quantity;
        const unitCost = item.product.cost ?? item.product.price * 0.5;
        const cost = unitCost * item.quantity;
        totalRevenue += revenue;
        totalCost += cost;
      });
    });

    const profitOrLoss = totalRevenue - totalCost;

    res.status(200).json({
      totalRevenue,
      totalCost,
      profitOrLoss,
      status: profitOrLoss >= 0 ? "Profit" : "Loss",
    });
  } catch (err) {
    console.error("Profit/Loss Calculation Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Ürüne indirim uygulama
exports.setProductDiscount = async (req, res) => {
  const { id } = req.params;
  const { discount } = req.body;

  if (
    discount === undefined ||
    isNaN(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    return res
      .status(400)
      .json({ message: "Valid discount (0-100) is required." });
  }

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Yeni fiyatı hesapla
    const discountedPrice = product.price * (1 - discount / 100);
    product.price = parseFloat(discountedPrice.toFixed(2));

    await product.save();

    res.status(200).json({
      message: `Discount applied successfully to product '${product.name}'.`,
      product,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRefundRequests = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: "refund-requested" },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        { model: User, as: "customer" },
      ],
    });
    res.json({ orders });
  } catch (err) {
    console.error("getRefundRequests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        { model: User, as: "customer" },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Stoka geri dön
    for (const item of order.items) {
      const prod = item.product;
      prod.quantityInStocks += item.quantity;
      await prod.save();
    }

    // Sipariş durumunu güncelle
    order.status = "refunded";
    await order.save();

    // Email notification — non-blocking so SMTP failure doesn’t crash the refund
    try {
      const docStream = generateInvoicePDFStream({
        order,
        items: order.items,
        user: order.customer,
      });
      const chunks = [];
      await new Promise((resolve, reject) => {
        docStream.on("data", (c) => chunks.push(c));
        docStream.on("end", resolve);
        docStream.on("error", reject);
      });
      const pdfBuffer = Buffer.concat(chunks);

      const rawAmount = parseFloat(order.totalPrice);
      const formattedAmount = Number.isNaN(rawAmount)
        ? "$0.00"
        : `$${rawAmount.toFixed(2)}`;

      await emailService.sendInvoiceEmail(
        order.customer.email,
        `Your refund for order #${order.id} is approved`,
        `Hello ${order.customer.name},\n\nYour refund of ${formattedAmount} has been approved.`,
        pdfBuffer
      );
    } catch (emailErr) {
      console.error("Refund email failed (non-fatal):", emailErr.message);
    }

    return res
      .status(200)
      .json({ message: "Refund approved, stock updated, customer notified." });
  } catch (err) {
    console.error("Refund approval error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    // Tarihleri doğru biçimde dönüştürme
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Bitiş tarihini bir gün ileri al

    // Siparişleri veritabanından çekme
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!orders.length) {
      return res
        .status(404)
        .json({ message: "No invoices found in the given date range." });
    }

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Invoice Fetch Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: User,
          as: "customer",
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    const pdfStream = generateInvoicePDFStream({
      order,
      items: order.items,
      user: order.customer,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    pdfStream.pipe(res);
  } catch (err) {
    console.error("Invoice Download Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
exports.disapproveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    // Burada gerçek DB güncellemesi yapmalısın (status = "refund-denied")
    return res
      .status(200)
      .json({ message: `Refund request ${id} has been disapproved.` });
  } catch (err) {
    console.error("Disapprove refund error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
