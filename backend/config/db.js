javascript
// backend/config/db.js
const mysql = require("mysql2");

// Configure connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost", // Or your MySQL server IP
  user: "root", // Your MySQL username
  password: "", // Your MySQL password
  database: "kitengela_studio", // The database you created
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
    return;
  }
  console.log("🚀 Connected to MySQL database as ID " + connection.threadId);
  connection.release(); // Release the connection
});

/**
 * Logs an activity to the database
 */
const logActivity = (userId, action, status, message = "") => {
  const sql =
    "INSERT INTO activity_logs (user_id, action, status, message) VALUES (?, ?, ?, ?)";
  pool.query(sql, [userId, action, status, message], (err) => {
    if (err) {
      console.error("Failed to log activity:", err.message);
    }
  });
};

// Export the pool as 'db' to keep routes compatible
module.exports = { db: pool, logActivity };