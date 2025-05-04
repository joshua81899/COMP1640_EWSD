import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import FormComponent from '../../components/FormComponent';
import { adminService } from '../../services/adminService';

/**
 * SubmissionsManagement component for reviewing and managing student submissions
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const SubmissionsManagement = ({ addToContentRefs }) => {
  const [submissions, setSubmissions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    faculty: '',
    status: '',
    academicYear: ''
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [viewingComments, setViewingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch submissions data
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Check API status first
        try {
          const apiStatus = await adminService.checkApiStatus(token);
          if (apiStatus.status !== 'online') {
            setError('Cannot connect to the server. Please try again later.');
            setIsLoading(false);
            return;
          }
        } catch (statusError) {
          console.error('Error checking API status:', statusError);
          // Continue anyway, as the main request might still work
        }
        
        console.log('Fetching submissions with params:', {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          filters
        });
        
        // Fetch submissions with pagination and filters
        const response = await adminService.getSubmissions(
          token, 
          currentPage, 
          itemsPerPage, 
          searchQuery,
          filters
        );
        
        // Validate response structure
        if (response && Array.isArray(response.submissions)) {
          setSubmissions(response.submissions);
          setTotalPages(Math.ceil(response.total / itemsPerPage) || 1);
        } else {
          console.warn('Unexpected response format:', response);
          setSubmissions([]);
          setTotalPages(1);
          
          // Only show error after multiple retries or if no submissions
          if (retryCount > 1 || !submissions.length) {
            setError('Failed to load submissions. Please try again.');
          }
        }
        
        // Fetch faculties for filter dropdown (only once)
        if (faculties.length === 0) {
          try {
            const facultyResponse = await adminService.getFaculties(token);
            setFaculties(Array.isArray(facultyResponse) ? facultyResponse : []);
          } catch (facultyError) {
            console.error('Error fetching faculties:', facultyError);
            // Continue without faculties if error
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, searchQuery, filters, itemsPerPage, retryCount, faculties.length]);

  // Fetch comments for a submission
  const fetchComments = async (submissionId) => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching comments for submission:', submissionId);
      
      // Fetch comments for the selected submission
      const commentsResponse = await adminService.getSubmissionComments(token, submissionId);
      
      // Validate comments response
      if (Array.isArray(commentsResponse)) {
        setComments(commentsResponse);
      } else {
        console.warn('Invalid comments response format:', commentsResponse);
        setComments([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments. Please try again.');
      setComments([]);
      setIsLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle view details button click
  const handleViewDetails = (submission) => {
    console.log('Viewing submission details:', submission);
    setSelectedSubmission(submission);
    setViewingComments(false);
    setCommentText('');
  };

  // Handle view comments button click
  const handleViewComments = async (submission) => {
    console.log('Viewing submission comments:', submission);
    setSelectedSubmission(submission);
    setViewingComments(true);
    setCommentText('');
    await fetchComments(submission.submission_id);
  };

  // Handle download file button click
  const handleDownloadFile = async (submission) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      console.log('Downloading file for submission:', submission.submission_id);
      
      // Show message while downloading
      setSuccessMessage('Starting file download...');
      
      // Download file
      await adminService.downloadSubmissionFile(token, submission.submission_id, submission.file_path);
      
      // Update success message
      setSuccessMessage('File download initiated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  // Handle approval/rejection of submission
  const handleUpdateStatus = async (submissionId, status) => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Updating submission ${submissionId} status to ${status}`);
      
      // Update submission status
      await adminService.updateSubmissionStatus(token, submissionId, status);
      
      // Refresh submissions list
      const response = await adminService.getSubmissions(
        token, 
        currentPage, 
        itemsPerPage, 
        searchQuery,
        filters
      );
      
      if (response && Array.isArray(response.submissions)) {
        setSubmissions(response.submissions);
        setTotalPages(Math.ceil(response.total / itemsPerPage) || 1);
      }
      
      setSuccessMessage(`Submission ${status === 'Selected' ? 'approved' : 'rejected'} successfully!`);
      setSelectedSubmission(null); // Close details view
      
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating submission status:', err);
      setError('Failed to update submission status. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle comment submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      if (!selectedSubmission) {
        setError('No submission selected.');
        setIsLoading(false);
        return;
      }
      
      console.log('Adding comment to submission:', selectedSubmission.submission_id);
      
      // Add comment
      await adminService.addSubmissionComment(token, selectedSubmission.submission_id, commentText);
      
      // Refresh comments
      await fetchComments(selectedSubmission.submission_id);
      
      setCommentText(''); // Clear comment input
      
      // Show success message
      setSuccessMessage('Comment added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString; // Return original string if parsing fails
    }
  };

  // Get faculty name by ID
  const getFacultyName = (facultyId) => {
    if (!facultyId) return 'Unknown';
    
    const faculty = faculties.find(f => f.faculty_id === facultyId);
    return faculty ? faculty.faculty_name : facultyId;
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

  // Handle retry button click
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
  };

  // Loading state with spinner
  if (isLoading && !submissions.length) {
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
        Submissions Management
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
            <div className="flex items-center mt-2">
              <button 
                onClick={handleRetry}
                className="bg-red-800 hover:bg-red-900 text-white px-3 py-1 rounded mr-2 text-sm flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              <button 
                className="bg-red-800 hover:bg-red-900 text-white px-3 py-1 rounded text-sm"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div ref={addToContentRefs} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {viewingComments ? 'Submission Comments' : 'Submission Details'}
              </h2>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {viewingComments ? (
                // Comments View
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">
                      {selectedSubmission.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Submitted by: {selectedSubmission.first_name} {selectedSubmission.last_name} on {formatDate(selectedSubmission.submitted_at)}
                    </p>
                  </div>
                  
                  {/* Comments List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {comments.length > 0 ? (
                      comments.map((comment, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3">
                          <p className="text-white text-sm">{comment.comment_text}</p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                            <span>{comment.first_name} {comment.last_name}</span>
                            <span>{formatDate(comment.commented_at || comment.comment_at)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500">No comments yet</p>
                    )}
                  </div>
                  
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="mt-4">
                    <div className="mb-3">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="secondary"
                        onClick={() => setViewingComments(false)}
                      >
                        Back to Details
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !commentText.trim()}
                      >
                        Add Comment
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                // Details View
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="text-white font-medium">{selectedSubmission.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Submitted By</p>
                      <p className="text-white font-medium">
                        {selectedSubmission.first_name} {selectedSubmission.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Faculty</p>
                      <p className="text-white font-medium">
                        {getFacultyName(selectedSubmission.faculty_id)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Submission Date</p>
                      <p className="text-white font-medium">
                        {formatDate(selectedSubmission.submitted_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Academic Year</p>
                      <p className="text-white font-medium">{selectedSubmission.academic_year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="text-white font-medium">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedSubmission.status)}`}>
                          {selectedSubmission.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white whitespace-pre-wrap">
                      {selectedSubmission.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400 mb-2">Attached File</p>
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-white mr-2">
                        {selectedSubmission.file_path ? selectedSubmission.file_path.split('/').pop() : 'No file attached'}
                      </span>
                      <button
                        onClick={() => handleDownloadFile(selectedSubmission)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-700 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => handleViewComments(selectedSubmission)}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      }
                    >
                      View Comments
                    </Button>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedSubmission.submission_id, 'Rejected')}
                        className="border-red-500 text-red-400 hover:bg-red-900 hover:text-red-200"
                        disabled={selectedSubmission.status === 'Rejected'}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedSubmission.submission_id, 'Selected')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={selectedSubmission.status === 'Selected'}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="faculty-filter" className="block text-sm font-medium text-gray-400 mb-1">Faculty</label>
              <select
                id="faculty-filter"
                value={filters.faculty}
                onChange={(e) => handleFilterChange('faculty', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.faculty_id} value={faculty.faculty_id}>
                    {faculty.faculty_name}
                  </option>
                ))}
              </select>
            </div>
            
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
                  value={searchQuery}
                  onChange={handleSearch}
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
        </div>
      </div>
      
      {/* Submissions List */}
      <div ref={addToContentRefs}>
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <tr key={submission.submission_id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {submission.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {submission.description ? 
                                submission.description.length > 50 ? 
                                  submission.description.substring(0, 50) + '...' :
                                  submission.description : 
                                'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getFacultyName(submission.faculty_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {submission.first_name} {submission.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(submission.submitted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(submission)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleViewComments(submission)}
                          className="text-green-400 hover:text-green-300 mr-3"
                        >
                          Comments
                        </button>
                        <button
                          onClick={() => handleDownloadFile(submission)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {isLoading ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        'No submissions found'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-6 py-3 bg-gray-700 rounded-b">
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

export default SubmissionsManagement;