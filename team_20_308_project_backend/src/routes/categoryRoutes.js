// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const ctl = require("../controllers/categoryController");

// /api/categories
router.route("/")
    .post(ctl.createCategory)
    .get(ctl.getCategories);

router.route("/:id")
    .delete(ctl.deleteCategory);

// ürün ekleme
router.post("/:id/products", ctl.addProducts);
router.post("/:id/products/remove",  ctl.removeProducts);

module.exports = router;
