// src/controllers/ratingController.js
const Rating = require("../models/rating");
const Product = require("../models/product");
const User = require("../models/user");
const { hasDeliveredProduct } = require("../utils/orderHelpers"); // 👈 EKLENDİ

// ✅ Yeni puan ekleme
exports.addRating = async (req, res) => {
  const { productId, rating } = req.body;
  const userId = req.user.id;

  if (!productId || !rating) {
    return res
      .status(400)
      .json({ message: "Please provide both the product and the rating!" });
  }
  if (rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "The rating must be between 1 and 5!" });
  }

  try {
    // Teslim kontrolü
    if (!(await hasDeliveredProduct(userId, productId))) {
      return res.status(400).json({
        message: "The product must be delivered before you can rate it.",
      });
    }

    // Ürün var mı?
    const product = await Product.findByPk(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found!" });

    // Daha önce puan var mı?
    const existing = await Rating.findOne({ where: { userId, productId } });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already rated this product." });
    }

    const newRating = await Rating.create({ userId, productId, rating });
    return res
      .status(201)
      .json({ message: "Rating added successfully!", rating: newRating });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Bir ürünün ortalama puanını getir
exports.getAverageRating = async (req, res) => {
  const { productId } = req.params;

  try {
    const ratings = await Rating.findAll({ where: { productId } });
    if (ratings.length === 0) {
      return res.status(200).json({
        message: "No rating has been made for this product yet.",
        averageRating: null,
      });
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = (sum / ratings.length).toFixed(2);
    return res.status(200).json({ averageRating });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getUserRating = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  try {
    const r = await Rating.findOne({ where: { userId, productId } });
    return res.status(200).json({ rating: r ? r.rating : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
