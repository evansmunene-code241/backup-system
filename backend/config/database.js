// backend/config/database.js
const { db } = require("./db"); // Import the MySQL pool

const createTables = () => {
  const sqlQueries = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        approved BOOLEAN DEFAULT false
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

  // Close the pool after a delay to allow queries to finish
  setTimeout(() => db.end(), 1000);
};

createTables();