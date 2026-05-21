// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();
const CartItem = require("../models/cartItem");

// ✅ Kullanıcı Kaydı (Register)
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please complete all fields!" });
  }

  try {
    // E-posta benzersiz mi kontrol
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "This email is already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluştur
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful! Redirecting to login...",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Kullanıcı Girişi (Login)
exports.login = async (req, res) => {
  console.log("DEBUG | Login fonksiyonuna gelen body:", req.body);

  const { email, password, sessionId } = req.body;

  console.log("DEBUG | Gelen sessionId:", sessionId);

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please complete all fields!" });
  }

  try {
    // Kullanıcıyı veritabanında bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User account not found!" });
    }

    // Şifre doğrulama
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password!" });
    }

    // sessionId ile eklenmiş sepeti userId'ye devralma
    if (sessionId) {
      await CartItem.update(
        { userId: user.id, sessionId: null },
        { where: { sessionId } }
      );
    }

    // Token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email, // <- ekledik
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı!",
      token,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
