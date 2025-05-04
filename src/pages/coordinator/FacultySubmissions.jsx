// src/pages/coordinator/FacultySubmissions.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import coordinatorService from '../../services/coordinatorService';

/**
 * FacultySubmissions component for viewing and managing submissions for a specific faculty
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 * @param {string} props.facultyId - ID of the faculty to show submissions for
 * @param {string} props.facultyName - Name of the faculty for display
 * @param {Function} props.onSelectSubmission - Handler for when a submission is selected
 */
const FacultySubmissions = ({ addToContentRefs, facultyId, facultyName, onSelectSubmission }) => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    needsComment: false,
    academicYear: '',
    search: ''
  });

  // Fetch submissions data
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Check for URL parameters (for direct links)
        const urlParams = new URLSearchParams(window.location.search);
        const needsCommentParam = urlParams.get('needsComment');
        if (needsCommentParam === 'true' && !filters.needsComment) {
          setFilters(prev => ({ ...prev, needsComment: true }));
          return; // Will trigger another useEffect call with updated filters
        }

        // For debugging - log the call to the API
        console.log('Fetching submissions with filters:', filters);

        try {
          // Fetch submissions using the coordinator service
          const result = await coordinatorService.getSubmissions(
            token,
            currentPage,
            10, // items per page
            filters.status,
            filters.search,
            filters.needsComment === true // Ensure it's a boolean
          );
          
          console.log('API response from submissions endpoint:', result);
          
          if (result && Array.isArray(result.submissions)) {
            setSubmissions(result.submissions);
            setTotalPages(result.totalPages || 1);
          } else if (result && Array.isArray(result)) {
            // Handle case where API returns an array directly instead of an object
            setSubmissions(result);
            setTotalPages(Math.ceil(result.length / 10));
          } else {
            // If we received a response but it doesn't have the expected structure
            setSubmissions([]);
            setTotalPages(1);
            console.warn('Unexpected API response format:', result);
          }
          
          setIsLoading(false);
        } catch (apiError) {
          console.error('API error:', apiError);
          throw apiError;
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again.');
        setSubmissions([]);
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [facultyId, currentPage, filters]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days since submission
  const getDaysSinceSubmission = (submissionDate) => {
    if (!submissionDate) return 0;
    
    const today = new Date();
    const submitted = new Date(submissionDate);
    const diffTime = Math.abs(today - submitted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-700 text-yellow-100';
      case 'Selected':
        return 'bg-green-700 text-green-100';
      case 'Rejected':
        return 'bg-red-700 text-red-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  // Handle approve submission
  const handleApproveSubmission = async (submissionId) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Approving submission:', submissionId);
      
      // Use the service to select the submission
      const result = await coordinatorService.selectSubmission(token, submissionId, true);
      console.log('Approval result:', result);
      
      // Update the submission in the local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.submission_id === submissionId 
            ? { ...sub, status: 'Selected', selected: true } 
            : sub
        )
      );
      
      setSuccessMessage('Submission approved successfully!');
      setIsLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error approving submission:', err);
      setError('Failed to approve submission. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle reject submission
  const handleRejectSubmission = async (submissionId) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Rejecting submission:', submissionId);
      
      // Use the service to reject the submission
      const result = await coordinatorService.selectSubmission(token, submissionId, false);
      console.log('Rejection result:', result);
      
      // Update the submission in the local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.submission_id === submissionId 
            ? { ...sub, status: 'Rejected', selected: false } 
            : sub
        )
      );
      
      setSuccessMessage('Submission rejected.');
      setIsLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error rejecting submission:', err);
      setError('Failed to reject submission. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle file download
  const handleDownloadFile = async (submission) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Use the service to download the file
      await coordinatorService.downloadSubmissionFile(token, submission.submission_id);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  // Dismiss error message
  const dismissError = () => {
    setError('');
  };

  if (isLoading && submissions.length === 0) {
    return <LoadingSpinner label="Loading submissions..." />;
  }

  return (
    <>
      <motion.h1 
        ref={addToContentRefs}
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {facultyName || 'Faculty'} Submissions
      </motion.h1>
      
      {/* Success Message */}
      {successMessage && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-green-700 border border-green-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccessMessage('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-red-700 border border-red-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={dismissError}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-gray-400 mb-1">Academic Year</label>
              <select
                id="year-filter"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">Search</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Search submissions..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full p-2 pl-10 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <input
                id="needs-comment-filter"
                type="checkbox"
                checked={filters.needsComment}
                onChange={(e) => handleFilterChange('needsComment', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="needs-comment-filter" className="ml-2 block text-sm text-gray-300">
                Show only submissions needing comments
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submissions List */}
      <div ref={addToContentRefs}>
        <ContentCard>
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const daysSinceSubmission = getDaysSinceSubmission(submission.submitted_at);
                const needsComment = submission.needs_comment || false;
                const commentCount = submission.comment_count || submission.comments_count || 0;
                const isUrgent = needsComment && daysSinceSubmission >= 10; // Urgent if no comment and 10+ days old
                
                return (
                  <div 
                    key={submission.submission_id} 
                    className={`bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors ${isUrgent ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{submission.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          By {submission.first_name} {submission.last_name} • Submitted {formatDate(submission.submitted_at)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {submission.description && submission.description.length > 100 
                            ? submission.description.substring(0, 100) + '...' 
                            : submission.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {needsComment && (
                            <span className="px-2 py-1 bg-yellow-800 text-yellow-200 rounded-full text-xs">
                              Needs Comment ({daysSinceSubmission} days)
                            </span>
                          )}
                          {commentCount > 0 && (
                            <span className="text-xs text-gray-400">
                              {commentCount} comment{commentCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectSubmission(submission)}
                        >
                          {needsComment ? 'Add Comment' : 'View Comments'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(submission)}
                        >
                          Download
                        </Button>
                        {submission.status === 'Submitted' && (
                          <div className="flex space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-400 hover:bg-red-900 hover:text-red-200"
                              onClick={() => handleRejectSubmission(submission.submission_id)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-400 hover:bg-green-900 hover:text-green-200"
                              onClick={() => handleApproveSubmission(submission.submission_id)}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No submissions found matching the current filters
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 px-4 py-3 bg-gray-700 rounded">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </>
  );
};

export default FacultySubmissions;