// coordinatorRoutes.js - Backend routes for faculty coordinator functionality
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateToken, isCoordinator } = require('./middleware/auth');
const path = require('path');
const fs = require('fs');

/**
 * Apply middleware for all coordinator routes
 */
router.use(authenticateToken);
router.use(isCoordinator);

/**
 * @route   GET /api/coordinator/dashboard/stats
 * @desc    Get dashboard statistics for coordinator's faculty
 * @access  Coordinator only
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Initialize statistics
    let totalSubmissions = 0;
    let pendingComments = 0;
    let selectedSubmissions = 0;
    let totalContributors = 0;
    
    try {
      // Get total submissions count for faculty
      const submissionsResult = await db.query(
        'SELECT COUNT(*) as total FROM submissions WHERE faculty_id = $1',
        [facultyId]
      );
      totalSubmissions = parseInt(submissionsResult.rows[0].total);
      
      // Get submissions without comments (within 14 days)
      const pendingResult = await db.query(
        `SELECT COUNT(*) as total FROM submissions s
         LEFT JOIN (
           SELECT submission_id, COUNT(*) as comment_count
           FROM comments
           GROUP BY submission_id
         ) c ON s.submission_id = c.submission_id
         WHERE s.faculty_id = $1
           AND s.submitted_at > NOW() - INTERVAL '14 days'
           AND (c.comment_count IS NULL OR c.comment_count = 0)`,
        [facultyId]
      );
      pendingComments = parseInt(pendingResult.rows[0].total);
      
      // Get selected submissions count
      const selectedResult = await db.query(
        'SELECT COUNT(*) as total FROM submissions WHERE faculty_id = $1 AND selected = true',
        [facultyId]
      );
      selectedSubmissions = parseInt(selectedResult.rows[0].total);
      
      // Get unique contributors count
      const contributorsResult = await db.query(
        'SELECT COUNT(DISTINCT user_id) as total FROM submissions WHERE faculty_id = $1',
        [facultyId]
      );
      totalContributors = parseInt(contributorsResult.rows[0].total);
    } catch (err) {
      console.error('Error counting faculty stats:', err);
      // Continue with default values
    }
    
    res.json({
      facultyId,
      totalSubmissions,
      pendingComments,
      selectedSubmissions,
      totalContributors
    });
  } catch (err) {
    console.error('Error fetching coordinator dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * @route   GET /api/coordinator/faculty
 * @desc    Get coordinator's faculty information
 * @access  Coordinator only
 */
router.get('/faculty', async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT u.faculty_id, f.faculty_name, f.description FROM users u JOIN faculties f ON u.faculty_id = f.faculty_id WHERE u.user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Error fetching faculty information:', err);
    res.status(500).json({ error: 'Failed to fetch faculty information' });
  }
});

/**
 * @route   GET /api/coordinator/submissions
 * @desc    Get submissions for coordinator's faculty
 * @access  Coordinator only
 */
