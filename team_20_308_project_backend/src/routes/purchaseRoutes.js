// routes/purchaseRoutes.js
const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Mevcut: sipariş geçmişi
router.get("/my-orders", authMiddleware, orderController.getMyOrders);

// Yeni: PDF fatura görüntüleme
router.get("/invoice/:orderId", authMiddleware, orderController.getInvoice);

module.exports = router;
