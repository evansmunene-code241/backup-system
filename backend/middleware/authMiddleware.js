const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "kitengela_backup_secret_key";

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user is Admin
const isAdminMiddleware = (req, res, next) => {
  if (req.user && req.user.is_admin === 1) next();
  else return res.status(403).json({ error: "Forbidden: Admin access required" });
};

module.exports = { authMiddleware, isAdminMiddleware };
