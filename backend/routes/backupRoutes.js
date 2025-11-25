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

    console.log("🔧 Starting backup process...");

    // Use the exact command that worked
    const dumpCommand = `C:\\xampp\\mysql\\bin\\mysqldump.exe -h localhost -u root kitengela_studio > "${backupFile}"`;

    console.log("Executing command:", dumpCommand);

    exec(dumpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Backup failed:", error.message);
        return res.status(500).json({ 
          success: false,
          error: `Backup failed: ${error.message}` 
        });
      }

      // Check if file was created
      setTimeout(() => {
        if (fs.existsSync(backupFile)) {
          const stats = fs.statSync(backupFile);
          console.log("✅ Backup file created! Size:", stats.size, "bytes");
          
          res.json({ 
            success: true,
            message: "✅ Backup created successfully.", 
            file: `backup-${timestamp}.sql`
          });
        } else {
          console.error("❌ Backup file was not created");
          res.status(500).json({ 
            success: false,
            error: "Backup file was not created" 
          });
        }
      }, 500);
    });

  } catch (err) {
    console.error("❌ Route error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to create backup." 
    });
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