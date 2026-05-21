// src/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/db");
require("./models/associations");

const app = express();

// CORS origin is environment-driven. In dev: the Vite dev server.
// In production: the CloudFront distribution URL. If the same-origin pattern
// is used (CloudFront /api/* → ALB), CORS becomes moot but the header is
// still set defensively.
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ["Authorization"],
  })
);
app.use(express.json());

// Sağlık kontrolü endpoint’i
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route dosyaları
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const pmOrderRoutes = require("./routes/pmOrderRoutes");
const pmCommentRoutes = require("./routes/pmCommentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

// API yolları
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/pm/orders", pmOrderRoutes);
app.use("/api/pm/comments", pmCommentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sales", require("./routes/salesManagerRoutes"));
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/categories", categoryRoutes);

// DB sync — DEVELOPMENT ONLY.
// In production we use `sequelize-cli db:migrate` against RDS (run once as a
// one-shot ECS task or from a bastion before the first ECS service deploy).
// sequelize.sync() is destructive when models drift; never let it run in
// production where it can silently alter the live schema.
if (process.env.NODE_ENV !== "production") {
  sequelize
    .sync()
    .then(() => {
      console.log("✅ Veritabanı senkronize edildi (dev only)");
    })
    .catch((err) => console.error("❌ Veritabanı bağlantı hatası:", err));
} else {
  // In production, verify the connection but do not modify the schema.
  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ RDS connection verified");
    })
    .catch((err) => console.error("❌ RDS connection failed:", err));
}

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;
