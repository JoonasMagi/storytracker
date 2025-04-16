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
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Create users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create projects table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('in-progress', 'completed', 'on-hold') DEFAULT 'in-progress',
        user_id INT NOT NULL,
        archived BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add description column to the projects table if it doesn't exist
    try {
      // Check if column exists first
      const [descriptionColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'projects' 
        AND COLUMN_NAME = 'description'
      `);
      
      if (descriptionColumns.length === 0) {
        await connection.query(`
          ALTER TABLE projects 
          ADD COLUMN description TEXT AFTER name
        `);
        console.log('Added description column to projects table');
      } else {
        console.log('description column already exists in projects table');
      }
    } catch (error) {
      console.error('Error checking or adding description column to projects table:', error);
    }
    
    // Add display_order column to the projects table if it doesn't exist
    try {
      // Check if column exists first
      const [orderColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'projects' 
        AND COLUMN_NAME = 'display_order'
      `);
      
      if (orderColumns.length === 0) {
        await connection.query(`
          ALTER TABLE projects 
          ADD COLUMN display_order INT DEFAULT 0 AFTER archived
        `);
        console.log('Added display_order column to projects table');
      } else {
        console.log('display_order column already exists in projects table');
      }
    } catch (error) {
      console.error('Error checking or adding display_order column to projects table:', error);
    }
    
    // Add updated_at column to the projects table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'projects' 
        AND COLUMN_NAME = 'updated_at'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE projects 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        console.log('Added updated_at column to projects table');
      } else {
        console.log('updated_at column already exists in projects table');
      }
    } catch (error) {
      console.error('Error checking or adding updated_at column to projects table:', error);
    }
    
    // Create stories table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        connextraFormat TEXT,
        tags JSON DEFAULT NULL,
        status ENUM('todo', 'in-progress', 'done') DEFAULT 'todo',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        assignee_id INT DEFAULT NULL,
        project_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Add updated_at column to the stories table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'updated_at'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE stories 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        console.log('Added updated_at column to stories table');
      } else {
        console.log('updated_at column already exists in stories table');
      }
    } catch (error) {
      console.error('Error checking or adding updated_at column to stories table:', error);
    }
    
    // Add connextraFormat column to the stories table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'connextraFormat'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE stories 
          ADD COLUMN connextraFormat TEXT AFTER description
        `);
        console.log('Added connextraFormat column to stories table');
      } else {
        console.log('connextraFormat column already exists in stories table');
      }
    } catch (error) {
      console.error('Error checking or adding connextraFormat column to stories table:', error);
    }
    
    // Add tags column to the stories table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'tags'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE stories 
          ADD COLUMN tags JSON DEFAULT NULL AFTER connextraFormat
        `);
        console.log('Added tags column to stories table');
      } else {
        console.log('tags column already exists in stories table');
      }
    } catch (error) {
      console.error('Error checking or adding tags column to stories table:', error);
    }
    
    // Add priority column to the stories table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'priority'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE stories 
          ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER status
        `);
        console.log('Added priority column to stories table');
      } else {
        console.log('priority column already exists in stories table');
      }
    } catch (error) {
      console.error('Error checking or adding priority column to stories table:', error);
    }
    
    // Add assignee_id column to the stories table if it doesn't exist
    try {
      // Check if column exists first
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'assignee_id'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE stories 
          ADD COLUMN assignee_id INT DEFAULT NULL AFTER priority,
          ADD CONSTRAINT fk_stories_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('Added assignee_id column to stories table');
      } else {
        console.log('assignee_id column already exists in stories table');
      }
    } catch (error) {
      console.error('Error checking or adding assignee_id column to stories table:', error);
    }
    
    // Create comments table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        story_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    if (connection) connection.release();
  }
}

// Initialize the database on startup
testConnection().then(() => initDatabase());

// Export the pool to be used in other modules
module.exports = pool;