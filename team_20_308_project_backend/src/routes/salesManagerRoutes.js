// src/routes/salesManagerRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/salesManagerController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// 👮‍♂️ All routes require “sales_manager” role
router.use(auth, role(["sales_manager"]));

// ─── Product Management ────────────────────────────────────
// Set product price (and cost)
router.put("/products/:id/price", ctrl.setProductPriceAndCost);
// Apply discount to a product
router.put("/products/:id/discount", ctrl.setProductDiscount);
// (Optional) Explicit price-cost endpoint
router.put("/products/:id/price-cost", ctrl.setProductPriceAndCost);

// ─── Reports ───────────────────────────────────────────────
// Profit/Loss report
router.get("/revenue-report", ctrl.getProfitLoss);

// ─── Refunds ──────────────────────────────────────────────
// List all pending refund requests
router.get("/refunds", ctrl.getRefundRequests);
// Approve a refund request
router.put("/refunds/:id/approve", ctrl.approveRefund);
// (NEW) Disapprove a refund request
router.put("/refunds/:id/disapprove", ctrl.disapproveRefund);

// ─── Invoices ─────────────────────────────────────────────
// List invoices by date range
router.get("/invoices", ctrl.getInvoices);
// Download a single invoice PDF
router.get("/invoices/download/:orderId", ctrl.downloadInvoice);

module.exports = router;
