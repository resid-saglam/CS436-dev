// src/middleware/authMiddleware.js   ✅
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Erişim reddedildi, token eksik!" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res
      .status(400)
      .json({ message: "Token formatı hatalı! (Beklenen: Bearer <token>)" });

  const token = parts[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(400).json({ message: "Geçersiz token!" });
  }
};
