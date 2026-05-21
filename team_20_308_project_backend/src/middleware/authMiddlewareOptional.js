// middleware/authMiddlewareOptional.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Token valid -> req.user içine payload’ı at
      req.user = decoded; 
    } catch (err) {
      // Token bozuksa sessiz geç, req.user = undefined kalacak
      console.error("Geçersiz token (authMiddlewareOptional)", err.message);
    }
  }

  next();
};
