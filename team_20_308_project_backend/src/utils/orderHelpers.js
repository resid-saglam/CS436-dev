// src/utils/orderHelpers.js
const { Order, OrderItem } = require("../models");
require("../models/associations"); // 🌟 İlişkileri yükle

/**
 * Kullanıcının belirtilen ürünü "delivered" statüsünde alıp almadığını kontrol eder.
 * @param {number} userId  - Kullanıcı ID
 * @param {number} productId - Ürün ID
 * @returns {Promise<boolean>}
 */
exports.hasDeliveredProduct = async (userId, productId) => {
    try {
        const order = await Order.findOne({
            where: { userId, status: "delivered" },
            include: [
                {
                    model: OrderItem,
                    as: "items", // associations.js'de tanımlı alias: "items"
                    where: { productId },
                },
            ],
        });

        return !!order;
    } catch (err) {
        console.error("hasDeliveredProduct HATA:", err);
        return false;
    }
};