router.get('/submissions', async (req, res) => {
  try {
    console.log('Received submissions request:', req.query);
    const { page = 1, limit = 10, status, search, needsComment } = req.query;
    const offset = (page - 1) * limit;
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      console.log('Faculty not found for user:', req.user.userId);
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    console.log('Faculty ID from user:', facultyId);
    
    // Build base query
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        COALESCE(c.comment_count, 0) as comment_count,
        CASE 
          WHEN c.comment_count IS NULL OR c.comment_count = 0 THEN true 
          ELSE false 
        END as needs_comment,
        CASE 
          WHEN s.submitted_at > NOW() - INTERVAL '14 days' 
               AND (c.comment_count IS NULL OR c.comment_count = 0) 
          THEN true 
          ELSE false 
        END as needs_urgent_comment
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY submission_id
      ) c ON s.submission_id = c.submission_id
      WHERE 
        s.faculty_id = $1`;
    
    const queryParams = [facultyId];
    let paramIndex = 2;
    
    // Add status filter if provided
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // Add search filter if provided
    if (search) {
      query += ` AND (
        s.title ILIKE $${paramIndex} OR 
        s.description ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add needs comment filter if provided
    if (needsComment === 'true') {
      query += ` AND (c.comment_count IS NULL OR c.comment_count = 0)`;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY 
                CASE 
                  WHEN s.submitted_at > NOW() - INTERVAL '14 days' 
                      AND (c.comment_count IS NULL OR c.comment_count = 0) 
                  THEN 0 
                  ELSE 1 
                END,
                s.submitted_at DESC
              LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    queryParams.push(parseInt(limit), offset);
    
    console.log('Query:', query);
    console.log('Params:', queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY submission_id
      ) c ON s.submission_id = c.submission_id
      WHERE s.faculty_id = $1
      ${status ? ' AND s.status = $2' : ''}
      ${search ? ` AND (
        s.title ILIKE $${status ? 3 : 2} OR 
        s.description ILIKE $${status ? 3 : 2} OR
        s.user_id IN (
          SELECT user_id FROM users 
          WHERE first_name ILIKE $${status ? 3 : 2} OR last_name ILIKE $${status ? 3 : 2}
        )
      )` : ''}
      ${needsComment === 'true' ? ' AND (c.comment_count IS NULL OR c.comment_count = 0)' : ''}
    `;
    
    const countParams = [facultyId];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);
    
    console.log('Count query:', countQuery);
    console.log('Count params:', countParams);
    
    const submissionsResult = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, countParams);
    
    console.log('Results count:', submissionsResult.rows.length);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      submissions: submissionsResult.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching faculty submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * @route   GET /api/coordinator/submissions/:id
 * @desc    Get a specific submission with comments
 * @access  Coordinator only
 */
router.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get submission details
    const submissionQuery = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      WHERE 
        s.submission_id = $1 AND s.faculty_id = $2
    `;
    
    const submissionResult = await db.query(submissionQuery, [submissionId, facultyId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not in your faculty' });
    }
    
    // Get comments for the submission
    const commentsQuery = `
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
    
    const commentsResult = await db.query(commentsQuery, [submissionId]);
    
    // Combine submission and comments
    const result = {
      submission: submissionResult.rows[0],
      comments: commentsResult.rows
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching submission details:', err);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
});

/**
 * @route   POST /api/coordinator/submissions/:id/comments
 * @desc    Add a comment to a submission
 * @access  Coordinator only
 */
router.post('/submissions/:id/comments', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { comment_text } = req.body;
    
    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Verify submission belongs to the coordinator's faculty
    const submissionQuery = `
      SELECT submission_id FROM submissions 
      WHERE submission_id = $1 AND faculty_id = $2
    `;
    
    const submissionResult = await db.query(submissionQuery, [submissionId, facultyId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not in your faculty' });
    }
    
    // Add the comment - note the column name is commented_at not comment_at
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
    const userDetailsQuery = `
      SELECT first_name, last_name, role_id 
      FROM users 
      WHERE user_id = $1
    `;
    
    const userDetailsResult = await db.query(userDetailsQuery, [req.user.userId]);
    
    // Combine comment with user details
    const newComment = {
      ...insertResult.rows[0],
      user_id: req.user.userId,
      first_name: userDetailsResult.rows[0].first_name,
      last_name: userDetailsResult.rows[0].last_name,
      role_id: userDetailsResult.rows[0].role_id
    };
    
    // Log the activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          req.user.userId, 
          'Comment',
          `Added comment to submission #${submissionId}`
        ]
      );
    } catch (logError) {
      console.error('Error logging comment activity:', logError);
    }
    
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
 * @route   PATCH /api/coordinator/submissions/:id/select
 * @desc    Select a submission for publication
 * @access  Coordinator only
 */
router.patch('/submissions/:id/select', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { selected } = req.body;
    
    if (selected === undefined) {
      return res.status(400).json({ error: 'Selected status is required' });
    }
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Verify submission belongs to the coordinator's faculty
    const submissionQuery = `
      SELECT submission_id, title FROM submissions 
      WHERE submission_id = $1 AND faculty_id = $2
    `;
    
    const submissionResult = await db.query(submissionQuery, [submissionId, facultyId]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not in your faculty' });
    }
    
    // Update the submission status
    const updateQuery = `
      UPDATE submissions
      SET selected = $1, status = $2
      WHERE submission_id = $3
      RETURNING submission_id, title, selected, status
    `;
    
    const status = selected ? 'Selected' : 'Submitted';
    const updateResult = await db.query(updateQuery, [selected, status, submissionId]);
    
    // Log the activity
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          req.user.userId, 
          'Selection',
          `${selected ? 'Selected' : 'Unselected'} submission "${submissionResult.rows[0].title}"`
        ]
      );
    } catch (logError) {
      console.error('Error logging selection activity:', logError);
    }
    
    res.json({
      message: `Submission ${selected ? 'selected' : 'unselected'} successfully`,
      submission: updateResult.rows[0]
    });
  } catch (err) {
    console.error('Error updating submission selection:', err);
    res.status(500).json({ error: 'Failed to update submission selection' });
  }
});

