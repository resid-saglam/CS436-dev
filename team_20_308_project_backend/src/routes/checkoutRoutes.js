const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/pay", authMiddleware, checkoutController.processPayment);

module.exports = router;
