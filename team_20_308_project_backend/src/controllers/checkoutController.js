/* ────────────────────────────────────────────────
   Checkout Controller – Payment & Order creation
   ──────────────────────────────────────────────── */
const path           = require("path");
const CartItem       = require("../models/cartItem");
const Order          = require("../models/order");
const OrderItem      = require("../models/orderItem");
const Product        = require("../models/product");
const User           = require("../models/user");
const { generateInvoicePDFStream } = require("../services/invoiceService");
const { sendInvoiceEmail }         = require("../services/emailService");

exports.processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardHolder, cardNumber, expiry, cvc, shippingAddress } = req.body;

    /* ––– 1) Kart bilgisi kontrolü ––– */
    if (!cardHolder || !cardNumber || !expiry || !cvc)
      return res.status(400).json({ message: "Incomplete card data" });

    /* ––– 2) Sepeti ve stokları kontrol et ––– */
    const cartItems = await CartItem.findAll({
      where   : { userId },
      include : [{ model: Product, as: "product" }],
    });
    if (!cartItems.length)
      return res.status(400).json({ message: "Cart is empty" });

    let totalPrice = 0;
    for (const ci of cartItems) {
      const p = ci.product;
      if (p.quantityInStocks < ci.quantity)
        return res.status(400).json({ message: `${p.name} out of stock` });
      totalPrice += parseFloat(p.price) * ci.quantity;
    }

    /* ––– 3) Adres snapshot’ı hazırla ––– */
    let snapshotAddr = shippingAddress;               // Checkout’tan geldiyse onu kullan
    if (!snapshotAddr) {
      const { address } = await User.findByPk(userId, { attributes: ["address"] });
      snapshotAddr = address;                         // Yoksa profil adresi
    }
    if (!snapshotAddr)
      return res.status(400).json({ message: "No shipping address" });

    /* ––– 4) Order & OrderItem’ları oluştur ––– */
    const order = await Order.create({
      userId,
      totalPrice,
      status          : "processing",
      shippingAddress : snapshotAddr,
    });

    for (const ci of cartItems) {
      await OrderItem.create({
        orderId   : order.id,
        productId : ci.productId,
        quantity  : ci.quantity,
        price     : ci.product.price,
      });
      await ci.product.decrement("quantityInStocks", { by: ci.quantity });
    }
    await CartItem.destroy({ where: { userId } });

    /* ––– 5) Fatura PDF & e‑posta ––– */
    const orderItems = await OrderItem.findAll({
      where   : { orderId: order.id },
      include : [{ model: Product, as: "product" }],
    });
    const user = await User.findByPk(userId, { attributes: ["name", "email"] });

    const pdfStream = generateInvoicePDFStream({
      order,
      items: orderItems,
      user,
      logoPath: path.resolve(__dirname, "../assets/logo.png"),
    });

    const bufs = [];
    pdfStream.on("data", (c) => bufs.push(c));
    pdfStream.on("end", async () => {
      try {
        await sendInvoiceEmail(
            user.email,
            "Sipariş Faturası",
            "Siparişiniz başarıyla oluşturuldu, faturanızı ekte bulabilirsiniz.",
            Buffer.concat(bufs)
        );
      } catch (e) { console.error("Mail error:", e); }

      res.status(200).json({ message: "Payment successful", orderId: order.id });
    });
    pdfStream.on("error", (e) => {
      console.error("PDF gen error:", e);
      if (!res.headersSent) res.status(500).json({ message: "PDF failed" });
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
