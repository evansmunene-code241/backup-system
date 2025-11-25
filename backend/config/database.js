// backend/config/database.js
const { db } = require("./db");

const createTables = () => {
  const sqlQueries = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        storage_path VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Pending',
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS backups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        backup_type ENUM('database', 'full') DEFAULT 'database',
        status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
        file_size VARCHAR(50),
        created_by INT,
        is_automatic BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `
  ];

  sqlQueries.forEach((sql) => {
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("✅ Table created or already exists.");
      }
    });
  });

  // Create default admin user
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.query(
    `INSERT IGNORE INTO users (full_name, email, password_hash, is_admin, approved) 
     VALUES (?, ?, ?, true, true)`,
    ['System Admin', 'admin@kitengela.com', adminPassword],
    (err) => {
      if (err) {
        console.error('Error creating admin user:', err.message);
      } else {
        console.log('✅ Default admin user created: admin@kitengela.com / admin123');
      }
    }
  );
};

// Don't call createTables() here if it's being required in server.js
// createTables();

module.exports = { createTables };