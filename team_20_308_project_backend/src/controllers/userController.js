// controllers/userController.js
const User = require("../models/user");

exports.getMyAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ address: user.address || null });
  } catch (error) {
    console.error("Error while retrieving address.", error);
    return res.status(500).json({ error: "Server error" });
  }
};
exports.updateMyAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const newAddress = req.body.address;

    if (!newAddress || typeof newAddress !== "object") {
      return res
        .status(400)
        .json({ message: "A valid address must be provided" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address = newAddress;
    await user.save();

    return res
      .status(200)
      .json({ message: "Address updated successfully", address: user.address });
  } catch (error) {
    console.error("Address update error", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Token'dan gelen id (middleware'de setlenmiş olmalı)
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "address"], // sadece gerekli alanlar
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
