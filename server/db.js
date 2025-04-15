// Load environment variables from .env file
require('dotenv').config();
const mysql = require('mysql2/promise');

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Passw0rd', // Set default password from .env
  database: process.env.DB_NAME || 'project', // Set default database from .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  // Not logging password for security reasons
});

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit the process, just log the error
    // process.exit(1);
  }
}

// Initial database setup function
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        preferences JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
    connection.release();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't exit the process, just log the error
    // process.exit(1);
  }
}

// Initialize the database on startup
testConnection().then(() => initDatabase());

// Export the pool to be used in other modules
module.exports = pool;