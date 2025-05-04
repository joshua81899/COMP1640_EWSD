// index.js - Backend server with improved authentication handling
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Import routes
const adminRoutes = require('./adminRoutes');
const managerRoutes = require('./managerRoutes');
const coordinatorRoutes = require('./coordinatorRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS middleware to handle file downloads
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['Content-Disposition'] // Important for file downloads
}));

app.use(express.json());

// Debug middleware - logs all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Create a middleware to track page visits
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.includes('.')) {
    const logPageVisit = async () => {
      try {
        let userId = null;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
            userId = decoded.userId;
          } catch (err) {
            // Invalid token, continue without user ID
          }
        }
        
        await db.query(
          `INSERT INTO page_visits (user_id, page_url, visit_timestamp, browser_info, ip_address)
           VALUES ($1, $2, NOW(), $3, $4)`,
          [
            userId,
            req.path,
            req.headers['user-agent'] || null,
            req.ip || req.connection.remoteAddress
          ]
        );
      } catch (err) {
        console.error('Error logging page visit:', err);
      }
    };
    
    logPageVisit();
  }
  next();
});

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
  } catch (err) {
    console.error('Token verification error:', err.message);
    return null;
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

const prepareUpload = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (req.user) {
      const userDir = path.join(uploadDir, `user_${req.user.userId}`);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'image/jpeg', 'image/png', 'image/jpg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only DOC, DOCX, PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size exceeds the 10MB limit'
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      error: err.message
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'Database connection successful', 
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database connection test failed:', err);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

/**
 * @route   GET /api/public/academic-settings
 * @desc    Get academic settings for public access
 * @access  Public
 */
app.get('/api/public/academic-settings', async (req, res) => {
  try {
    // Query the academic settings from the database
    const query = 'SELECT * FROM academic_settings ORDER BY setting_id ASC LIMIT 1';
    const result = await db.query(query);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // Return default values if no settings are found
      res.json({
        academic_year: '2024-2025',
        submission_deadline: '2025-05-25',
        final_edit_deadline: '2025-06-23',
        publication_date: '2025-04-01'
      });
    }
  } catch (err) {
    console.error('Error fetching public academic settings:', err);
    // Return default values on error
    res.json({
      academic_year: '2024-2025',
      submission_deadline: '2025-05-25',
      final_edit_deadline: '2025-06-23',
      publication_date: '2025-04-01'
    });
  }
});

/**
 * @route   GET /api/public/submissions/:id/download
 * @desc    Download a selected submission file for public access
 * @access  Public (but only for selected submissions)
 */
app.get('/api/public/submissions/:id/download', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Only allow access to selected/approved submissions
    const query = `
      SELECT s.submission_id, s.title, s.file_path, s.file_type, s.selected, s.status
      FROM submissions s
      WHERE s.submission_id = $1 AND s.selected = true
    `;
    
    const result = await db.query(query, [submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not available for public access' });
    }
    
    const { file_path, title, file_type } = result.rows[0];
    
    // Check if file exists
    const fullPath = path.join(__dirname, file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Log this activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          null, // No user ID for public access
          'Public Download',
          `Public download of submission "${title}" (ID: ${submissionId})`
        ]
      );
    } catch (logError) {
      console.error('Error logging download activity:', logError);
    }
    
    // Determine content type based on file_type
    let contentType;
    switch(file_type) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'jpeg':
      case 'jpg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Set headers for file download - always as attachment, never inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${file_type}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error accessing public submission file:', err);
    res.status(500).json({ error: 'Failed to access file' });
  }
});

/**
 * @route   GET /api/submissions/:id/download
 * @desc    Download a submission file (with authentication)
 * @access  Private (with role-based permissions)
 */
