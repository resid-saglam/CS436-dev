const { DataTypes } = require("sequelize");
const sequelize     = require("../config/db");

/* ───────────────────────────────────────────────
   Order Model
   ───────────────────────────────────────────── */
const Order = sequelize.define(
    "Order",
    {
        id: {
            type         : DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey   : true,
        },

        totalPrice: {
            type     : DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        status: {
            type        : DataTypes.ENUM(
                "processing", "in-transit", "delivered",
                "cancelled", "refund-requested", "refunded"
            ),
            defaultValue: "processing",
        },

        /* JSON snapshot – NULL olmasın */
        shippingAddress: {
            type     : DataTypes.JSON,
            allowNull: false,
        },

        createdAt: {
            type        : DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    { timestamps: false }
);

/* ——— İlişkiler (manuel) ——— */
Order.associate = (models) => {
    Order.belongsTo(models.User,    { as: "customer", foreignKey: "userId" });
    Order.hasMany (models.OrderItem,{ as: "items",    foreignKey: "orderId" });
};

module.exports = Order;
