// managerRoutes.js - Backend routes for marketing manager functionality
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateToken, normalizeRole } = require('./middleware/auth');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const stream = require('stream');
const jwt = require('jsonwebtoken');

/**
 * Middleware to verify manager access
 * This checks if the authenticated user has manager role
 */
const isManager = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Check if user exists and has manager role
    const query = 'SELECT role_id FROM users WHERE user_id = $1';
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = normalizeRole(result.rows[0].role_id);
    
    // Check if role is marketing manager using normalized role
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
 * Helper to log activity to database
 * @param {number} userId - User ID
 * @param {string} actionType - Type of action
 * @param {string} actionDetails - Details about the action
 */
async function logActivity(userId, actionType, actionDetails) {
  try {
    await db.query(
      `INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
       VALUES ($1, $2, $3, NOW())`,
      [userId, actionType, actionDetails]
    );
  } catch (logError) {
    console.error('Error logging activity:', logError);
    // Don't throw - logging failures shouldn't stop the main operation
  }
}

// Apply middleware
router.use(authenticateToken);
router.use(isManager);

/**
 * @route   GET /api/manager/dashboard/stats
 * @desc    Get dashboard statistics for marketing manager
 * @access  Manager only
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get submissions count
    let totalSubmissions = 0;
    let selectedSubmissions = 0;
    let pendingSelections = 0;
    let totalContributors = 0;
    
    try {
      // Get total submissions count
      const submissionsResult = await db.query('SELECT COUNT(*) as total FROM submissions');
      totalSubmissions = parseInt(submissionsResult.rows[0].total);
      
      // Get selected submissions count
      const selectedResult = await db.query('SELECT COUNT(*) as total FROM submissions WHERE selected = true');
      selectedSubmissions = parseInt(selectedResult.rows[0].total);
      
      // Get pending submissions count
      const pendingResult = await db.query('SELECT COUNT(*) as total FROM submissions WHERE status = $1', ['Submitted']);
      pendingSelections = parseInt(pendingResult.rows[0].total);
      
      // Get unique contributors count
      const contributorsResult = await db.query('SELECT COUNT(DISTINCT user_id) as total FROM submissions');
      totalContributors = parseInt(contributorsResult.rows[0].total);
    } catch (err) {
      console.error('Error counting stats:', err);
      // Continue with default values
    }
    
    res.json({
      totalSubmissions,
      selectedSubmissions,
      pendingSelections,
      totalContributors
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    // Send default values instead of error response
    res.json({
      totalSubmissions: 0,
      selectedSubmissions: 0,
      pendingSelections: 0,
      totalContributors: 0
    });
  }
});

/**
 * @route   GET /api/manager/faculty-stats
 * @desc    Get faculty submission statistics
 * @access  Manager only
 */
