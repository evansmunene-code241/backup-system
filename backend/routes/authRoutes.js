const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, logActivity } = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "kitengela_backup_secret_key";

/**
 * REGISTER
 * Route: POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    db.query(`SELECT * FROM users WHERE email = ?`, [email], (err, results) => {
      if (err) {
        logActivity(null, "REGISTER", "FAIL", `DB error: ${err.message}`);
        return res.status(500).json({ error: "Database error." });
      }

      if (results.length > 0) {
        logActivity(null, "REGISTER", "FAIL", `Email already registered: ${email}`);
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const password_hash = bcrypt.hashSync(password, 10);

      // ✅ Register new user (auto not approved)
      db.query(
        `INSERT INTO users (full_name, email, password_hash, is_admin, approved)
         VALUES (?, ?, ?, 0, 0)`,
        [full_name, email, password_hash],
        (err2, results2) => {
          if (err2) {
            logActivity(null, "REGISTER", "FAIL", `DB insert error: ${err2.message}`);
            return res.status(500).json({ error: "Database insert error." });
          }

          logActivity(results2.insertId, "REGISTER", "SUCCESS", `New user pending approval.`);
          res.json({
            success: true,
            message: "✅ Account created successfully! Please wait for admin approval.",
          });
        }
      );
    });
  } catch (err) {
    logActivity(null, "REGISTER", "FAIL", `Unexpected error: ${err.message}`);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * LOGIN
 * Route: POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    db.query(`SELECT * FROM users WHERE email = ?`, [email], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error." });

      const user = results[0];
      if (!user) {
        logActivity(null, "LOGIN", "FAIL", `Invalid email attempt: ${email}`);
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const match = bcrypt.compareSync(password, user.password_hash);
      if (!match) {
        logActivity(user.id, "LOGIN", "FAIL", "Incorrect password attempt.");
        return res.status(401).json({ error: "Incorrect password." });
      }

      // ✅ Check if approved by admin
      if (user.approved === 0) {
        logActivity(user.id, "LOGIN", "FAIL", "Account not approved yet.");
        return res.status(403).json({
          error: "Your account is pending admin approval. Please try again later.",
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin,
          approved: user.approved,
        },
        SECRET,
        { expiresIn: "5h" }
      );

      logActivity(user.id, "LOGIN", "SUCCESS", "User logged in successfully.");
      res.json({
        success: true,
        message: "✅ Login successful.",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          is_admin: user.is_admin,
          approved: user.approved,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET CURRENT USER INFO
 * Route: GET /api/auth/me
 * Requires: JWT Token
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    db.query(
      `SELECT id, full_name, email, is_admin, approved FROM users WHERE id = ?`,
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error." });

        const user = results[0];
        if (!user) return res.status(404).json({ error: "User not found." });

        res.json({ success: true, user });
      }
    );
  } catch (e) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * VERIFY TOKEN
 * Route: GET /api/auth/verify
 * Checks if JWT token is valid (for auto-login)
 */
router.get("/verify", authMiddleware, (req, res) => {
  try {
    res.json({
      valid: true,
      user: req.user,
    });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Invalid or expired token." });
  }
});

module.exports = router;
