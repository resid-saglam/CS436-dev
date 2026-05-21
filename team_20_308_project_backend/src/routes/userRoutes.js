// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const { getProfile } = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");

router.get("/me/address", authMiddleware, userController.getMyAddress);
router.put("/me/address", authMiddleware, userController.updateMyAddress);
router.get("/profile", authenticate, getProfile);

module.exports = router;
