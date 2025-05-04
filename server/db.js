// db.js - Fixed database connection with error handling
require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool with better configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'university_magazine',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: 10000,
});

// Log connection events
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
  // Don't crash the server on connection errors, just log them
});

// Export a query method with better error handling
module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries for performance monitoring
      if (duration > 200) {
        console.log(`Slow query (${duration}ms): ${text}`);
      }
      
      return res;
    } catch (err) {
      // Add query text to the error for better debugging
      console.error(`Query error in ${Date.now() - start}ms:`, err.message);
      console.error('Query:', text);
      console.error('Parameters:', params);
      throw err;
    }
  },
  pool // Export pool for direct access if needed
};