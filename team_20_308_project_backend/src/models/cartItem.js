// models/cartItem.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user");
const Product = require("./product");

const CartItem = sequelize.define("CartItem", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Giriş yapmamış kullanıcılar için rastgele bir sessionId tutabilirsiniz
    sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Giriş yapmış kullanıcılar için userId tutuyoruz
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: "id",
        },
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: "id",
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    // createdAt, updatedAt isterseniz timestamps seçeneğini true yapabilirsiniz
}, {
    timestamps: false
});

// İlişkiyi belirtmek isterseniz:
User.hasMany(CartItem, { foreignKey: "userId" });
CartItem.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

module.exports = CartItem;