app.get('/api/submissions/:id/download', authenticateToken, async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Get submission details
    const submissionQuery = `
      SELECT s.submission_id, s.user_id, s.title, s.file_path, s.file_type, s.faculty_id
      FROM submissions s
      WHERE s.submission_id = $1
    `;
    
    const submissionResult = await db.query(submissionQuery, [submissionId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submission = submissionResult.rows[0];
    
    // Get user role
    const userQuery = `SELECT role_id, faculty_id FROM users WHERE user_id = $1`;
    const userResult = await db.query(userQuery, [req.user.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const normalizedRole = typeof user.role_id === 'string' ? user.role_id : String(user.role_id);
    
    // Check permissions based on role
    // 1 or ADMIN = can access all submissions
    // 2 or MNGR = can access all selected submissions
    // 3 or COORD = can access submissions from their faculty
    // 4 or STUD = can access only their own submissions
    let hasPermission = false;
    
    if (normalizedRole === '1' || normalizedRole === 'ADMIN') {
      hasPermission = true;
    } else if (normalizedRole === '2' || normalizedRole === 'MNGR') {
      // Check if submission is selected
      const selectedQuery = `SELECT selected FROM submissions WHERE submission_id = $1`;
      const selectedResult = await db.query(selectedQuery, [submissionId]);
      hasPermission = selectedResult.rows[0]?.selected === true;
    } else if (normalizedRole === '3' || normalizedRole === 'COORD') {
      // Check if submission is from coordinator's faculty
      hasPermission = String(user.faculty_id) === String(submission.faculty_id);
    } else {
      // Student can only access their own submissions
      hasPermission = req.user.userId === submission.user_id;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to access this submission' });
    }
    
    const { file_path, title, file_type } = submission;
    
    // Check if file exists
    const fullPath = path.join(__dirname, file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Log this activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          req.user.userId,
          'Download',
          `Downloaded submission "${title}" (ID: ${submissionId})`
        ]
      );
    } catch (logError) {
      console.error('Error logging download activity:', logError);
    }
    
    // Determine content type based on file_type
    let contentType;
    switch(file_type) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'jpeg':
      case 'jpg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Set headers for file download - always as attachment, never inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${file_type}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Registration Endpoint - UPDATED
app.post('/api/auth/register', async (req, res) => {
  console.log('\n=== NEW REGISTRATION ATTEMPT ===');
  console.log('Request body:', { ...req.body, password: '[REDACTED]' });

  try {
    const { first_name, last_name, email, faculty_id, password } = req.body;
    
    if (!first_name || !last_name || !email || !faculty_id || !password) {
      return res.status(400).json({ 
        error: "All fields are required",
        required_fields: ['first_name', 'last_name', 'email', 'faculty_id', 'password']
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const userExists = await db.query(
      `SELECT user_id FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ 
        error: "Email already in use",
        suggestion: "Try resetting your password if this is your email"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Ensure faculty_id is stored as string
    const facultyIdStr = String(faculty_id);

    const newUser = await db.query(
      `INSERT INTO users 
       (first_name, last_name, email, password, faculty_id, role_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING user_id, first_name, last_name, email, faculty_id`,
      [
        first_name.trim(),
        last_name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        facultyIdStr, // Use the string version to ensure consistent handling
        4 // Student role
      ]
    );

    const token = jwt.sign(
      { 
        userId: newUser.rows[0].user_id,
        role: 4
      },
      process.env.JWT_SECRET || 'default_secret_for_development',
      { 
        expiresIn: '24h'
      }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].user_id,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        email: newUser.rows[0].email,
        faculty: newUser.rows[0].faculty_id,
        role: 4
      },
      expiresIn: 3600
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      error: "Registration failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('\n=== NEW LOGIN ATTEMPT ===');
  console.log('Request body:', { ...req.body, password: '[REDACTED]' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required"
      });
    }

    let userResult;
    try {
      userResult = await db.query(
        `SELECT user_id, first_name, last_name, email, password, faculty_id, role_id, last_login
        FROM users 
        WHERE email = $1`,
        [email.toLowerCase().trim()]
      );
    } catch (dbError) {
      console.error('Database error when finding user:', dbError);
      return res.status(500).json({ 
        error: "Login failed due to database error",
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    
    let isValidPassword = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      isValidPassword = (password === user.password);
      
      if (isValidPassword) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await db.query(
            `UPDATE users SET password = $1 WHERE user_id = $2`,
            [hashedPassword, user.user_id]
          );
        } catch (hashError) {
          console.error('Error upgrading password to hashed version:', hashError);
        }
      }
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      await db.query(
        `UPDATE users SET last_login = NOW() WHERE user_id = $1`,
        [user.user_id]
      );
    } catch (updateError) {
      console.error('Failed to update last login time:', updateError);
    }

    // Log login activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          user.user_id, 
          'Login',
          `User logged in from ${req.ip || req.connection.remoteAddress}`
        ]
      );
    } catch (logError) {
      console.error('Error logging login activity:', logError);
    }

    const token = jwt.sign(
      { 
        userId: user.user_id,
        role: user.role_id
      },
      process.env.JWT_SECRET || 'default_secret_for_development',
      { 
        expiresIn: '24h'
      }
    );

    res.status(200).json({
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        faculty: user.faculty_id,
        role: user.role_id,
        lastLogin: user.last_login
      },
      expiresIn: 3600
    });

  } catch (err) {
    console.error('Unexpected login error:', err);
    res.status(500).json({ 
      error: "Login failed due to server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get current user info
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.faculty_id, 
        u.role_id, 
        u.last_login,
        f.faculty_name
      FROM 
        users u
      LEFT JOIN 
        faculties f ON u.faculty_id = f.faculty_id
      WHERE 
        u.user_id = $1`,
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get faculty list
app.get('/api/faculties', async (req, res) => {
  try {
    const faculties = await db.query('SELECT faculty_id, faculty_name, description FROM faculties ORDER BY faculty_name');
    res.json(faculties.rows);
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ error: "Failed to retrieve faculties" });
  }
});

// Public submissions endpoint
app.get('/api/public/submissions', async (req, res) => {
  try {
    console.log('Public submissions API called with query:', req.query);
    const { faculty, academicYear, search } = req.query;
    
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email
      FROM 
        submissions s
      LEFT JOIN
        users u ON s.user_id = u.user_id
      WHERE 
        s.status = 'Selected'`;
    
    const params = [];
    let paramIndex = 1;
    
    if (faculty && faculty.trim() !== '') {
      params.push(String(faculty.trim())); // Ensure faculty is string
      query += ` AND s.faculty_id = $${paramIndex++}`;
    }
    
    if (academicYear && academicYear.trim() !== '') {
      params.push(academicYear);
      query += ` AND s.academic_year = $${paramIndex++}`;
    }
    
    if (search && search.trim() !== '') {
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam);
      query += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`;
      paramIndex++;
    }
    
    query += ` ORDER BY s.submitted_at DESC`;
    
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    try {
      const result = await db.query(query, params);
      console.log(`Found ${result.rows.length} public submissions`);
      res.json(result.rows);
    } catch (queryError) {
      console.error('Error executing main query:', queryError);
      
      try {
        console.log('Attempting fallback query...');
        const fallbackQuery = 'SELECT * FROM submissions WHERE status = $1 LIMIT 10';
        const fallbackResult = await db.query(fallbackQuery, ['Selected']);
        
        console.log(`Fallback found ${fallbackResult.rows.length} submissions`);
        res.json(fallbackResult.rows);
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        throw new Error('Both main and fallback queries failed');
      }
    }
  } catch (err) {
    console.error('Error in public submissions endpoint:', err);
    res.status(500).json({ 
      error: 'Failed to fetch submissions',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
});

// Get submissions for authenticated users
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT role_id, faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const { faculty, academicYear, search } = req.query;
    
    let query;
    let params;
    
    if (user.role_id === 1 || user.role_id === 'ADMIN') {
      query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM 
          submissions s
        LEFT JOIN
          users u ON s.user_id = u.user_id`;
      params = [];
    } else if (user.role_id === 2 || user.role_id === 'MNGR') {
      query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM 
          submissions s
        LEFT JOIN
          users u ON s.user_id = u.user_id
        WHERE 
          s.status = $1`;
      params = ['Selected'];
    } else if (user.role_id === 3 || user.role_id === 'COORD') {
      query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM 
          submissions s
        LEFT JOIN
          users u ON s.user_id = u.user_id
        WHERE 
          s.faculty_id = $1`;
      params = [String(user.faculty_id)];
    } else {
      query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM 
          submissions s
        LEFT JOIN
          users u ON s.user_id = u.user_id
        WHERE 
          s.user_id = $1`;
      params = [req.user.userId];
    }
    
    if (faculty && (user.role_id === 1 || user.role_id === 'ADMIN')) {
      query += params.length ? ' AND' : ' WHERE';
      query += ' s.faculty_id = $' + (params.length + 1);
      params.push(String(faculty)); // Ensure faculty is string
    }
    
    if (academicYear) {
      query += params.length ? ' AND' : ' WHERE';
      query += ' s.academic_year = $' + (params.length + 1);
      params.push(academicYear);
    }
    
    if (search) {
      query += params.length ? ' AND' : ' WHERE';
      query += ' (s.title ILIKE $' + (params.length + 1) + ' OR s.description ILIKE $' + (params.length + 1) + ')';
      params.push('%' + search + '%');
    }
    
    query += ' ORDER BY s.submitted_at DESC';
    
    const submissionsResult = await db.query(query, params);
    res.json(submissionsResult.rows);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Create a new submission (UPDATED VERSION WITH FILE TYPE HANDLING)
app.post('/api/submissions', prepareUpload, upload.single('file'), async (req, res) => {
  console.log('\n=== NEW SUBMISSION ATTEMPT ===');
  console.log('Request body:', req.body);
  console.log('File:', req.file);
  
  try {
    const { title, description, academicYear, termsAccepted } = req.body;
    
    if (!title || !req.file || !academicYear) {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Deleted file after validation failure: ${req.file.path}`);
        } catch (deleteErr) {
          console.error('Error deleting file - terms not accepted:', deleteErr);
        }
      }
      return res.status(400).json({ error: "Terms and conditions must be accepted" });
    }
    
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Deleted file - user not found: ${req.file.path}`);
        } catch (deleteErr) {
          console.error('Error deleting file - user not found:', deleteErr);
        }
      }
      return res.status(404).json({ error: 'User not found or faculty information missing' });
    }
    
    // Determine file type from extension
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let fileType;
    
    switch(fileExt) {
      case '.pdf':
        fileType = 'pdf';
        break;
      case '.doc':
        fileType = 'doc';
        break;
      case '.docx':
        fileType = 'docx';
        break;
      case '.jpg':
      case '.jpeg':
        fileType = 'jpeg';
        break;
      case '.png':
        fileType = 'png';
        break;
      default:
        fileType = 'other';
    }

    const relativePath = req.file.path.replace(__dirname, '');
    // Convert faculty_id to string to match database type
    const userFaculty = String(userResult.rows[0].faculty_id);
    
    const submissionResult = await db.query(
      `INSERT INTO submissions
        (user_id, title, description, file_path, file_type, submitted_at, status, terms_accepted, academic_year, selected, faculty_id)
      VALUES
        ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10)
      RETURNING submission_id, title, status, submitted_at`,
      [
        req.user.userId,
        title,
        description || null,
        relativePath,
        fileType,
        'Submitted',
        true,
        academicYear,
        false,
        userFaculty
      ]
    );
    
    const newSubmission = submissionResult.rows[0];
    
    // Log the activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
        VALUES ($1, $2, $3, NOW())`,
        [
          req.user.userId, 
          'Submission',
          `Created new submission "${title}"`
        ]
      );
    } catch (logError) {
      console.error('Error logging submission activity:', logError);
    }
    
    res.status(201).json({
      message: 'Submission created successfully',
      submission: newSubmission
    });
      
  } catch (err) {
    console.error('Error creating submission:', err);
    
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Deleted file ${req.file.path} after submission error`);
      } catch (deleteErr) {
        console.error('Error deleting file after submission error:', deleteErr);
      }
    }
    
    let errorMessage = 'Failed to create submission';
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File size exceeds the 10MB limit';
    } else if (err.message.includes('Invalid file type')) {
      errorMessage = err.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
});

// Add coordinator routes
app.use('/api/coordinator', coordinatorRoutes);

// Add manager routes
app.use('/api/manager', managerRoutes);

// Add admin routes
app.use('/api/admin', adminRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`Register endpoint: http://localhost:${PORT}/api/auth/register`);
  console.log(`Admin endpoints: http://localhost:${PORT}/api/admin/*`);
  console.log(`Manager endpoints: http://localhost:${PORT}/api/manager/*`);
  console.log(`Coordinator endpoints: http://localhost:${PORT}/api/coordinator/*`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;