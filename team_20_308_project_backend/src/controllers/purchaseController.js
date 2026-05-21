// ────────────────────────────────────────────────
// src/controllers/purchaseController.js
// ────────────────────────────────────────────────
const CartItem  = require("../models/cartItem");
const Order     = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product   = require("../models/product");

exports.startPurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
    });
    if (!cartItems.length) return res.status(400).json({ message: "Cart empty" });

    let total = 0;
    for (const ci of cartItems) {
      const p = ci.product;
      if (p.quantityInStocks < ci.quantity)
        return res.status(400).json({ message: `${p.name} out of stock` });
      total += parseFloat(p.price) * ci.quantity;
    }

    const order = await Order.create({ userId, totalPrice: total, status: "processing" });
    for (const ci of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.product.price,
      });
      await ci.product.decrement("quantityInStocks", { by: ci.quantity });
    }
    await CartItem.destroy({ where: { userId } });

    res.status(200).json({ message: "Order created", order });
  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
