const express = require("express");
const router = express.Router();
const { db, logActivity } = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");

// ✅ Admin-only middleware
router.use(authMiddleware, (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

// 🧾 Get all users
router.get("/users", (req, res) => {
  db.query(
    "SELECT id, full_name, email, is_admin, approved FROM users WHERE id != ?",
    [req.user.id],
    (err, results) => {
      if (err) {
        logActivity(req.user.id, "FETCH_USERS", "FAIL", err.message);
        return res.status(500).json({ message: "Error fetching users." });
      }
      res.json(results);
    }
  );
});

// ✅ Approve user
router.put("/users/approve/:id", (req, res) => {
  const userId = req.params.id;
  db.query("UPDATE users SET approved = 1 WHERE id = ?", [userId], (err, results) => {
    if (err) {
      logActivity(req.user.id, "APPROVE_USER", "FAIL", err.message);
      return res.status(500).json({ message: "Error approving user." });
    }
    if (results.affectedRows === 0)
      return res.status(404).json({ message: "User not found." });

    logActivity(req.user.id, "APPROVE_USER", "SUCCESS", `Approved user ID ${userId}`);
    res.json({ success: true, message: "✅ User approved successfully!" });
  });
});

// ❌ Delete user
router.delete("/users/delete/:id", (req, res) => {
  const userId = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      logActivity(req.user.id, "DELETE_USER", "FAIL", err.message);
      return res.status(500).json({ message: "Error deleting user." });
    }
    if (results.affectedRows === 0)
      return res.status(404).json({ message: "User not found." });

    logActivity(req.user.id, "DELETE_USER", "SUCCESS", `Deleted user ID ${userId}`);
    res.json({ success: true, message: "🗑️ User deleted successfully!" });
  });
});

// 📁 Get all files
router.get("/files", (req, res) => {
  db.query(
    `SELECT f.id, f.original_name AS filename, f.status, f.upload_date, u.full_name AS uploaded_by
     FROM files f JOIN users u ON f.user_id = u.id ORDER BY f.upload_date DESC`,
    (err, results) => {
      if (err) {
        logActivity(req.user.id, "FETCH_FILES", "FAIL", err.message);
        return res.status(500).json({ message: "Error fetching files." });
      }
      res.json(results);
    }
  );
});

// ✅ Approve file
router.patch("/files/approve/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  db.query("UPDATE files SET status = 'Approved' WHERE id = ?", [fileId], (err, results) => {
    if (err) {
      logActivity(req.user.id, "APPROVE_FILE", "FAIL", err.message);
      return res.status(500).json({ message: "Error approving file." });
    }
    if (results.affectedRows === 0)
      return res.status(404).json({ message: "File not found." });

    logActivity(req.user.id, "APPROVE_FILE", "SUCCESS", `Approved file ID ${fileId}`);
    res.json({ success: true, message: "✅ File approved successfully!" });
  });
});

// ❌ Delete file
router.delete("/files/delete/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  db.query("DELETE FROM files WHERE id = ?", [fileId], (err, results) => {
    if (err) {
      logActivity(req.user.id, "DELETE_FILE", "FAIL", err.message);
      return res.status(500).json({ message: "Error deleting file." });
    }
    if (results.affectedRows === 0)
      return res.status(404).json({ message: "File not found." });

    logActivity(req.user.id, "DELETE_FILE", "SUCCESS", `Deleted file ID ${fileId}`);
    res.json({ success: true, message: "🗑️ File deleted successfully!" });
  });
});

// 🧾 Get all logs
router.get("/logs", (req, res) => {
  db.query(
    `SELECT a.id, a.user_id, u.full_name AS user_name, a.action, a.status, a.message, a.timestamp
     FROM activity_logs a JOIN users u ON a.user_id = u.id
     ORDER BY a.timestamp DESC LIMIT 100`,
    (err, results) => {
      if (err) {
        logActivity(req.user.id, "FETCH_LOGS", "FAIL", err.message);
        return res.status(500).json({ message: "Error fetching logs." });
      }
      res.json(results);
    }
  );
});

// ✅ Admin API fallback
router.use((req, res) => res.status(404).json({ message: "Admin API route not found." }));

module.exports = router;
