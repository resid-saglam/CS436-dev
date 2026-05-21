// src/models/index.js

const User = require("./user");
const Comment = require("./comment");
const Product = require("./product");
const Category = require("./category");
const ProductCategory = require("./productCategory");
const Order = require("./order");
const OrderItem = require("./orderItem");
const Rating = require("./rating");
const Wishlist = require("./wishlist");

// Tüm ilişkiler burada tanımlanır (modeller yukarıda import edildikten sonra)
require("./associations");

module.exports = {
  User,
  Comment,
  Product,
  Category,
  ProductCategory,
  Order,
  OrderItem,
  Rating,
  Wishlist,
};
