const Wishlist = require("../models/wishlist");
const Product = require("../models/product");

// Ürünü wishlist'e ekle
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Zaten wishlist'te var mı kontrol et
    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) {
      return res.status(400).json({
        message: "Product is already in your wishlist.",
        productId,
      });
    }

    await Wishlist.create({ userId, productId });
    res.status(201).json({ message: "Product added to wishlist!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcının wishlist'ini getir
// controllers/wishlistController.js
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "imageUrl", "price"],
        },
      ],
      attributes: ["productId"],
    });

    const result = wishlist.map((w) => ({
      productId: w.productId,
      name: w.Product.name,
      imageUrl: w.Product.imageUrl,
      price: w.Product.price,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Wishlist'ten ürünü kaldır
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    await Wishlist.destroy({ where: { userId, productId } });
    res.json({ message: `Product (ID: ${productId}) removed from wishlist!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
