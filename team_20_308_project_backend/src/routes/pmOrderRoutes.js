// routes/pmOrderRoutes.js
const router = require("express").Router();
const auth   = require("../middleware/authMiddleware");
const role   = require("../middleware/roleMiddleware");
const pmOrderController = require("../controllers/pmOrderController");

// tüm istekler: kimlik + product_manager rol kontrolü
router.use(auth, role("product_manager"));

// GET  /api/pm/orders
router.get("/", pmOrderController.getAllOrders);

// PUT  /api/pm/orders/:id/status   body:{ status }
router.put("/:id/status", pmOrderController.updateStatus);

module.exports = router;
