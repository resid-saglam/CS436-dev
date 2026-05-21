const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Product = require("./product");
const Category = require("./category");

// Ara tabloyu oluştur
const ProductCategory = sequelize.define("ProductCategory", {}, { timestamps: false });

// Many-to-Many ilişkiyi tanımla
Product.belongsToMany(Category, { through: ProductCategory });
Category.belongsToMany(Product, { through: ProductCategory });

module.exports = ProductCategory;
