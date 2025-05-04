// adminRoutes.js - Backend routes for admin functionality
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateToken, isAdmin } = require('./middleware/auth');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

/**
 * Middleware to verify admin access
 * This checks if the authenticated user has admin role
 */
router.use(authenticateToken);
router.use(isAdmin);

/**
 * Helper function to log admin activities
 * 
 * @param {number} userId - User ID performing the action
 * @param {string} actionType - Type of action
 * @param {string} actionDetails - Details about the action
 */
async function logActivity(userId, actionType, actionDetails) {
  try {
    const query = `
      INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
      VALUES ($1, $2, $3, NOW())
    `;
    
    await db.query(query, [userId, actionType, actionDetails]);
  } catch (err) {
    console.error('Error logging activity:', err);
    // Don't throw an error here, just log it
  }
}

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get total users count
    let totalUsers = 0;
    let totalSubmissions = 0;
    let pendingSubmissions = 0;
    let selectedSubmissions = 0;
    
    try {
      const usersResult = await db.query('SELECT COUNT(*) as total FROM users');
      totalUsers = parseInt(usersResult.rows[0].total);
    } catch (err) {
      console.error('Error counting users:', err);
      // Continue with default value
    }
    
    try {
      // Get total submissions count
      const submissionsResult = await db.query('SELECT COUNT(*) as total FROM submissions');
      totalSubmissions = parseInt(submissionsResult.rows[0].total);
    } catch (err) {
      console.error('Error counting submissions:', err);
      // Continue with default value
    }
    
    try {
      // Get pending submissions (status = 'Submitted')
      const pendingResult = await db.query('SELECT COUNT(*) as total FROM submissions WHERE status = $1', ['Submitted']);
      pendingSubmissions = parseInt(pendingResult.rows[0].total);
    } catch (err) {
      console.error('Error counting pending submissions:', err);
      // Continue with default value
    }
    
    try {
      // Get selected submissions (selected = true)
      const selectedResult = await db.query('SELECT COUNT(*) as total FROM submissions WHERE selected = true');
      selectedSubmissions = parseInt(selectedResult.rows[0].total);
    } catch (err) {
      console.error('Error counting selected submissions:', err);
      // Continue with default value
    }
    
    res.json({
      totalUsers,
      totalSubmissions,
      pendingSubmissions,
      selectedSubmissions
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    // Send default values instead of error response
    res.json({
      totalUsers: 0,
      totalSubmissions: 0,
      pendingSubmissions: 0,
      selectedSubmissions: 0
    });
  }
});

/**
 * @route   GET /api/admin/faculties/stats
 * @desc    Get faculty statistics
 * @access  Admin only
 */
