const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { db, logActivity } = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
const backupsDir = path.join(__dirname, "..", "backups");

// ✅ Ensure directories exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

// ✅ Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // Safe fallback for user ID
    const userId = req.user?.id || "anonymous";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, userId + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Upload a File
router.post("/upload", [authMiddleware, upload.single("file")], async (req, res) => {
  try {
    console.log("📁 Upload request:", { user: req.user, file: req.file });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { originalname, path: storage_path, size, filename } = req.file;
    const user_id = req.user?.id || null;

    db.query(
      `INSERT INTO files (user_id, original_name, storage_path, file_size)
       VALUES (?, ?, ?, ?)`,
      [user_id, originalname, storage_path, size],
      (err, results) => {
        if (err) {
          logActivity(user_id, "UPLOAD", "FAIL", err.message);
          return res.status(500).json({ error: err.message });
        }

        // ✅ Create backup copy
        const backupPath = path.join(backupsDir, filename);
        try {
          fs.copyFileSync(storage_path, backupPath);
        } catch (copyErr) {
          console.error("❌ Backup copy failed:", copyErr);
        }

        logActivity(user_id, "UPLOAD", "SUCCESS", `File: ${originalname}`);
        res.json({
          success: true,
          message: "✅ File uploaded successfully!",
          fileId: results.insertId,
        });
      }
    );
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ List user’s uploaded files (fixed Invalid Date)
router.get("/list", authMiddleware, (req, res) => {
  db.query(
    `SELECT original_name AS filename, 'Uploaded' AS status, upload_date AS created_at
     FROM files WHERE user_id = ? ORDER BY upload_date DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      // ✅ Format MySQL DATETIME → ISO for frontend reliability
      const formattedResults = results.map((file) => ({
        ...file,
        created_at: file.created_at
          ? new Date(file.created_at).toISOString()
          : null,
      }));

      res.json(formattedResults);
    }
  );
});

module.exports = router;

