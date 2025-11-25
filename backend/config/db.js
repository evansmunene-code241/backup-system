// backend/config/db.js
const mysql = require("mysql2");

// Configure connection pool with environment variables and fallbacks
const pool = mysql.createPool({
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kitengela_studio",
  port: process.env.DB_PORT || 3306,
  charset: "utf8mb4",
  timezone: "local",

  // ❌ Removed invalid options:
  // acquireTimeout, timeout, reconnect
});

// Enhanced connection test with better error handling
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err.message);

    if (err.code === "ECONNREFUSED") {
      console.error("💡 MySQL refused connection. Check if server is running.");
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("💡 Wrong username or password.");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("💡 Database does not exist.");
    }

    return;
  }

  console.log("🚀 Connected to MySQL database as ID " + connection.threadId);
  connection.release();
});

/**
 * Activity logging helper
 */
const logActivity = (userId, action, status, message = "") => {
  if (!action || !status) {
    console.error("Failed to log activity: action and status are required");
    return;
  }

  const sql =
    "INSERT INTO activity_logs (user_id, action, status, message, created_at) VALUES (?, ?, ?, ?, NOW())";

  pool.query(sql, [userId, action, status, message], (err) => {
    if (err) {
      console.error("Failed to log activity:", err.message);
    } else {
      console.log(`✅ Activity logged: ${action} - ${status}`);
    }
  });
};

// Pool error handling
pool.on("error", (err) => {
  console.error("🛑 Database pool error:", err.message);

  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("💡 Database connection was closed.");
  } else if (err.code === "ER_CON_COUNT_ERROR") {
    console.error("💡 Too many connections.");
  } else if (err.code === "ECONNREFUSED") {
    console.error("💡 Database connection refused.");
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down database connections...");
  pool.end((err) => {
    if (err) console.error("Error closing connections:", err);
    else console.log("✅ Database connections closed.");
    process.exit(0);
  });
});

// Export the pool
module.exports = {
  db: pool,
  logActivity,
  checkDatabaseHealth: () => {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) return reject(err);
        connection.ping((pingErr) => {
          connection.release();
          pingErr ? reject(pingErr) : resolve(true);
        });
      });
    });
  },
};
