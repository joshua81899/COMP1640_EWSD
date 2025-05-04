// auth.js - Authentication middleware with improved role handling
const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Utility function to normalize roles for consistent comparison
 * @param {string|number} role - Role ID or name
 * @returns {string} Normalized role identifier
 */
const normalizeRole = (role) => {
  if (role === 2 || role === '2' || role === 'MNGR') return 'MNGR';
  if (role === 1 || role === '1' || role === 'ADMIN') return 'ADMIN';
  if (role === 3 || role === '3' || role === 'COORD') return 'COORD';
  if (role === 4 || role === '4' || role === 'STUDT') return 'STUDT';
  return String(role);
};

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
    
    // Normalize role in user data
    if (decoded.role) {
      decoded.role = normalizeRole(decoded.role);
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to verify admin access
 */
const isAdmin = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    const query = 'SELECT role_id FROM users WHERE user_id = $1';
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = normalizeRole(result.rows[0].role_id);
    
    // Check if role is admin
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

/**
 * Middleware to verify marketing manager access
 */
const isManager = async (req, res, next) => {
  try {
    // Check if user exists and has manager role
    const query = 'SELECT role_id FROM users WHERE user_id = $1';
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = normalizeRole(result.rows[0].role_id);
    
    // Check if role is marketing manager
    if (userRole !== 'MNGR') {
      return res.status(403).json({ error: 'Marketing Manager access required' });
    }
    
    next();
  } catch (err) {
    console.error('Manager check error:', err);
    return res.status(500).json({ error: 'Failed to verify manager status' });
  }
};

/**
 * Middleware to verify coordinator access
 */
const isCoordinator = async (req, res, next) => {
  try {
    // Check if user exists and has coordinator role
    const query = 'SELECT role_id FROM users WHERE user_id = $1';
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = normalizeRole(result.rows[0].role_id);
    
    // Check if role is coordinator
    if (userRole !== 'COORD') {
      return res.status(403).json({ error: 'Faculty Coordinator access required' });
    }
    
    next();
  } catch (err) {
    console.error('Coordinator check error:', err);
    return res.status(500).json({ error: 'Failed to verify coordinator status' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isManager,
  isCoordinator,
  normalizeRole
};