const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const db = require("../config/db");

// 📁 Directory to store backup files
const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

/**
 * 🧩 GET /api/backup/list
 * Returns a list of all available backups.
 */
router.get("/list", async (req, res) => {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".sql"))
      .map((file) => ({
        name: file,
        date: fs.statSync(path.join(backupDir, file)).mtime,
      }))
      .sort((a, b) => b.date - a.date);

    res.json(files);
  } catch (err) {
    console.error("Error listing backups:", err);
    res.status(500).json({ error: "Failed to list backups." });
  }
});

/**
 * 💾 POST /api/backup/database
 * Creates a new MySQL database backup file.
 */
router.post("/database", async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    // Use environment variables for DB credentials
    const dbHost = process.env.DB_HOST || "localhost";
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASS || "";
    const dbName = process.env.DB_NAME || "backup_system";

    const dumpCommand = `mysqldump -h ${dbHost} -u ${dbUser} ${dbPass ? `-p${dbPass}` : ""} ${dbName} > "${backupFile}"`;

    exec(dumpCommand, (error) => {
      if (error) {
        console.error("Backup creation failed:", error);
        return res.status(500).json({ error: "Backup failed." });
      }

      res.json({ message: "✅ Backup created successfully.", file: `backup-${timestamp}.sql` });
    });
  } catch (err) {
    console.error("Error creating backup:", err);
    res.status(500).json({ error: "Failed to create backup." });
  }
});

/**
 * 📦 GET /api/backup/download/:name
 * Downloads a specific backup file.
 */
router.get("/download/:name", (req, res) => {
  const filePath = path.join(backupDir, req.params.name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).json({ error: "Error downloading backup file." });
    }
  });
});

module.exports = router;
