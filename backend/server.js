const express = require("express");
const cors = require("cors");
const path = require("path");

// Initialize routes
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const backupRoutes = require("./routes/backupRoutes");

// Initialize DB connection
require("./config/database");

// Admin stats route
const adminStatsRoutes = require("./routes/adminStats");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/backups", express.static(path.join(__dirname, "backups")));
app.use(express.static(path.join(__dirname, "..", "frontend")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/admin/stats", adminStatsRoutes);

// Specific frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dashboard.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "admin_dashboard.html"));
});

// API fallback for undefined routes - FIXED:
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});