const { Order } = require("../models");

/**
 * Allow access if…
 *   – order belongs to the user  OR
 *   – user is product_manager
 */
module.exports = async (req, res, next) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.sendStatus(404);

        const sameUser   = order.userId === req.user.id;
        const isPm       = req.user.role === "product_manager";

        if (!sameUser && !isPm) return res.sendStatus(403);

        // 💾  ileride lazım olursa diye ekleyelim
        req.order = order;
        next();
    } catch (err) { next(err); }
};
