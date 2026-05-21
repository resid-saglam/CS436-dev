/* ────────────────────────────────────────────────
   Customer‑side Order Controller
   ──────────────────────────────────────────────── */
const path = require("path");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product = require("../models/product");
const User = require("../models/user");
const { generateInvoicePDFStream } = require("../services/invoiceService");

/* 1)  GET /api/orders/user  – kullanıcının siparişleri */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* 2)  PUT /api/admin/orders/:id/status  (sales/PM)  */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["processing", "in-transit", "delivered"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const ok =
      (order.status === "processing" && status === "in-transit") ||
      (order.status === "in-transit" && status === "delivered");
    if (!ok) return res.status(400).json({ message: "Invalid transition" });

    order.status = status;
    await order.save();
    res.status(200).json({ message: "Status updated", order });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* 3)  GET /api/orders/invoice/:id  */
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (req.user.role !== "product_manager") where.userId = req.user.id;

    const order = await Order.findOne({
      where,
      include: [
        { model: User, as: "customer", attributes: ["name", "email"] },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });
    if (!order) return res.sendStatus(404);

    const plain = order.get({ plain: true });

    const pdfStream = generateInvoicePDFStream({
      order: plain,
      items: plain.items,
      user: { ...plain.customer, address: plain.shippingAddress },
      logoPath: path.resolve(__dirname, "../assets/logo.png"),
    });

    res.setHeader("Content-Type", "application/pdf");
    pdfStream.pipe(res);
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* 4)  PUT /api/orders/:id/cancel  */
exports.cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId },
      include: [{ model: OrderItem, as: "items" }],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "processing")
      return res.status(400).json({ message: "Order can’t be cancelled" });

    // Her bir kalemi stoklara geri ekle
    for (const item of order.items) {
      await Product.increment(
        { quantityInStocks: item.quantity },
        { where: { id: item.productId } }
      );
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled", order });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* 5)  PUT /api/orders/:id/refund  */
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ where: { id, userId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const deliveredOk = order.status === "delivered";
    const within30 =
      Date.now() - new Date(order.createdAt).getTime() <= thirtyDays;

    if (!deliveredOk || !within30)
      return res.status(400).json({ message: "Refund not allowed" });

    order.status = "refund-requested";
    await order.save();

    res.status(200).json({ message: "Refund requested", order });
  } catch (err) {
    console.error("Refund error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
