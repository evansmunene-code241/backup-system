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
  charset: 'utf8mb4',
  timezone: 'local',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Enhanced connection test with better error handling
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
    
    // Log specific error types for better debugging
    if (err.code === 'ECONNREFUSED') {
      console.error("💡 Database connection refused. Check if MySQL is running and credentials are correct.");
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 Access denied. Check database username and password.");
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error("💡 Database does not exist. Create the database first.");
    }
    
    return;
  }
  
  console.log("🚀 Connected to MySQL database as ID " + connection.threadId);
  connection.release(); // Release the connection
});

// Enhanced activity logging with validation
const logActivity = (userId, action, status, message = "") => {
  // Input validation
  if (!action || !status) {
    console.error("Failed to log activity: action and status are required");
    return;
  }

  const sql =
    "INSERT INTO activity_logs (user_id, action, status, message, created_at) VALUES (?, ?, ?, ?, NOW())";
  
  pool.query(sql, [userId, action, status, message], (err, results) => {
    if (err) {
      console.error("Failed to log activity:", err.message);
      // Don't throw error to avoid breaking the main application flow
    } else {
      console.log(`✅ Activity logged: ${action} - ${status}`);
    }
  });
};

// Enhanced error handling for pool
pool.on('error', (err) => {
  console.error('🛑 Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('💡 Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('💡 Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('💡 Database connection was refused.');
  }
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT. Closing database connections...');
  pool.end((err) => {
    if (err) {
      console.error('Error closing database connections:', err);
    } else {
      console.log('✅ Database connections closed.');
    }
    process.exit(0);
  });
});

// Export the pool as 'db' to keep routes compatible
module.exports = { 
  db: pool, 
  logActivity,
  // Helper function to check database health
  checkDatabaseHealth: () => {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          reject(err);
        } else {
          connection.ping((pingErr) => {
            connection.release();
            if (pingErr) {
              reject(pingErr);
            } else {
              resolve(true);
            }
          });
        }
      });
    });
  }
};