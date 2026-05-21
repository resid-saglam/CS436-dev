const { Order, OrderItem, Product, User } = require("../models");

/* ————————————————————————————————————————————————
   Hepsi:  GET /api/pm/orders
   ———————————————————————————————————————————————— */
exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.findAll({
            attributes: ["id", "totalPrice", "status", "createdAt", "shippingAddress"],
            include: [
                { model: User, as: "customer", attributes: ["id", "name", "email"] },
                {
                    model: OrderItem,
                    as   : "items",
                    attributes: ["id", "quantity", "price"],
                    include: [
                        { model: Product, as: "product",
                            attributes: ["id", "name", "serialNumber", "price"] },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
            raw  : false,
            nest : true,
        });

        res.json(orders.map(o => o.get({ plain: true })));   // JSON shippingAddress
    } catch (err) { next(err); }
};

/* ————————————————————————————————————————————————
   Durum değiştir:  PUT /api/pm/orders/:id/status
   ———————————————————————————————————————————————— */
exports.updateStatus = async (req, res, next) => {
    const { id }     = req.params;
    const { status } = req.body;
    const allowed    = ["processing", "in-transit", "delivered"];

    if (!allowed.includes(status))
        return res.status(400).json({ message: "Invalid status" });

    try {
        const order = await Order.findByPk(id);
        if (!order) return res.sendStatus(404);

        const ok =
            (order.status === "processing" && status === "in-transit") ||
            (order.status === "in-transit"  && status === "delivered");
        if (!ok) return res.status(400).json({ message: "Illegal transition" });

        order.status = status;
        await order.save();
        res.json({ success: true, order });
    } catch (err) { next(err); }
};
