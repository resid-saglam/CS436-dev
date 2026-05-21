const { DataTypes } = require("sequelize");
const sequelize     = require("../config/db");

const OrderItem = sequelize.define(
    "OrderItem",
    {
        id: {
            type         : DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey   : true,
        },
        quantity: {
            type     : DataTypes.INTEGER,
            allowNull: false,
        },
        price: {
            type     : DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    { timestamps: false }
);

/* İlişkiler */
OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as        : "product",
    });
    OrderItem.belongsTo(models.Order, {
        foreignKey: "orderId",
        as        : "order",
    });
};

module.exports = OrderItem;
