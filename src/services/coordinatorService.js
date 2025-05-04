// src/services/coordinatorService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Service for handling coordinator API endpoints
 */
export const coordinatorService = {
  /**
   * Get dashboard statistics for coordinator
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with dashboard stats
   */
  getDashboardStats: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        facultyId: '',
        totalSubmissions: 0,
        pendingComments: 0,
        selectedSubmissions: 0,
        totalContributors: 0
      };
    }
  },

  /**
   * Get coordinator's faculty information
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with faculty info
   */
  getFacultyInfo: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/faculty`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty info:', error);
      throw error;
    }
  },

  /**
   * Get submissions for coordinator's faculty
   * @param {string} token - Authentication token
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} status - Filter by status
   * @param {string} search - Search term
   * @param {boolean} needsComment - Filter for submissions without comments
   * @returns {Promise} - Promise with submissions
   */
  getSubmissions: async (token, page = 1, limit = 10, status = '', search = '', needsComment = false) => {
    try {
      console.log('coordinatorService.getSubmissions called with:', {
        page, limit, status, search, needsComment
      });
      
      const response = await axios.get(`${API_URL}/api/coordinator/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          page, 
          limit, 
          status, 
          search, 
          needsComment: needsComment ? 'true' : 'false' 
        }
      });
      
      console.log('coordinatorService.getSubmissions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response data',
        request: error.request ? 'Request was made but no response' : 'No request was made'
      });
      throw error;
    }
  },

  /**
   * Get recent submissions for dashboard
   * @param {string} token - Authentication token
   * @param {number} limit - Number of submissions to fetch
   * @returns {Promise} - Promise with recent submissions
   */
  getRecentSubmissions: async (token, limit = 2) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          page: 1, 
          limit, 
          sort: 'submitted_at', 
          order: 'desc' 
        }
      });
      return response.data.submissions || [];
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      return [];
    }
  },

  /**
   * Get specific submission with comments
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @returns {Promise} - Promise with submission and comments
   */
  getSubmissionDetails: async (token, submissionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Map response data to use the correct property names
      if (response.data && response.data.comments) {
        // Map commented_at to comment_at for frontend compatibility if needed
        response.data.comments = response.data.comments.map(comment => ({
          ...comment,
          comment_at: comment.commented_at // Add this for backward compatibility
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching submission details:', error);
      throw error;
    }
  },

  /**
   * Add comment to a submission
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @param {string} commentText - Comment text
   * @returns {Promise} - Promise with new comment
   */
  addComment: async (token, submissionId, commentText) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/coordinator/submissions/${submissionId}/comments`,
        { comment_text: commentText },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Ensure response.data.comment has comment_at property for compatibility
      if (response.data && response.data.comment && response.data.comment.commented_at) {
        response.data.comment.comment_at = response.data.comment.commented_at;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Select a submission for publication
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   * @param {boolean} selected - Selection status
   * @returns {Promise} - Promise with updated submission
   */
  selectSubmission: async (token, submissionId, selected) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/coordinator/submissions/${submissionId}/select`,
        { selected },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating submission selection:', error);
      throw error;
    }
  },

  /**
   * Get students in coordinator's faculty
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with students list
   */
  getStudents: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Get faculty report data
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with faculty report
   */
  getFacultyReport: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/reports/faculty`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty report:', error);
      throw error;
    }
  },

  /**
   * Get submissions without comments report
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with submissions without comments
   */
  getSubmissionsWithoutCommentsReport: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/reports/submissions-without-comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions without comments report:', error);
      return [];
    }
  },

  /**
   * Get submissions without comments after 14 days report
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with submissions without comments after 14 days
   */
  getSubmissionsWithoutComments14DaysReport: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/reports/submissions-without-comments-14-days`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions without comments after 14 days report:', error);
      throw error;
    }
  },

  /**
   * Get coordinator settings
   * @param {string} token - Authentication token
   * @returns {Promise} - Promise with coordinator settings
   */
  getSettings: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/coordinator/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching coordinator settings:', error);
      throw error;
    }
  },

  /**
   * Update coordinator settings
   * @param {string} token - Authentication token
   * @param {Object} settings - Updated settings
   * @returns {Promise} - Promise with updated settings
   */
  updateSettings: async (token, settings) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/coordinator/settings`,
        settings,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating coordinator settings:', error);
      throw error;
    }
  },

  /**
   * Download submission file
   * @param {string} token - Authentication token
   * @param {number} submissionId - Submission ID
   */
  downloadSubmissionFile: async (token, submissionId) => {
    try {
      window.open(`${API_URL}/api/coordinator/download/${submissionId}?token=${token}`, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

export default coordinatorService;