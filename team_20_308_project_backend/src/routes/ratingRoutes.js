// src/routes/ratingRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addRating,
  getAverageRating,
  getUserRating,
} = require("../controllers/ratingController");

// ✅ Puan ekleme (Giriş yapmış kullanıcılar için)
router.post("/", authMiddleware, addRating);

// ✅ Belirli bir ürünün ortalama puanını getirme
router.get("/:productId", getAverageRating);

// ✅ Giriş yapmış kullanıcının o ürüne verdiği puanı getirme
router.get("/user/:productId", authMiddleware, getUserRating);

module.exports = router;