router.get('/faculty-stats', async (req, res) => {
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
 * @route   GET /api/manager/activity/recent
 * @desc    Get recent activity logs
 * @access  Manager only
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
 * @route   GET /api/manager/submissions
 * @desc    Get selected submissions with pagination and filtering
 * @access  Manager only
 */
router.get('/submissions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const faculty = req.query.faculty || '';
    const academicYear = req.query.academicYear || '';
    const search = req.query.search || '';
    
    // Build query with filtering
    let query = `
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
        s.selected = true
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (faculty) {
      query += ` AND s.faculty_id = $${paramIndex}`;
      queryParams.push(faculty);
      paramIndex++;
    }
    
    if (academicYear) {
      query += ` AND s.academic_year = $${paramIndex}`;
      queryParams.push(academicYear);
      paramIndex++;
    }
    
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
    
    // Count total query (for pagination)
    const countQuery = query.replace('s.*,\n        u.first_name,\n        u.last_name,\n        u.email,\n        f.faculty_name', 'COUNT(*) AS total');
    
    // Add ordering and pagination to main query
    query += ` ORDER BY s.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Execute queries
    const submissionsResult = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      submissions: submissionsResult.rows,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching selected submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * @route   GET /api/manager/submissions/:id/download
 * @desc    Download a submission file for manager
 * @access  Manager only
 */
router.get('/submissions/:id/download', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const preview = req.query.preview === 'true';
    
    // Verify manager access and get submission
    const query = `
      SELECT s.file_path, s.title, s.file_type 
      FROM submissions s
      WHERE s.submission_id = $1 AND s.selected = true
    `;
    
    const result = await db.query(query, [submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or not selected for publication' });
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
      await logActivity(
        req.user.userId, 
        preview ? 'Preview' : 'Download',
        `${preview ? 'Previewed' : 'Downloaded'} submission file for "${title}"`
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
 * @route   POST /api/manager/submissions/download-zip
 * @desc    Download selected submissions as ZIP
 * @access  Manager only
 */
router.post('/submissions/download-zip', async (req, res) => {
  try {
    const { submissionIds } = req.body;
    
    // Build query to get selected submissions
    let query;
    let params;
    
    if (submissionIds && submissionIds.length > 0) {
      // Get specific submissions by ID
      query = `
        SELECT 
          s.submission_id, s.title, s.file_path, s.file_type,
          u.first_name, u.last_name, f.faculty_name
        FROM 
          submissions s
        JOIN
          users u ON s.user_id = u.user_id
        JOIN
          faculties f ON s.faculty_id = f.faculty_id
        WHERE 
          s.selected = true AND s.submission_id = ANY($1::int[])
      `;
      params = [submissionIds];
    } else {
      // Get all selected submissions
      query = `
        SELECT 
          s.submission_id, s.title, s.file_path, s.file_type,
          u.first_name, u.last_name, f.faculty_name
        FROM 
          submissions s
        JOIN
          users u ON s.user_id = u.user_id
        JOIN
          faculties f ON s.faculty_id = f.faculty_id
        WHERE 
          s.selected = true
      `;
      params = [];
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No selected submissions found' });
    }
    
    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="selected-submissions-${Date.now()}.zip"`);
    
    // Create ZIP archive stream
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level (0-9)
    });
    
    // Set up error handling
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP archive' });
      }
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Track processed files for logging
    let processedFiles = 0;
    let failedFiles = 0;
    
    // Process each submission
    const filePromises = result.rows.map(async (submission) => {
      try {
        // Create a path for the file in the ZIP
        const sourcePath = path.join(__dirname, submission.file_path);
        
        // Check if file exists
        if (fs.existsSync(sourcePath)) {
          // Create faculty subdirectory name (sanitize for file system)
          const facultyDir = submission.faculty_name.replace(/[^a-z0-9]/gi, '_');
          
          // Create destination filename with author and title
          const authorName = `${submission.first_name}_${submission.last_name}`.replace(/[^a-z0-9]/gi, '_');
          const title = submission.title.replace(/[^a-z0-9]/gi, '_');
          const destFilename = `${authorName}-${title}.${submission.file_type}`;
          const destPath = path.join(facultyDir, destFilename);
          
          // Add file to the archive
          archive.file(sourcePath, { name: destPath });
          processedFiles++;
        } else {
          console.error(`File not found: ${submission.file_path}`);
          failedFiles++;
        }
      } catch (fileError) {
        console.error(`Error processing file ${submission.file_path}:`, fileError);
        failedFiles++;
      }
    });
    
    // Wait for all files to be processed
    await Promise.all(filePromises);
    
    // Add a metadata file with submission info
    const metadataContent = result.rows.map(submission => {
      return {
        id: submission.submission_id,
        title: submission.title,
        author: `${submission.first_name} ${submission.last_name}`,
        faculty: submission.faculty_name,
        file_type: submission.file_type
      };
    });
    
    archive.append(JSON.stringify(metadataContent, null, 2), { name: 'metadata.json' });
    
    // Add a README file
    const readmeContent = `# Selected Submissions
    
This ZIP archive contains ${result.rows.length} selected submissions for the University Magazine.
Generated on ${new Date().toLocaleString()}

## Structure
Files are organized by faculty. Each file is named using the format: AuthorName-SubmissionTitle.extension

## Metadata
The metadata.json file contains detailed information about all submissions included in this archive.
`;
    
    archive.append(readmeContent, { name: 'README.md' });
    
    // Finalize the archive
    await archive.finalize();
    
    // Log the activity
    try {
      await logActivity(
        req.user.userId,
        'ZIP Download',
        `Downloaded ZIP of ${processedFiles} selected submissions (${failedFiles} files failed)`
      );
    } catch (logError) {
      console.error('Error logging ZIP download activity:', logError);
    }
    
  } catch (err) {
    console.error('Error creating ZIP file:', err);
    
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  }
});

/**
 * @route   GET /api/manager/stats/overview
 * @desc    Get publication statistics overview
 * @access  Manager only
 */
router.get('/stats/overview', async (req, res) => {
  try {
    // Fetch overview statistics
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM submissions) AS totalSubmissions,
        (SELECT COUNT(*) FROM submissions WHERE selected = true) AS selectedSubmissions,
        (SELECT COUNT(DISTINCT user_id) FROM submissions) AS totalContributors,
        (SELECT COUNT(*) FROM submissions WHERE status = 'Submitted') AS pendingSelections
    `;
    
    const result = await db.query(statsQuery);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching publication stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * @route   GET /api/manager/stats/faculties
 * @desc    Get faculty submission statistics
 * @access  Manager only
 */
router.get('/stats/faculties', async (req, res) => {
  try {
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
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching faculty submission stats:', err);
    res.status(500).json({ error: 'Failed to fetch faculty statistics' });
  }
});

/**
 * @route   GET /api/manager/stats/contributors
 * @desc    Get top contributors statistics
 * @access  Manager only
 */
router.get('/stats/contributors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const query = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        f.faculty_name,
        COUNT(s.submission_id) AS submission_count,
        COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
      FROM 
        users u
      JOIN 
        submissions s ON u.user_id = s.user_id
      JOIN 
        faculties f ON u.faculty_id = f.faculty_id
      GROUP BY 
        u.user_id, u.first_name, u.last_name, u.email, f.faculty_name
      ORDER BY 
        submission_count DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contributor stats:', err);
    res.status(500).json({ error: 'Failed to fetch contributor statistics' });
  }
});

/**
 * @route   GET /api/manager/stats/trends
 * @desc    Get submission trends by time period
 * @access  Manager only
 */
router.get('/stats/trends', async (req, res) => {
  try {
    const timespan = req.query.timespan || 'year';
    let query;
    
    if (timespan === 'month') {
      // Monthly trend for the past year
      query = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', now()) - interval '11 month',
            date_trunc('month', now()),
            interval '1 month'
          ) AS month
        )
        SELECT 
          to_char(months.month, 'Mon YYYY') AS period,
          COUNT(s.submission_id) AS submission_count,
          COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
        FROM 
          months
        LEFT JOIN 
          submissions s ON date_trunc('month', s.submitted_at) = months.month
        GROUP BY 
          months.month, period
        ORDER BY 
          months.month ASC
      `;
    } else {
      // Yearly trend
      query = `
        WITH years AS (
          SELECT generate_series(
            date_trunc('year', now()) - interval '4 year',
            date_trunc('year', now()),
            interval '1 year'
          ) AS year
        )
        SELECT 
          to_char(years.year, 'YYYY') AS period,
          COUNT(s.submission_id) AS submission_count,
          COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
        FROM 
          years
        LEFT JOIN 
          submissions s ON date_trunc('year', s.submitted_at) = years.year
        GROUP BY 
          years.year, period
        ORDER BY 
          years.year ASC
      `;
    }
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trend stats:', err);
    res.status(500).json({ error: 'Failed to fetch trend statistics' });
  }
});

/**
 * @route   GET /api/manager/stats/document-types
 * @desc    Get submission document type statistics
 * @access  Manager only
 */
router.get('/stats/document-types', async (req, res) => {
  try {
    const query = `
      WITH doc_counts AS (
        SELECT 
          COALESCE(file_type, 'unknown') AS type,
          COUNT(*) AS count
        FROM 
          submissions
        WHERE 
          selected = true
        GROUP BY 
          type
      ),
      total AS (
        SELECT COUNT(*) AS total
        FROM submissions
        WHERE selected = true
      )
      SELECT 
        dc.type,
        dc.count,
        ROUND((dc.count * 100.0 / NULLIF(t.total, 0)), 1) AS percentage
      FROM 
        doc_counts dc,
        total t
      ORDER BY 
        dc.count DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching document type stats:', err);
    res.status(500).json({ error: 'Failed to fetch document type statistics' });
  }
});

/**
 * @route   POST /api/manager/activity/log
 * @desc    Log a manager activity
 * @access  Manager only
 */
router.post('/activity/log', async (req, res) => {
  try {
    const { action_type, action_details } = req.body;
    
    if (!action_type || !action_details) {
      return res.status(400).json({ error: 'Action type and details are required' });
    }
    
    const query = `
      INSERT INTO activitylogs (user_id, action_type, action_details, log_timestamp)
      VALUES ($1, $2, $3, NOW())
      RETURNING log_id
    `;
    
    const result = await db.query(query, [req.user.userId, action_type, action_details]);
    
    res.status(201).json({
      success: true,
      log_id: result.rows[0].log_id
    });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

/**
 * @route   GET /api/manager/settings/notifications
 * @desc    Get notification settings for manager
 * @access  Manager only
 */
router.get('/settings/notifications', async (req, res) => {
  try {
    const query = `
      SELECT notification_settings
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        email_notifications: true,
        comment_notifications: true,
        selection_notifications: true,
        deadline_reminders: true
      });
    }
    
    res.json(result.rows[0].notification_settings);
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

/**
 * @route   PUT /api/manager/settings/notifications
 * @desc    Update notification settings for manager
 * @access  Manager only
 */
router.put('/settings/notifications', async (req, res) => {
  try {
    const settings = req.body;
    
    const query = `
      INSERT INTO user_settings (user_id, notification_settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        notification_settings = $2,
        updated_at = NOW()
      RETURNING notification_settings
    `;
    
    const result = await db.query(query, [req.user.userId, settings]);
    
    res.json(result.rows[0].notification_settings);
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

/**
 * @route   GET /api/manager/settings/display
 * @desc    Get display settings for manager
 * @access  Manager only
 */
router.get('/settings/display', async (req, res) => {
  try {
    const query = `
      SELECT display_settings
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        dark_mode: true,
        compact_view: false,
        show_statistics: true,
        default_view: 'submissions'
      });
    }
    
    res.json(result.rows[0].display_settings);
  } catch (err) {
    console.error('Error fetching display settings:', err);
    res.status(500).json({ error: 'Failed to fetch display settings' });
  }
});

/**
 * @route   PUT /api/manager/settings/display
 * @desc    Update display settings for manager
 * @access  Manager only
 */
router.put('/settings/display', async (req, res) => {
  try {
    const settings = req.body;
    
    const query = `
      INSERT INTO user_settings (user_id, display_settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        display_settings = $2,
        updated_at = NOW()
      RETURNING display_settings
    `;
    
    const result = await db.query(query, [req.user.userId, settings]);
    
    res.json(result.rows[0].display_settings);
  } catch (err) {
    console.error('Error updating display settings:', err);
    res.status(500).json({ error: 'Failed to update display settings' });
  }
});

/**
 * @route   GET /api/manager/settings/export
 * @desc    Get export settings for manager
 * @access  Manager only
 */
router.get('/settings/export', async (req, res) => {
  try {
    const query = `
      SELECT export_settings
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [req.user.userId]);
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        include_comments: true,
        include_metadata: true,
        default_format: 'zip'
      });
    }
    
    res.json(result.rows[0].export_settings);
  } catch (err) {
    console.error('Error fetching export settings:', err);
    res.status(500).json({ error: 'Failed to fetch export settings' });
  }
});

/**
 * @route   PUT /api/manager/settings/export
 * @desc    Update export settings for manager
 * @access  Manager only
 */
router.put('/settings/export', async (req, res) => {
  try {
    const settings = req.body;
    
    const query = `
      INSERT INTO user_settings (user_id, export_settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        export_settings = $2,
        updated_at = NOW()
      RETURNING export_settings
    `;
    
    const result = await db.query(query, [req.user.userId, settings]);
    
    res.json(result.rows[0].export_settings);
  } catch (err) {
    console.error('Error updating export settings:', err);
    res.status(500).json({ error: 'Failed to update export settings' });
  }
});

/**
 * @route   GET /api/manager/download-zip
 * @desc    Dedicated endpoint for ZIP file download with authorization via query params
 * @access  Manager only (with token in query param)
 */
router.get('/download-zip', async (req, res) => {
  try {
    // Check if token is provided in query param
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
      userId = decoded.userId;
      
      // Verify this is a manager
      const userResult = await db.query('SELECT role_id FROM users WHERE user_id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userRole = normalizeRole(userResult.rows[0].role_id);
      if (userRole !== 'MNGR') {
        return res.status(403).json({ error: 'Marketing Manager access required' });
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Get all selected submissions
    const query = `
      SELECT 
        s.submission_id, s.title, s.file_path, s.file_type,
        u.first_name, u.last_name, f.faculty_name
      FROM 
        submissions s
      JOIN
        users u ON s.user_id = u.user_id
      JOIN
        faculties f ON s.faculty_id = f.faculty_id
      WHERE 
        s.selected = true
    `;
    
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No selected submissions found' });
    }
    
    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="selected-submissions-${Date.now()}.zip"`);
    
    // Create ZIP archive stream
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level (0-9)
    });
    
    // Set up error handling
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP archive' });
      }
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Track processed files for logging
    let processedFiles = 0;
    let failedFiles = 0;
    
    // Process each submission
    const filePromises = result.rows.map(async (submission) => {
      try {
        // Create a path for the file in the ZIP
        const sourcePath = path.join(__dirname, submission.file_path);
        
        // Check if file exists
        if (fs.existsSync(sourcePath)) {
          // Create faculty subdirectory name (sanitize for file system)
          const facultyDir = submission.faculty_name.replace(/[^a-z0-9]/gi, '_');
          
          // Create destination filename with author and title
          const authorName = `${submission.first_name}_${submission.last_name}`.replace(/[^a-z0-9]/gi, '_');
          const title = submission.title.replace(/[^a-z0-9]/gi, '_');
          const destFilename = `${authorName}-${title}.${submission.file_type}`;
          const destPath = path.join(facultyDir, destFilename);
          
          // Add file to the archive
          archive.file(sourcePath, { name: destPath });
          processedFiles++;
        } else {
          console.error(`File not found: ${submission.file_path}`);
          failedFiles++;
        }
      } catch (fileError) {
        console.error(`Error processing file ${submission.file_path}:`, fileError);
        failedFiles++;
      }
    });
    
    // Wait for all files to be processed
    await Promise.all(filePromises);
    
    // Add a metadata file with submission info
    const metadataContent = result.rows.map(submission => {
      return {
        id: submission.submission_id,
        title: submission.title,
        author: `${submission.first_name} ${submission.last_name}`,
        faculty: submission.faculty_name,
        file_type: submission.file_type
      };
    });
    
    archive.append(JSON.stringify(metadataContent, null, 2), { name: 'metadata.json' });
    
    // Add a README file
    const readmeContent = `# Selected Submissions
    
This ZIP archive contains ${result.rows.length} selected submissions for the University Magazine.
Generated on ${new Date().toLocaleString()}

## Structure
Files are organized by faculty. Each file is named using the format: AuthorName-SubmissionTitle.extension

## Metadata
The metadata.json file contains detailed information about all submissions included in this archive.
`;
    
    archive.append(readmeContent, { name: 'README.md' });
    
    // Finalize the archive
    await archive.finalize();
    
    // Log the activity
    try {
      await logActivity(
        userId,
        'ZIP Download',
        `Downloaded ZIP of ${processedFiles} selected submissions (${failedFiles} files failed)`
      );
    } catch (logError) {
      console.error('Error logging ZIP download activity:', logError);
    }
    
  } catch (err) {
    console.error('Error creating ZIP file:', err);
    
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  }
});

/**
 * @route   GET /api/manager/students-by-faculty
 * @desc    Get students count by faculty
 * @access  Manager only
 */
router.get('/students-by-faculty', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.faculty_id,
        f.faculty_name,
        COUNT(u.user_id) AS student_count
      FROM 
        faculties f
      LEFT JOIN 
        users u ON f.faculty_id = u.faculty_id AND u.role_id = '4'
      GROUP BY 
        f.faculty_id, f.faculty_name
      ORDER BY 
        f.faculty_name ASC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students by faculty:', err);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

/**
 * @route   GET /api/manager/export-data
 * @desc    Export all statistics as JSON for reporting
 * @access  Manager only
 */
router.get('/export-data', async (req, res) => {
  try {
    // Initialize data object
    const exportData = {
      timestamp: new Date(),
      overview: {},
      facultyStats: [],
      contributorStats: [],
      documentTypes: [],
      trends: {}
    };
    
    // Get overview stats
    try {
      const overviewQuery = `
        SELECT
          (SELECT COUNT(*) FROM submissions) AS totalSubmissions,
          (SELECT COUNT(*) FROM submissions WHERE selected = true) AS selectedSubmissions,
          (SELECT COUNT(DISTINCT user_id) FROM submissions) AS totalContributors,
          (SELECT COUNT(*) FROM submissions WHERE status = 'Submitted') AS pendingSelections
      `;
      
      const overviewResult = await db.query(overviewQuery);
      exportData.overview = overviewResult.rows[0];
    } catch (err) {
      console.error('Error fetching overview stats for export:', err);
      exportData.overview = {
        error: 'Failed to fetch overview statistics'
      };
    }
    
    // Get faculty stats
    try {
      const facultyQuery = `
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
      
      const facultyResult = await db.query(facultyQuery);
      exportData.facultyStats = facultyResult.rows;
    } catch (err) {
      console.error('Error fetching faculty stats for export:', err);
      exportData.facultyStats = {
        error: 'Failed to fetch faculty statistics'
      };
    }
    
    // Get contributor stats
    try {
      const contributorQuery = `
        SELECT 
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          f.faculty_name,
          COUNT(s.submission_id) AS submission_count,
          COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
        FROM 
          users u
        JOIN 
          submissions s ON u.user_id = s.user_id
        JOIN 
          faculties f ON u.faculty_id = f.faculty_id
        GROUP BY 
          u.user_id, u.first_name, u.last_name, u.email, f.faculty_name
        ORDER BY 
          submission_count DESC
        LIMIT 20
      `;
      
      const contributorResult = await db.query(contributorQuery);
      exportData.contributorStats = contributorResult.rows;
    } catch (err) {
      console.error('Error fetching contributor stats for export:', err);
      exportData.contributorStats = {
        error: 'Failed to fetch contributor statistics'
      };
    }
    
    // Get document type stats
    try {
      const typeQuery = `
        WITH doc_counts AS (
          SELECT 
            COALESCE(file_type, 'unknown') AS type,
            COUNT(*) AS count
          FROM 
            submissions
          WHERE 
            selected = true
          GROUP BY 
            type
        ),
        total AS (
          SELECT COUNT(*) AS total
          FROM submissions
          WHERE selected = true
        )
        SELECT 
          dc.type,
          dc.count,
          ROUND((dc.count * 100.0 / NULLIF(t.total, 0)), 1) AS percentage
        FROM 
          doc_counts dc,
          total t
        ORDER BY 
          dc.count DESC
      `;
      
      const typeResult = await db.query(typeQuery);
      exportData.documentTypes = typeResult.rows;
    } catch (err) {
      console.error('Error fetching document type stats for export:', err);
      exportData.documentTypes = {
        error: 'Failed to fetch document type statistics'
      };
    }
    
    // Get trend stats
    try {
      // Yearly trend
      const yearQuery = `
        WITH years AS (
          SELECT generate_series(
            date_trunc('year', now()) - interval '4 year',
            date_trunc('year', now()),
            interval '1 year'
          ) AS year
        )
        SELECT 
          to_char(years.year, 'YYYY') AS period,
          COUNT(s.submission_id) AS submission_count,
          COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
        FROM 
          years
        LEFT JOIN 
          submissions s ON date_trunc('year', s.submitted_at) = years.year
        GROUP BY 
          years.year, period
        ORDER BY 
          years.year ASC
      `;
      
      const yearResult = await db.query(yearQuery);
      exportData.trends.yearly = yearResult.rows;
      
      // Monthly trend
      const monthQuery = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', now()) - interval '11 month',
            date_trunc('month', now()),
            interval '1 month'
          ) AS month
        )
        SELECT 
          to_char(months.month, 'Mon YYYY') AS period,
          COUNT(s.submission_id) AS submission_count,
          COUNT(CASE WHEN s.selected = true THEN 1 END) AS selected_count
        FROM 
          months
        LEFT JOIN 
          submissions s ON date_trunc('month', s.submitted_at) = months.month
        GROUP BY 
          months.month, period
        ORDER BY 
          months.month ASC
      `;
      
      const monthResult = await db.query(monthQuery);
      exportData.trends.monthly = monthResult.rows;
    } catch (err) {
      console.error('Error fetching trend stats for export:', err);
      exportData.trends = {
        error: 'Failed to fetch trend statistics'
      };
    }
    
    // Set content type and filename
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="publication-stats-${Date.now()}.json"`);
    
    // Log the activity
    try {
      await logActivity(
        req.user.userId,
        'Data Export',
        'Exported all statistics data as JSON'
      );
    } catch (logError) {
      console.error('Error logging data export activity:', logError);
    }
    
    // Send the data
    res.json(exportData);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;