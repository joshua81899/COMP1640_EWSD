import axios from 'axios';

/**
 * Admin Service - Handles all API requests for admin functionality
 * This service provides methods to interact with the backend API
 * with enhanced error handling and response validation
 */
export const adminService = {
  /**
   * Get dashboard statistics
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Dashboard statistics
   */
  getDashboardStats: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values instead of throwing error
      return {
        totalSubmissions: 0,
        totalUsers: 0,
        pendingSubmissions: 0,
        selectedSubmissions: 0
      };
    }
  },

  /**
   * Get users with pagination and filtering
   * 
   * @param {string} token - Authentication token
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} search - Search query
   * @returns {Promise<Object>} Paginated users response
   */
  getUsers: async (token, page = 1, limit = 10, search = '') => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log(`Fetching users: page=${page}, limit=${limit}, search=${search}`);
      
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        params: { page, limit, search },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Users API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      // Return default structured response
      return {
        users: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      };
    }
  },

  /**
   * Create new user
   * 
   * @param {string} token - Authentication token
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user data
   */
  createUser: async (token, userData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Creating user with data:', {
        ...userData,
        password: userData.password ? '[REDACTED]' : undefined
      });
      
      const response = await axios.post(`${apiUrl}/api/admin/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update existing user
   * 
   * @param {string} token - Authentication token
   * @param {number} userId - User ID to update
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  updateUser: async (token, userId, userData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log(`Updating user ${userId} with data:`, {
        ...userData,
        password: userData.password ? '[REDACTED]' : undefined
      });
      
      // Ensure role_id is handled correctly regardless of format
      if (userData.role_id) {
        // No conversion needed, the backend will handle different formats
      }
      
      const response = await axios.put(`${apiUrl}/api/admin/users/${userId}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete user
   * 
   * @param {string} token - Authentication token
   * @param {number} userId - User ID to delete
   * @returns {Promise<Object>} Response data
   */
  deleteUser: async (token, userId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log(`Deleting user ${userId}`);
      
      const response = await axios.delete(`${apiUrl}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User deletion response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get submissions with pagination and filtering
   * 
   * @param {string} token - Authentication token
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} search - Search query
   * @param {Object} filters - Additional filters (faculty, status, academicYear)
   * @returns {Promise<Object>} Paginated submissions response
   */
  getSubmissions: async (token, page = 1, limit = 10, search = '', filters = {}) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Fetching submissions with params:', { page, limit, search, filters });
      
      const params = {
        page,
        limit,
        search,
        ...filters
      };
      
      const response = await axios.get(`${apiUrl}/api/admin/submissions`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // Add timeout to prevent hanging requests
      });
      
      // Validate response structure
      if (!response.data || !Array.isArray(response.data.submissions)) {
        console.warn('Invalid response format received:', response.data);
        // Return structured default response
        return {
          submissions: [],
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0
        };
      }
      
      console.log(`Found ${response.data.submissions.length} submissions out of ${response.data.total}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Return default structured response on error
      return {
        submissions: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      };
    }
  },

  /**
   * Get a specific submission's details
   * 
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID to fetch
   * @returns {Promise<Object>} Submission details
   */
  getSubmissionDetails: async (token, submissionId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const response = await axios.get(`${apiUrl}/api/admin/submissions/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching submission details:', error);
      throw error;
    }
  },

  /**
   * Get comments for a submission
   * 
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Array>} Comments array
   */
  getSubmissionComments: async (token, submissionId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const response = await axios.get(`${apiUrl}/api/admin/submissions/${submissionId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid comments response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching submission comments:', error);
      return []; // Return empty array on error
    }
  },

  /**
   * Add a comment to a submission
   * 
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @param {string} commentText - Comment text
   * @returns {Promise<Object>} Created comment
   */
  addSubmissionComment: async (token, submissionId, commentText) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const response = await axios.post(
        `${apiUrl}/api/admin/submissions/${submissionId}/comments`,
        { comment_text: commentText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Update submission status
   * 
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @param {string} status - New status ('Selected', 'Rejected', 'Submitted')
   * @returns {Promise<Object>} Updated submission
   */
  updateSubmissionStatus: async (token, submissionId, status) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const response = await axios.patch(
        `${apiUrl}/api/admin/submissions/${submissionId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  },

  /**
   * Download submission file
   * 
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @param {string} filePath - File path for reference
   * @returns {Promise<Object>} Download URL or blob
   */
  downloadSubmissionFile: async (token, submissionId, filePath) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      // Get file as blob for direct download
      const response = await axios.get(
        `${apiUrl}/api/admin/submissions/${submissionId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from filePath
      const filename = filePath.split('/').pop() || `submission-${submissionId}`;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, message: 'File download started' };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  /**
   * Get faculties
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Faculties array
   */
  getFaculties: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/faculties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid faculties response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching faculties:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  /**
   * Get faculty statistics
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Faculty statistics array
   */
  getFacultyStats: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/faculties/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid faculty stats response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty stats:', error);
      return [];
    }
  },

  /**
   * Get all roles
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Roles array
   */
  getRoles: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Fetching user roles');
      
      const response = await axios.get(`${apiUrl}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Roles response:', response.data);
      
      // If the backend returns roles in an unexpected format, transform them
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract an array if the response is an object with roles
        if (response.data.roles && Array.isArray(response.data.roles)) {
          return response.data.roles;
        }
        
        // If it's just an object with role properties, convert to array
        return Object.entries(response.data).map(([key, value]) => {
          if (typeof value === 'object') {
            return value;
          }
          // If it's just key-value, create a role object
          return { role_id: key, role_name: value };
        });
      }
      
      // Fallback to hardcoded roles if API fails to return valid data
      return [
        { role_id: 1, role_name: 'Administrator' },
        { role_id: 2, role_name: 'Marketing Manager' },
        { role_id: 3, role_name: 'Faculty Coordinator' },
        { role_id: 4, role_name: 'Student' }
      ];
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Return hardcoded roles instead of throwing
      return [
        { role_id: 1, role_name: 'Administrator' },
        { role_id: 2, role_name: 'Marketing Manager' },
        { role_id: 3, role_name: 'Faculty Coordinator' },
        { role_id: 4, role_name: 'Student' }
      ];
    }
  },

  /**
   * Get marketing coordinators
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Marketing coordinators array
   */
  getMarketingCoordinators: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/users/coordinators`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid coordinators response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching marketing coordinators:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  /**
   * Get recent activity logs
   * 
   * @param {string} token - Authentication token
   * @param {number} limit - Maximum number of logs to retrieve
   * @returns {Promise<Array>} Activity logs array
   */
  getRecentActivity: async (token, limit = 10) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/activity/recent`, {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid activity logs response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  /**
   * Get page visit analytics
   * 
   * @param {string} token - Authentication token
   * @param {string} dateRange - Date range ('week', 'month', 'year')
   * @returns {Promise<Array>} Page visits array
   */
  getPageVisits: async (token, dateRange = 'week') => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/analytics/page-visits`, {
        params: { dateRange },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid page visits response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching page visits:', error);
      return [];
    }
  },

  /**
   * Get browser usage statistics
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Browser statistics array
   */
  getBrowserStats: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/analytics/browser-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid browser stats response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching browser stats:', error);
      return [];
    }
  },

  /**
   * Get user activity analytics
   * 
   * @param {string} token - Authentication token
   * @param {string} dateRange - Date range ('week', 'month', 'year')
   * @returns {Promise<Array>} User activity array
   */
  getUserActivity: async (token, dateRange = 'week') => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/admin/analytics/user-activity`, {
        params: { dateRange },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!Array.isArray(response.data)) {
        console.warn('Invalid user activity response format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  },

  /**
   * Log activity for analytics
   * @param {string} token - Authentication token
   * @param {string} actionType - Type of action (e.g., 'View', 'Create', 'Update', 'Delete')
   * @param {string} actionDetails - Details about the action
   * @returns {Promise<Object>} Response data or empty object if error
   */
  logActivity: async (token, actionType, actionDetails) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.post(
        `${apiUrl}/api/admin/activity/log`,
        { action_type: actionType, action_details: actionDetails },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw, just return an empty object
      return {};
    }
  },

  /**
   * Check API and authentication status
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Status information
   */
  checkApiStatus: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${apiUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // Add shorter timeout for status check
      });
      
      return {
        status: 'online',
        serverTime: response.data.timestamp,
        authenticated: true
      };
    } catch (error) {
      console.error('API status check failed:', error);
      return {
        status: 'offline',
        error: error.message,
        authenticated: false
      };
    }
  },

  /**
   * Get academic settings
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Academic settings
   */
  getAcademicSettings: async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Fetching academic settings...');
      
      // First try the new endpoint using "academic_settings" table name
      try {
        const response = await axios.get(`${apiUrl}/api/admin/settings/academic`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000 // Add timeout to prevent hanging requests
        });
        
        console.log('Received academic settings response:', response.data);
        
        // Validate that we received an actual object
        if (response.data && typeof response.data === 'object') {
          // Check if necessary properties exist
          if (response.data.academic_year && 
              (response.data.submission_deadline || response.data.final_edit_deadline)) {
            return response.data;
          } else {
            console.warn('Academic settings missing required fields, using defaults');
          }
        } else {
          console.warn('Invalid academic settings response format, using defaults');
        }
      } catch (apiError) {
        console.error('Error in primary academic settings request:', apiError);
        // Continue to fallback - don't return or throw here
      }
      
      // If we're still executing, the primary request failed
      // Return default values
      console.log('Using default academic settings values');
      return {
        academic_year: '2024-2025',
        submission_deadline: '2025-05-25', 
        final_edit_deadline: '2025-06-23'
      };
    } catch (error) {
      console.error('Unhandled error in getAcademicSettings:', error);
      // Always return default values rather than throwing
      return {
        academic_year: '2024-2025',
        submission_deadline: '2025-05-25',
        final_edit_deadline: '2025-06-23'
      };
    }
  },

  /**
   * Update academic settings
   * 
   * @param {string} token - Authentication token
   * @param {Object} settings - Updated settings
   * @returns {Promise<Object>} Updated settings
   */
  updateAcademicSettings: async (token, settings) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Updating academic settings with:', settings);
      
      const response = await axios.put(
        `${apiUrl}/api/admin/settings/academic`,
        settings,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Academic settings update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating academic settings:', error);
      throw error;
    }
  },

  /**
   * Create new faculty
   * 
   * @param {string} token - Authentication token
   * @param {Object} facultyData - Faculty data
   * @returns {Promise<Object>} Created faculty
   */
  createFaculty: async (token, facultyData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.post(
        `${apiUrl}/api/admin/faculties`,
        facultyData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating faculty:', error);
      throw error;
    }
  },

  /**
   * Update faculty
   * 
   * @param {string} token - Authentication token
   * @param {string} facultyId - Faculty ID
   * @param {Object} facultyData - Updated faculty data
   * @returns {Promise<Object>} Updated faculty
   */
  updateFaculty: async (token, facultyId, facultyData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.put(
        `${apiUrl}/api/admin/faculties/${facultyId}`,
        facultyData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  },

  /**
   * Delete faculty
   * 
   * @param {string} token - Authentication token
   * @param {string} facultyId - Faculty ID
   * @returns {Promise<Object>} Response data
   */
  deleteFaculty: async (token, facultyId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.delete(
        `${apiUrl}/api/admin/faculties/${facultyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  }
};

export default adminService;