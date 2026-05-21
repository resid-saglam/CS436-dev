/* ------------------------------------------------------------
 *  Modelleri yükle
 * ------------------------------------------------------------ */
const User            = require("./user");
const Product         = require("./product");
const Category        = require("./category");
const Comment         = require("./comment");
const Wishlist        = require("./wishlist");
const ProductCategory = require("./productCategory");
const ProductImage    = require("./productImage");
const Rating          = require("./rating");
const Order           = require("./order");
const OrderItem       = require("./orderItem");
const CartItem        = require("./cartItem");

/* ------------------------------------------------------------
 *  İlişkiler
 * ------------------------------------------------------------ */

/* ——— User  ⇄  Comment ——— */
User.hasMany(Comment,  { foreignKey: "userId",  onDelete: "CASCADE" });
Comment.belongsTo(User,{ foreignKey: "userId",  onDelete: "CASCADE" });

/* ——— Product  ⇄  Comment ——— */
Product.hasMany(Comment, { foreignKey: "productId", onDelete: "CASCADE" });
Comment.belongsTo(Product,{ foreignKey: "productId", onDelete: "CASCADE" });

/* ——— Product  ⇄  Rating ——— */
Product.hasMany(Rating,  { foreignKey: "productId", onDelete: "CASCADE" });
Rating.belongsTo(Product,{ foreignKey: "productId", onDelete: "CASCADE" });

/* ——— Product  ⇄  Category (M-to-M) ——— */
Product.belongsToMany(Category, { through: ProductCategory });
Category.belongsToMany(Product, { through: ProductCategory });

/* ——— Product  ⇄  Images ——— */
Product.hasMany(ProductImage, {
  as: "images",
  foreignKey: "productId",
  onDelete : "CASCADE",
});
ProductImage.belongsTo(Product, { foreignKey: "productId" });

/* ============================================================
 *           Order  ve  OrderItem  alias ayarları
 * ============================================================ */

/* ——— User  ⇄  Order ——— */
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, {
  as        : "customer",
  foreignKey: "userId",
  onDelete  : "CASCADE",
});

/* ——— Order  ⇄  OrderItem ———
 * Alias **items**  ←  LÜTFEN bunu kullanın
 */
Order.hasMany(OrderItem, {
  as        : "items",
  foreignKey: "orderId",
  onDelete  : "CASCADE",
});
OrderItem.belongsTo(Order, {
  as        : "order",
  foreignKey: "orderId",
  onDelete  : "CASCADE",
});

/* ——— Product  ⇄  OrderItem ——— */
Product.hasMany(OrderItem, { foreignKey: "productId", onDelete: "CASCADE" });
OrderItem.belongsTo(Product, {
  as        : "product",
  foreignKey: "productId",
  onDelete  : "CASCADE",
});

/* ——— User  ⇄  Wishlist ——— */
User.hasMany(Wishlist,  { foreignKey: "userId",    onDelete: "CASCADE" });
Wishlist.belongsTo(User,{ foreignKey: "userId" });

/* ——— Product  ⇄  Wishlist ——— */
Product.hasMany(Wishlist,{ foreignKey: "productId", onDelete: "CASCADE" });
Wishlist.belongsTo(Product,{ foreignKey: "productId" });

/* ——— Product  ⇄  CartItem ——— */
Product.hasMany(CartItem, {
  as        : "productCartItems",
  foreignKey: "productId",
  onDelete  : "CASCADE",
});
CartItem.belongsTo(Product, {
  as        : "product",
  foreignKey: "productId",
  onDelete  : "CASCADE",
});

/* ------------------------------------------------------------
 *  Modelleri dışa aktar
 * ------------------------------------------------------------ */
module.exports = {
  User,
  Product,
  Category,
  Comment,
  Wishlist,
  ProductCategory,
  ProductImage,
  Rating,
  Order,
  OrderItem,
  CartItem,
};
