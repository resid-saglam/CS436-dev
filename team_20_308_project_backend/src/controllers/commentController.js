// src/controllers/commentController.js
const Comment = require("../models/comment");
const Product = require("../models/product");
const User = require("../models/user");
const { hasDeliveredProduct } = require("../utils/orderHelpers");

// 🔸 Yorum ekle (1 kullanıcı = 1 yorum)
exports.addComment = async (req, res) => {
  const { productId, text } = req.body;
  const userId = req.user.id;

  /* — 1. Teslimat kontrolü — */
  const delivered = await hasDeliveredProduct(userId, productId);
  if (!delivered) {
    return res
      .status(400)
      .json({ message: "You can comment only after delivery." });
  }

  /* — 2. Ürün var mı? — */
  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  /* — 3. Daha önce yorum var mı? — */
  const existing = await Comment.findOne({ where: { userId, productId } });

  /* 3-a) Hiç yorum yok → yeni kayıt */
  if (!existing) {
    const created = await Comment.create({
      userId,
      productId,
      text,
      approved: false,
    });

    return res.status(201).json({
      ...created.get(),
      approved: false,
      message: "Review submitted. Awaiting manager approval.",
    });
  }

  /* 3-b) Yorum var ve ONAYSIZ ise → güncelle */
  if (!existing.approved) {
    existing.text = text;
    existing.approved = false; // netlik için yine false
    await existing.save();

    return res.json({
      ...existing.get(),
      approved: false,
      message: "Comment updated, waiting for approval again.",
    });
  }

  /* 3-c) Yorum var ve ONAYLI ise → ikinci yoruma izin verme */
  return res.status(409).json({
    message: "You already reviewed this product.",
    comment: existing,
  });
};

// 🔸 Kendi yorumunu güncelle
// ...
exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  const comment = await Comment.findByPk(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (comment.userId !== userId)
    return res.status(403).json({ message: "Unauthorized action" });

  comment.text = text;
  comment.approved = false; // yeniden onay beklesin
  await comment.save();

  res.json({ message: "Comment updated, awaiting admin approval" });
};

// 🔸 Belirli ürünün SADECE onaylanmış yorumları
exports.getCommentsByProduct = async (req, res) => {
  const { productId } = req.params;
  const comments = await Comment.findAll({
    where: { productId, approved: true },
    include: [{ model: User, attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(comments);
};

// 🔸 Kullanıcının kendi yorumu (varsa)
exports.getMyComment = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const comment = await Comment.findOne({ where: { productId, userId } });
  res.json(comment);
};

// 🔸 Yorum onayla (admin)
exports.approveComment = async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findByPk(id);
  if (!comment) return res.status(404).json({ message: "Comment not found." });

  comment.approved = true;
  await comment.save();
  res.json({ message: "Comment approved." });
};

// ────────────────────────────────────────────────
// ADMIN: listPending  &  disapproveComment
// ────────────────────────────────────────────────
exports.listPending = async (req, res) => {
  try {
    const pending = await Comment.findAll({
      where: { approved: false },
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Product, attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disapproveComment = async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findByPk(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  await comment.destroy(); // sil → reddet
  res.json({ message: "Comment rejected & deleted" });
};
