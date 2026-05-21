const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  approveComment,
  disapproveComment,
  listPending,
} = require("../controllers/commentController");

/* ---------------- PRODUCT MANAGER ---------------- */
router.get("/pending", auth, role("product_manager"), listPending);
router.put("/:id/approve", auth, role("product_manager"), approveComment);
router.delete("/:id", auth, role("product_manager"), disapproveComment);

module.exports = router;
