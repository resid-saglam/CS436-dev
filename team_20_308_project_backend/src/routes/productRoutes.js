const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const auth = require("../middleware/authMiddleware");
const authOptional = require("../middleware/authMiddlewareOptional");
const requireRole = require("../middleware/roleMiddleware");

/* ---------------- PUBLIC / OPTIONAL TOKEN ---------------- */
router.get("/", authOptional, productController.getAllProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/:productId", productController.getProductById);

/* ---------------- PRODUCT-MANAGER ------------------------ */
router.post(
  "/",
  auth,
  requireRole("product_manager"),
  productController.createProduct
);
router.put(
  "/:productId",
  auth,
  requireRole("product_manager"),
  productController.updateProduct
);
router.post(
  "/:productId/categories",
  auth,
  requireRole("product_manager"),
  productController.addProductToCategories
);
router.delete(
  "/:productId",
  auth,
  requireRole("product_manager"),
  productController.deleteProduct
);

/* ---------------- SALES-MANAGER -------------------------- */
// tek bir endpoint – ister newPrice ister discountPercent göndersin
router.put(
  "/:productId/discount",
  auth,
  requireRole("sales_manager"),
  productController.updateProductPrice
);

/* (isteğe bağlı) yalnızca yüzde göndermek isteyen eski kodu korumak isterseniz:
router.put(
  "/:productId/discount-percent",
  auth,
  requireRole("sales_manager"),
  productController.applyDiscountPercent
);
*/

module.exports = router;
