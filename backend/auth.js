/**
 * AUTH — login berbasis JWT untuk staff/admin.
 * Publik (masyarakat) tetap TIDAK perlu login untuk endpoint /api/* biasa.
 * Middleware di file ini hanya dipasang di endpoint /api/admin/*.
 */

const jwt = require("jsonwebtoken");

// PENTING: di produksi, set environment variable JWT_SECRET dengan nilai acak
// yang panjang & rahasia (di Railway: Variables -> tambah JWT_SECRET).
const JWT_SECRET = process.env.JWT_SECRET || "dinsos-dev-secret-ganti-ini-di-railway";
const TOKEN_EXPIRY = "12h";

function buatToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nama: user.nama, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Mewajibkan token valid (login sebagai staff atau admin)
function verifikasiToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan. Silakan login." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Sesi login tidak valid atau kadaluarsa. Silakan login ulang." });
  }
}

// Mewajibkan role tertentu, dipakai SETELAH verifikasiToken
function wajibRole(...rolesDiizinkan) {
  return (req, res, next) => {
    if (!req.user || !rolesDiizinkan.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki akses untuk aksi ini." });
    }
    next();
  };
}

module.exports = { buatToken, verifikasiToken, wajibRole, JWT_SECRET };
