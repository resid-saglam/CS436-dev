// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");
const orderInvoiceAuth = require("../middleware/orderInvoiceAuth");

router.put ("/:id/cancel", auth, orderController.cancelMyOrder);
router.put("/:id/refund", auth, orderController.requestRefund);
// Kullanıcının tüm sipariş geçmişi
router.get("/user", auth, orderController.getMyOrders);

// Kullanıcının tek bir siparişi (detay sayfası için kullanılabilir)
router.get(
    "/invoice/:id",
    auth,                 // JWT → req.user
    orderInvoiceAuth,     // kullanıcı ≈ sipariş sahibi? | pm?
    orderController.getInvoice
);

module.exports = router;