router.get('/faculties/stats', async (req, res) => {
  try {
    // Get statistics per faculty
    const query = `
      SELECT 
        f.faculty_id,
        f.faculty_name,
        COUNT(DISTINCT s.submission_id) AS submission_count,
        COUNT(DISTINCT CASE WHEN s.selected = true THEN s.submission_id END) AS selected_count,
        COUNT(DISTINCT s.user_id) AS contributor_count
      FROM 
        faculties f
      LEFT JOIN 
        submissions s ON f.faculty_id = s.faculty_id
      GROUP BY 
        f.faculty_id, f.faculty_name
      ORDER BY 
        f.faculty_name ASC
    `;
    
    try {
      const result = await db.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing faculty stats query:', err);
      // Return empty array instead of error
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching faculty stats:', err);
    // Return empty array instead of error
    res.json([]);
  }
});

/**
 * @route   GET /api/admin/activity/recent
 * @desc    Get recent activity logs
 * @access  Admin only
 */
router.get('/activity/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent activity logs with user names
    const query = `
      SELECT 
        l.log_id,
        l.user_id,
        l.action_type,
        l.action_details,
        l.log_timestamp,
        u.first_name,
        u.last_name
      FROM 
        activitylogs l
      LEFT JOIN 
        users u ON l.user_id = u.user_id
      ORDER BY 
        l.log_timestamp DESC
      LIMIT $1
    `;
    
    try {
      const result = await db.query(query, [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing activity query:', err);
      // Return empty array instead of error
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    // Return empty array instead of error
    res.json([]);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get users with pagination and search
 * @access  Admin only
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    console.log('Fetching users with params:', { page, limit, search });
    
    // Build the search condition
    let searchCondition = '';
    let params = [limit, offset];
    
    if (search) {
      searchCondition = `
        WHERE 
          LOWER(first_name) LIKE $3 OR 
          LOWER(last_name) LIKE $3 OR 
          LOWER(email) LIKE $3
      `;
      params.push(`%${search.toLowerCase()}%`);
    }
    
    // Get users with pagination
    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.faculty_id, 
        u.role_id, 
        u.created_at, 
        u.last_login,
        f.faculty_name,
        r.role_name
      FROM 
        users u
      LEFT JOIN 
        faculties f ON u.faculty_id = f.faculty_id
      LEFT JOIN 
        roles r ON u.role_id = r.role_id
      ${searchCondition}
      ORDER BY 
        u.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    // Count total users for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users
      ${searchCondition}
    `;
    
    let usersResult = { rows: [] };
    let countResult = { rows: [{ total: 0 }] };
    
    try {
      usersResult = await db.query(query, params);
      countResult = await db.query(countQuery, search ? [`%${search.toLowerCase()}%`] : []);
    } catch (err) {
      console.error('Error executing users query:', err);
      // Continue with empty results
    }
    
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    // Log activity
    await logActivity(req.user.userId, 'View', 'Viewed user management page');
    
    res.json({
      users: usersResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    // Return default structured response
    res.json({
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/users', async (req, res) => {
  try {
    const { first_name, last_name, email, faculty_id, role_id, password } = req.body;
    
    console.log('Creating user with data:', {
      first_name, 
      last_name, 
      email, 
      faculty_id, 
      role_id,
      password: password ? '[REDACTED]' : undefined
    });
    
    // Validate required fields
    if (!first_name || !last_name || !email || !faculty_id || !role_id || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if email already exists
    const emailCheck = await db.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Normalize role_id to string if needed
    const normalizedRoleId = String(role_id);
    
    // Insert new user
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, faculty_id, role_id, password, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING user_id, first_name, last_name, email, faculty_id, role_id, created_at`,
      [
        first_name.trim(),
        last_name.trim(),
        email.toLowerCase().trim(),
        String(faculty_id),  // Ensure it's stored as string
        normalizedRoleId,
        hashedPassword
      ]
    );
    
    // Log activity
    await logActivity(
      req.user.userId, 
      'User Created',
      `Admin created user: ${first_name} ${last_name} (${email})`
    );
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update existing user
 * @access  Admin only
 */
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, email, faculty_id, role_id, password } = req.body;
    
    console.log(`Updating user ${userId} with data:`, {
      first_name, 
      last_name, 
      email, 
      faculty_id, 
      role_id,
      password: password ? '[REDACTED]' : undefined
    });
    
    // Validate required fields
    if (!first_name || !last_name || !email || !faculty_id || !role_id) {
      return res.status(400).json({ error: 'Name, email, faculty and role are required' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already used by another user
    const emailCheck = await db.query(
      'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
      [email.toLowerCase(), userId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
    
    // Normalize role_id to string if needed
    const normalizedRoleId = String(role_id);
    
    // Prepare update query
    let queryText;
    let queryParams;
    
    if (password) {
      // Hash password if provided
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      queryText = `
        UPDATE users 
        SET first_name = $1, last_name = $2, email = $3, faculty_id = $4, role_id = $5, password = $6
        WHERE user_id = $7
        RETURNING user_id, first_name, last_name, email, faculty_id, role_id
      `;
      queryParams = [
        first_name.trim(),
        last_name.trim(),
        email.toLowerCase().trim(),
        String(faculty_id),  // Ensure it's stored as string
        normalizedRoleId,
        hashedPassword,
        userId
      ];
    } else {
      // Update without changing password
      queryText = `
        UPDATE users 
        SET first_name = $1, last_name = $2, email = $3, faculty_id = $4, role_id = $5
        WHERE user_id = $6
        RETURNING user_id, first_name, last_name, email, faculty_id, role_id
      `;
      queryParams = [
        first_name.trim(),
        last_name.trim(),
        email.toLowerCase().trim(),
        String(faculty_id),  // Ensure it's stored as string
        normalizedRoleId,
        userId
      ];
    }
    
    const result = await db.query(queryText, queryParams);
    
    // Log activity
    await logActivity(
      req.user.userId, 
      'User Updated',
      `Admin updated user: ${first_name} ${last_name} (${email}), role: ${normalizedRoleId}`
    );
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists and get details for logging
    const userCheck = await db.query(
      'SELECT user_id, first_name, last_name, email FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userToDelete = userCheck.rows[0];
    
    // Prevent deleting self
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user
    await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
    
    // Log activity
    await logActivity(
      req.user.userId, 
      'User Deleted',
      `Admin deleted user: ${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email})`
    );
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * @route   GET /api/admin/submissions
 * @desc    Get submissions with pagination and filtering
 * @access  Admin only
 */
router.get('/submissions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const faculty = req.query.faculty || '';
    const status = req.query.status || '';
    const academicYear = req.query.academicYear || '';
    
    console.log('Submissions request received with params:', { 
      page, limit, search, faculty, status, academicYear 
    });
    
    // Add activity log
    await logActivity(
      req.user.userId,
      'View',
      'Viewed submissions management page'
    );
    
    // Build the query with filters
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        (SELECT COUNT(*) FROM comments c WHERE c.submission_id = s.submission_id) as comment_count
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    let paramIndex = 1;
    
    if (faculty) {
      query += ` AND s.faculty_id = $${paramIndex}`;
      countQuery += ` AND s.faculty_id = $${paramIndex}`;
      params.push(faculty);
      countParams.push(faculty);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      countQuery += ` AND s.status = $${paramIndex}`;
      params.push(status);
      countParams.push(status);
      paramIndex++;
    }
    
    if (academicYear) {
      query += ` AND s.academic_year = $${paramIndex}`;
      countQuery += ` AND s.academic_year = $${paramIndex}`;
      params.push(academicYear);
      countParams.push(academicYear);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (
        s.title ILIKE $${paramIndex} OR 
        s.description ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      countQuery += ` AND (
        s.title ILIKE $${paramIndex} OR 
        s.description ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
      paramIndex++;
    }
    
    // Add order by and pagination
    query += `
      ORDER BY s.submitted_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    try {
      // Execute queries
      const submissionsResult = await db.query(query, params);
      const countResult = await db.query(countQuery, countParams);
      
      const total = parseInt(countResult.rows[0].total);
      
      // Log the results for debugging
      console.log(`Found ${submissionsResult.rows.length} submissions out of ${total} total`);
      
      // Return the results with proper pagination metadata
      return res.json({
        submissions: submissionsResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (dbError) {
      console.error('Database error in submissions query:', dbError);
      
      // Return empty response with proper structure
      return res.json({
        submissions: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      });
    }
  } catch (err) {
    console.error('Error fetching submissions:', err);
    // Return structured response for error case
    return res.json({
      submissions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });
  }
});

/**
 * @route   GET /api/admin/submissions/:id
 * @desc    Get a specific submission with details
 * @access  Admin only
 */
router.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        f.faculty_name
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      JOIN
        faculties f ON s.faculty_id = f.faculty_id
      WHERE 
        s.submission_id = $1
    `;
    
    const result = await db.query(query, [submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching submission details:', err);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
});

/**
 * @route   GET /api/admin/submissions/:id/comments
 * @desc    Get comments for a submission
 * @access  Admin only
 */
router.get('/submissions/:id/comments', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    const query = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.role_id
      FROM 
        comments c
      JOIN
        users u ON c.user_id = u.user_id
      WHERE 
        c.submission_id = $1
      ORDER BY 
        c.commented_at DESC
    `;
    
    const result = await db.query(query, [submissionId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * @route   POST /api/admin/submissions/:id/comments
 * @desc    Add a comment to a submission
 * @access  Admin only
 */
router.post('/submissions/:id/comments', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { comment_text } = req.body;
    
    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    // Verify submission exists
    const checkQuery = 'SELECT submission_id FROM submissions WHERE submission_id = $1';
    const checkResult = await db.query(checkQuery, [submissionId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Add the comment
    const insertQuery = `
      INSERT INTO comments (submission_id, user_id, comment_text, commented_at, is_read)
      VALUES ($1, $2, $3, NOW(), false)
      RETURNING comment_id, comment_text, commented_at
    `;
    
    const insertResult = await db.query(insertQuery, [
      submissionId,
      req.user.userId,
      comment_text.trim()
    ]);
    
    // Get user details for the response
    const userQuery = 'SELECT first_name, last_name, role_id FROM users WHERE user_id = $1';
    const userResult = await db.query(userQuery, [req.user.userId]);
    
    // Combine comment with user details
    const newComment = {
      ...insertResult.rows[0],
      user_id: req.user.userId,
      first_name: userResult.rows[0].first_name,
      last_name: userResult.rows[0].last_name,
      role_id: userResult.rows[0].role_id
    };
    
    // Log activity
    await logActivity(
      req.user.userId,
      'Comment',
      `Added comment to submission #${submissionId}`
    );
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * @route   PATCH /api/admin/submissions/:id/status
 * @desc    Update submission status
 * @access  Admin only
 */
router.patch('/submissions/:id/status', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['Selected', 'Rejected', 'Submitted'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (Selected, Rejected, or Submitted)' });
    }
    
    // Verify submission exists
    const checkQuery = 'SELECT submission_id, title FROM submissions WHERE submission_id = $1';
    const checkResult = await db.query(checkQuery, [submissionId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submissionTitle = checkResult.rows[0].title;
    const selected = status === 'Selected'; // Set selected flag based on status
    
    // Update submission status
    const updateQuery = `
      UPDATE submissions
      SET status = $1, selected = $2, last_updated = NOW()
      WHERE submission_id = $3
      RETURNING submission_id, title, status, selected, last_updated
    `;
    
    const updateResult = await db.query(updateQuery, [status, selected, submissionId]);
    
    // Log activity
    await logActivity(
      req.user.userId,
      'Status Update',
      `Updated submission "${submissionTitle}" status to ${status}`
    );
    
    res.json({
      message: `Submission status updated to ${status}`,
      submission: updateResult.rows[0]
    });
  } catch (err) {
    console.error('Error updating submission status:', err);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
});

/**
 * @route   GET /api/admin/submissions/:id/download
 * @desc    Download submission file
 * @access  Admin only
 */
router.get('/submissions/:id/download', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Get file path
    const query = 'SELECT file_path, file_type, title FROM submissions WHERE submission_id = $1';
    const result = await db.query(query, [submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const { file_path, file_type, title } = result.rows[0];
    
    // Check if file exists
    const fullPath = path.join(__dirname, file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Determine content type
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
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${file_type}"`);
    
    // Log activity
    await logActivity(
      req.user.userId,
      'Download',
      `Downloaded file for submission "${title}"`
    );
    
    // Stream file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * @route   GET /api/admin/analytics/page-visits
 * @desc    Get page visit analytics
 * @access  Admin only
 */
router.get('/analytics/page-visits', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || 'week';
    let dateFilter;
    
    // Determine date range filter
    if (dateRange === 'week') {
      dateFilter = "visit_timestamp >= NOW() - INTERVAL '7 days'";
    } else if (dateRange === 'month') {
      dateFilter = "visit_timestamp >= NOW() - INTERVAL '30 days'";
    } else if (dateRange === 'year') {
      dateFilter = "visit_timestamp >= NOW() - INTERVAL '365 days'";
    } else {
      dateFilter = "TRUE"; // No filter
    }
    
    // Get page visits data grouped by URL
    const query = `
      SELECT 
        page_url,
        COUNT(*) as view_count
      FROM 
        page_visits
      WHERE 
        ${dateFilter}
      GROUP BY 
        page_url
      ORDER BY 
        view_count DESC
      LIMIT 10
    `;
    
    const result = await db.query(query);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching page visits:', err);
    res.status(500).json({ error: 'Failed to fetch page visit analytics' });
  }
});

/**
 * @route   GET /api/admin/analytics/browser-stats
 * @desc    Get browser usage statistics
 * @access  Admin only
 */
router.get('/analytics/browser-stats', async (req, res) => {
  try {
    // Parse browser information from user agent
    const query = `
      WITH browser_data AS (
        SELECT
          CASE
            WHEN browser_info LIKE '%Chrome%' AND browser_info NOT LIKE '%Edg%' THEN 'Chrome'
            WHEN browser_info LIKE '%Firefox%' THEN 'Firefox'
            WHEN browser_info LIKE '%Safari%' AND browser_info NOT LIKE '%Chrome%' THEN 'Safari'
            WHEN browser_info LIKE '%Edg%' THEN 'Edge'
            ELSE 'Other'
          END AS browser_name,
          CASE
            WHEN browser_info LIKE '%Chrome%' AND browser_info NOT LIKE '%Edg%' 
              THEN regexp_replace(browser_info, '.*Chrome/([0-9]+).*', '\\1')
            WHEN browser_info LIKE '%Firefox%' 
              THEN regexp_replace(browser_info, '.*Firefox/([0-9]+).*', '\\1')
            WHEN browser_info LIKE '%Safari%' AND browser_info NOT LIKE '%Chrome%'
              THEN regexp_replace(browser_info, '.*Safari/([0-9]+).*', '\\1')
            WHEN browser_info LIKE '%Edg%'
              THEN regexp_replace(browser_info, '.*Edg/([0-9]+).*', '\\1')
            ELSE NULL
          END AS browser_version,
          COUNT(DISTINCT user_id) as user_count
        FROM page_visits
        WHERE browser_info IS NOT NULL
        GROUP BY browser_name, browser_version
      )
      SELECT 
        browser_name,
        browser_version,
        user_count
      FROM browser_data
      ORDER BY user_count DESC
    `;
    
    // Fallback query if the regex fails
    const fallbackQuery = `
      SELECT
        CASE
          WHEN browser_info LIKE '%Chrome%' THEN 'Chrome'
          WHEN browser_info LIKE '%Firefox%' THEN 'Firefox'
          WHEN browser_info LIKE '%Safari%' THEN 'Safari'
          WHEN browser_info LIKE '%Edge%' OR browser_info LIKE '%Edg%' THEN 'Edge'
          ELSE 'Other'
        END AS browser_name,
        NULL AS browser_version,
        COUNT(DISTINCT user_id) as user_count
      FROM page_visits
      WHERE browser_info IS NOT NULL
      GROUP BY browser_name
      ORDER BY user_count DESC
    `;
    
    try {
      const result = await db.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing browser stats query, trying fallback:', err);
      const fallbackResult = await db.query(fallbackQuery);
      res.json(fallbackResult.rows);
    }
  } catch (err) {
    console.error('Error fetching browser stats:', err);
    res.status(500).json({ error: 'Failed to fetch browser statistics' });
  }
});

/**
 * @route   GET /api/admin/analytics/user-activity
 * @desc    Get user activity analytics
 * @access  Admin only
 */
router.get('/analytics/user-activity', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || 'week';
    let dateFilter;
    
    // Determine date filter based on range
    if (dateRange === 'week') {
      dateFilter = "log_timestamp >= NOW() - INTERVAL '7 days'";
    } else if (dateRange === 'month') {
      dateFilter = "log_timestamp >= NOW() - INTERVAL '30 days'";
    } else if (dateRange === 'year') {
      dateFilter = "log_timestamp >= NOW() - INTERVAL '365 days'";
    } else {
      dateFilter = "TRUE";
    }
    
    // Get user activity with user names
    const query = `
      SELECT 
        l.log_id,
        l.user_id,
        l.action_type,
        l.action_details,
        l.log_timestamp,
        u.first_name,
        u.last_name
      FROM 
        activitylogs l
      JOIN 
        users u ON l.user_id = u.user_id
      WHERE 
        ${dateFilter}
      ORDER BY 
        l.log_timestamp DESC
      LIMIT 50
    `;
    
    const result = await db.query(query);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    res.status(500).json({ error: 'Failed to fetch user activity data' });
  }
});

/**
 * @route   GET /api/admin/roles
 * @desc    Get all roles
 * @access  Admin only
 */
router.get('/roles', async (req, res) => {
  try {
    console.log('Fetching user roles');
    // Try to get roles from database
    try {
      const query = 'SELECT role_id, role_name, description FROM roles ORDER BY role_id';
      const result = await db.query(query);
      
      if (result.rows.length > 0) {
        console.log('Found roles in database:', result.rows);
        return res.json(result.rows);
      }
    } catch (dbError) {
      console.error('Error fetching roles from database:', dbError);
      // Continue to fallback if database query fails
    }
    
    // Fallback: Return hardcoded roles
    console.log('Using fallback hardcoded roles');
    const roles = [
      { role_id: 1, role_name: 'Administrator', description: 'Full system access' },
      { role_id: 2, role_name: 'Marketing Manager', description: 'University marketing manager' },
      { role_id: 3, role_name: 'Faculty Coordinator', description: 'Faculty marketing coordinator' },
      { role_id: 4, role_name: 'Student', description: 'Regular student user' }
    ];
    
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    // Return fallback roles even on error
    const roles = [
      { role_id: 1, role_name: 'Administrator', description: 'Full system access' },
      { role_id: 2, role_name: 'Marketing Manager', description: 'University marketing manager' },
      { role_id: 3, role_name: 'Faculty Coordinator', description: 'Faculty marketing coordinator' },
      { role_id: 4, role_name: 'Student', description: 'Regular student user' }
    ];
    res.json(roles);
  }
});

/**
 * @route   GET /api/admin/users/coordinators
 * @desc    Get all marketing coordinators
 * @access  Admin only
 */
router.get('/users/coordinators', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.faculty_id
      FROM 
        users u
      WHERE 
        u.role_id = 'COORD' OR u.role_id = '3'
      ORDER BY 
        u.last_name, u.first_name
    `;
    
    const result = await db.query(query);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching coordinators:', err);
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  }
});

/**
 * @route   POST /api/admin/activity/log
 * @desc    Log admin activity explicitly (for analytics)
 * @access  Admin only
 */
router.post('/activity/log', async (req, res) => {
  try {
    const { action_type, action_details } = req.body;
    
    if (!action_type) {
      return res.status(400).json({ error: 'Action type is required' });
    }
    
    // Use the logActivity helper function
    await logActivity(req.user.userId, action_type, action_details || null);
    
    res.status(201).json({
      message: 'Activity logged successfully'
    });
  } catch (err) {
    console.error('Error logging activity:', err);
    // Don't return error to client, just log it
    res.status(200).json({ message: 'Processed' });
  }
});

/**
 * @route   GET /api/admin/settings/academic
 * @desc    Get academic settings
 * @access  Admin only
 */
router.get('/settings/academic', async (req, res) => {
  try {
    console.log('Fetching academic settings');
    
    // Try to query the academic_settings table
    try {
      const query = 'SELECT * FROM academic_settings ORDER BY setting_id ASC LIMIT 1';
      const result = await db.query(query);
      
      if (result.rows.length > 0) {
        console.log('Found academic settings:', result.rows[0]);
        return res.json(result.rows[0]);
      }
      
      // If we got here, the table exists but has no rows
      console.log('Academic settings table exists but is empty. Inserting default values.');
      
      // Insert default values
      const insertQuery = `
        INSERT INTO academic_settings (academic_year, submission_deadline, final_edit_deadline)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const insertResult = await db.query(insertQuery, [
        '2024-2025',
        '2025-05-25',
        '2025-06-23'
      ]);
      
      return res.json(insertResult.rows[0]);
    } catch (dbError) {
      // If error contains "relation does not exist", the table doesn't exist
      if (dbError.message && dbError.message.includes('relation "academic_settings" does not exist')) {
        console.error('Academic settings table does not exist. Using default values.', dbError);
        // Return default values
        return res.json({
          academic_year: '2024-2025',
          submission_deadline: '2025-05-25',
          final_edit_deadline: '2025-06-23'
        });
      }
      
      // For any other database error, just log and continue to fallback
      console.error('Database error when fetching academic settings:', dbError);
    }
    
    // Fallback to default values
    console.log('Using fallback default academic settings');
    res.json({
      academic_year: '2024-2025',
      submission_deadline: '2025-05-25',
      final_edit_deadline: '2025-06-23'
    });
  } catch (err) {
    console.error('Error in academic settings endpoint:', err);
    // Always return something rather than an error
    res.json({
      academic_year: '2024-2025',
      submission_deadline: '2025-05-25',
      final_edit_deadline: '2025-06-23'
    });
  }
});

/**
 * @route   PUT /api/admin/settings/academic
 * @desc    Update academic settings
 * @access  Admin only
 */
router.put('/settings/academic', async (req, res) => {
  try {
    const { academic_year, submission_deadline, final_edit_deadline } = req.body;
    
    if (!academic_year || !submission_deadline || !final_edit_deadline) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('Updating academic settings with:', { academic_year, submission_deadline, final_edit_deadline });
    
    // Try to update the academic_settings table
    try {
      // First check if table exists by running a simple query
      try {
        await db.query('SELECT 1 FROM academic_settings LIMIT 1');
      } catch (tableCheckError) {
        // If error contains "relation does not exist", create the table
        if (tableCheckError.message && tableCheckError.message.includes('relation "academic_settings" does not exist')) {
          console.log('Creating academic_settings table...');
          await db.query(`
            CREATE TABLE academic_settings (
              setting_id SERIAL PRIMARY KEY,
              academic_year VARCHAR(20) NOT NULL,
              submission_deadline DATE NOT NULL,
              final_edit_deadline DATE NOT NULL,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
        } else {
          // For other errors, just throw
          throw tableCheckError;
        }
      }
      
      // Check if settings record exists
      const checkQuery = 'SELECT setting_id FROM academic_settings LIMIT 1';
      const checkResult = await db.query(checkQuery);
      
      let result;
      
      if (checkResult.rows.length > 0) {
        // Update existing record
        const settingId = checkResult.rows[0].setting_id;
        const updateQuery = `
          UPDATE academic_settings
          SET academic_year = $1, submission_deadline = $2, final_edit_deadline = $3, updated_at = NOW()
          WHERE setting_id = $4
          RETURNING *
        `;
        result = await db.query(updateQuery, [
          academic_year,
          submission_deadline,
          final_edit_deadline,
          settingId
        ]);
        
        console.log('Updated existing academic settings record:', result.rows[0]);
      } else {
        // Create new record
        const insertQuery = `
          INSERT INTO academic_settings (academic_year, submission_deadline, final_edit_deadline)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        result = await db.query(insertQuery, [
          academic_year,
          submission_deadline,
          final_edit_deadline
        ]);
        
        console.log('Inserted new academic settings record:', result.rows[0]);
      }
      
      // Log activity
      await logActivity(
        req.user.userId,
        'Settings Update',
        `Updated academic settings for ${academic_year}`
      );
      
      return res.json({
        message: 'Academic settings updated successfully',
        settings: result.rows[0]
      });
    } catch (dbError) {
      console.error('Database error when updating academic settings:', dbError);
      // For any database error, use a more graceful failure
      return res.status(500).json({ 
        error: 'Failed to update academic settings in database',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err) {
    console.error('Error in update academic settings endpoint:', err);
    res.status(500).json({ error: 'Failed to update academic settings' });
  }
});

module.exports = router;