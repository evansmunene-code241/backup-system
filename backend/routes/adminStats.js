const express = require("express");
const router = express.Router();
const { db } = require("../config/db");
const { authMiddleware, isAdminMiddleware } = require("../middleware/authMiddleware");

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(isAdminMiddleware);

// Get total users
router.get("/users", (req, res) => {
    db.query("SELECT COUNT(*) as count FROM users", (err, results) => {
        if (err) {
            console.error("Error fetching users count:", err);
            return res.status(500).json({ error: "Failed to fetch user stats" });
        }
        res.json({ count: results[0].count });
    });
});

// Get total files
router.get("/files", (req, res) => {
    db.query("SELECT COUNT(*) as count FROM files", (err, results) => {
        if (err) {
            console.error("Error fetching files count:", err);
            return res.status(500).json({ error: "Failed to fetch file stats" });
        }
        res.json({ count: results[0].count });
    });
});

// Get total backups
router.get("/backups", (req, res) => {
    db.query("SELECT COUNT(*) as count FROM backups", (err, results) => {
        if (err) {
            console.error("Error fetching backups count:", err);
            return res.status(500).json({ error: "Failed to fetch backup stats" });
        }
        res.json({ count: results[0].count });
    });
});

module.exports = router;