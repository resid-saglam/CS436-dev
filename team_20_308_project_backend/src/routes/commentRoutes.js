// src/routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");
const authMiddleware = require("../middleware/authMiddleware"); // ← EKLE

// Yorum ekle
router.post("/", auth, commentController.addComment);

// Kendi yorumunu güncelle
// routes/commentRoutes.js
router.put("/:id", authMiddleware, commentController.updateComment);

// Belirli ürünün onaylı yorumları
router.get("/:productId", commentController.getCommentsByProduct);

// Admin onay
router.put("/approve/:id", auth, commentController.approveComment);

module.exports = router;
