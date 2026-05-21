// routes/cartRoutes.js
const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authOptional = require("../middleware/authMiddlewareOptional");
const authRequired = require("../middleware/authMiddleware");

// Sepete ekleme (login opsiyonel)
router.post("/add", authOptional, cartController.addToCart);

// Sepeti görüntüleme (login opsiyonel)
// Eğer login isen token ile istek at, değilse /api/cart?sessionId=xxxxx
router.get("/", authOptional, cartController.getCart);

// Sepetten ürün silme (örnekte login şartı yok ama istersen authRequired yap)
router.delete("/:cartItemId", cartController.removeFromCart);

// Yeni: session'daki ürünleri login kullanıcının sepetine aktar
router.post("/merge", authRequired, cartController.mergeCart);

module.exports = router;