/**
 * @route   GET /api/coordinator/students
 * @desc    Get students in coordinator's faculty
 * @access  Coordinator only
 */
router.get('/students', async (req, res) => {
  try {
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get students from the faculty
    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email,
        COUNT(s.submission_id) as submission_count,
        COUNT(CASE WHEN s.selected = true THEN 1 END) as selected_count
      FROM 
        users u
      LEFT JOIN
        submissions s ON u.user_id = s.user_id
      WHERE 
        u.faculty_id = $1 AND u.role_id = $2
      GROUP BY
        u.user_id, u.first_name, u.last_name, u.email
      ORDER BY
        u.last_name, u.first_name
    `;
    
    const result = await db.query(query, [facultyId, 4]); // role_id 4 = student
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching faculty students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * @route   GET /api/coordinator/reports/faculty
 * @desc    Get faculty report data
 * @access  Coordinator only
 */
router.get('/reports/faculty', async (req, res) => {
  try {
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get faculty statistics
    const query = `
      SELECT 
        f.faculty_id,
        f.faculty_name,
        COUNT(DISTINCT s.submission_id) AS submission_count,
        COUNT(DISTINCT CASE WHEN s.selected = true THEN s.submission_id END) AS selected_count,
        COUNT(DISTINCT s.user_id) AS contributor_count,
        COUNT(DISTINCT CASE WHEN s.submitted_at > NOW() - INTERVAL '14 days' 
                           AND (sc.comment_count IS NULL OR sc.comment_count = 0) 
                      THEN s.submission_id END) AS pending_comment_count
      FROM 
        faculties f
      LEFT JOIN 
        submissions s ON f.faculty_id = s.faculty_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY submission_id
      ) sc ON s.submission_id = sc.submission_id
      WHERE 
        f.faculty_id = $1
      GROUP BY 
        f.faculty_id, f.faculty_name
    `;
    
    const result = await db.query(query, [facultyId]);
    
    // If no data found, return empty stats
    if (result.rows.length === 0) {
      return res.json({
        faculty_id: facultyId,
        faculty_name: '',
        submission_count: 0,
        selected_count: 0,
        contributor_count: 0,
        pending_comment_count: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error generating faculty report:', err);
    res.status(500).json({ error: 'Failed to generate faculty report' });
  }
});

/**
 * @route   GET /api/coordinator/reports/submissions-without-comments
 * @desc    Get submissions without comments report
 * @access  Coordinator only
 */
router.get('/reports/submissions-without-comments', async (req, res) => {
  try {
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get submissions without comments
    const query = `
      SELECT 
        s.submission_id,
        s.title,
        s.submitted_at,
        s.status,
        u.first_name,
        u.last_name,
        u.email
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      LEFT JOIN (
        SELECT 
          submission_id, 
          COUNT(*) as comment_count
        FROM 
          comments
        GROUP BY 
          submission_id
      ) c ON s.submission_id = c.submission_id
      WHERE 
        s.faculty_id = $1 AND
        (c.comment_count IS NULL OR c.comment_count = 0)
      ORDER BY
        s.submitted_at ASC
    `;
    
    const result = await db.query(query, [facultyId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error generating submissions without comments report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * @route   GET /api/coordinator/reports/submissions-without-comments-14-days
 * @desc    Get submissions without comments after 14 days report
 * @access  Coordinator only
 */
router.get('/reports/submissions-without-comments-14-days', async (req, res) => {
  try {
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get submissions without comments after 14 days
    const query = `
      SELECT 
        s.submission_id,
        s.title,
        s.submitted_at,
        s.status,
        u.first_name,
        u.last_name,
        u.email,
        EXTRACT(DAY FROM NOW() - s.submitted_at) as days_since_submission
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      LEFT JOIN (
        SELECT 
          submission_id, 
          COUNT(*) as comment_count
        FROM 
          comments
        GROUP BY 
          submission_id
      ) c ON s.submission_id = c.submission_id
      WHERE 
        s.faculty_id = $1 AND
        (c.comment_count IS NULL OR c.comment_count = 0) AND
        s.submitted_at < NOW() - INTERVAL '14 days'
      ORDER BY
        s.submitted_at ASC
    `;
    
    const result = await db.query(query, [facultyId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error generating submissions without comments after 14 days report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * @route   GET /api/coordinator/settings
 * @desc    Get coordinator settings
 * @access  Coordinator only
 */
router.get('/settings', async (req, res) => {
  try {
    const query = `
      SELECT settings
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        email_notifications: true,
        comment_notifications: true
      });
    }
    
    res.json(result.rows[0].settings);
  } catch (err) {
    console.error('Error fetching coordinator settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @route   PUT /api/coordinator/settings
 * @desc    Update coordinator settings
 * @access  Coordinator only
 */
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    const query = `
      INSERT INTO user_settings (user_id, settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        settings = $2,
        updated_at = NOW()
      RETURNING settings
    `;
    
    const result = await db.query(query, [req.user.userId, settings]);
    
    res.json(result.rows[0].settings);
  } catch (err) {
    console.error('Error updating coordinator settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @route   GET /api/coordinator/download/:id
 * @desc    Download a submission file
 * @access  Coordinator only
 */
router.get('/download/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const preview = req.query.preview === 'true';
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get submission file path
    const query = `
      SELECT file_path, title, file_type 
      FROM submissions 
      WHERE submission_id = $1 AND faculty_id = $2
    `;
    
    const result = await db.query(query, [submissionId, facultyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not in your faculty' });
    }
    
    const { file_path, title, file_type } = result.rows[0];
    
    // Check if file exists
    const fullPath = path.join(__dirname, file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
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
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    
    // If preview is requested, set content-disposition to inline, otherwise attachment for download
    if (preview) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(title)}.${file_type}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${file_type}"`);
    }
    
    // Log the download
    try {
      await db.query(
        `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [
          req.user.userId, 
          preview ? 'Preview' : 'Download',
          `${preview ? 'Previewed' : 'Downloaded'} submission file for "${title}"`
        ]
      );
    } catch (logError) {
      console.error('Error logging download activity:', logError);
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
 });
 
 /**
 * @route   GET /api/coordinator/recent-submissions
 * @desc    Get recent submissions for dashboard
 * @access  Coordinator only
 */
 router.get('/recent-submissions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Get coordinator's faculty ID
    const userResult = await db.query(
      'SELECT faculty_id FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].faculty_id) {
      return res.status(404).json({ error: 'Faculty information not found' });
    }
    
    const facultyId = String(userResult.rows[0].faculty_id);
    
    // Get recent submissions
    const query = `
      SELECT 
        s.submission_id,
        s.title,
        s.description,
        s.submitted_at,
        s.status,
        u.first_name,
        u.last_name
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      WHERE 
        s.faculty_id = $1
      ORDER BY
        s.submitted_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [facultyId, limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent submissions:', err);
    res.status(500).json({ error: 'Failed to fetch recent submissions' });
  }
 });
 
 module.exports = router;