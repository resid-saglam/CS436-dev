// src/middleware/roleMiddleware.js
/**
 * Role guard – kullanıcının rolünü kontrol eder.
 *
 * Kullanım:
 *   router.use(auth, requireRole("sales_manager"));
 *   router.put("/...", auth, requireRole(["admin", "sales_manager"]), handler);
 */
function requireRole(allowed) {
  // Tek rol girdiyse diziye çevir
  const list = Array.isArray(allowed) ? allowed : [allowed];

  // Hepsini normalize et (küçük harf + trim + boşluğu alt çizgiye çevir)
  const normalizedAllowed = list.map((r) =>
    r.trim().toLowerCase().replace(/\s+/g, "_")
  );

  return (req, res, next) => {
    // Token okunamadıysa
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = req.user.role.trim().toLowerCase().replace(/\s+/g, "_");

    if (!normalizedAllowed.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "Forbidden — insufficient role" });
    }

    next();
  };
}

module.exports = requireRole;
