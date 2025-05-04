import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { managerService } from '../../services/managerService';

/**
 * SelectedSubmissions component for viewing and downloading selected submissions
 * specific to the Marketing Manager role
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const SelectedSubmissions = ({ addToContentRefs }) => {
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
    academicYear: ''
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Fetch submissions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        // Fetch submissions with pagination and filters
        const response = await managerService.getSelectedSubmissions(
          token, 
          currentPage, 
          itemsPerPage, 
          searchQuery,
          filters
        );
        
        setSubmissions(response.submissions || []);
        setTotalPages(Math.ceil(response.total / itemsPerPage) || 1);
        
        // Fetch faculties for filter dropdown
        const facultyResponse = await managerService.getFaculties(token);
        setFaculties(facultyResponse || []);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, searchQuery, filters, itemsPerPage]);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
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
    setSelectedSubmission(submission);
  };

  // Handle download file button click
  const handleDownloadFile = async (submission) => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      // Download file
      await managerService.downloadSubmissionFile(token, submission.submission_id, submission.file_path);
      
      // Show success message
      setSuccessMessage(`File "${submission.title}" download initiated successfully!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle downloading all selected submissions as a ZIP
  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      setDownloadProgress(10); // Start progress indicator
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      // Update progress to indicate request is being processed
      setDownloadProgress(30);
      
      // Download ZIP file of all selected submissions or just the selected ones
      const submissionIds = selectedItems.length > 0 
        ? selectedItems.map(id => parseInt(id)) 
        : null;
      
      // This is the key change - use the API endpoint directly instead of navigation
      // Request the ZIP file
      const result = await managerService.downloadSubmissionsZip(token, submissionIds);
      
      // Update progress
      setDownloadProgress(70);
      
      // Handle the response appropriately
      if (result && result.success) {
        setSuccessMessage(result.message || 'ZIP file download initiated successfully!');
        setDownloadProgress(100);
      } else if (result && result.development) {
        // Handle development mode response
        setSuccessMessage(`${result.message || 'ZIP file feature is being implemented!'} We're working on it and it will be available soon.`);
        setDownloadProgress(100);
      } else {
        throw new Error(result?.message || 'Failed to download ZIP file');
      }
      
      // Reset progress and loading state
      setTimeout(() => {
        setDownloadProgress(0);
        setDownloadingZip(false);
      }, 1000);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error downloading ZIP:', err);
      setError('Failed to download ZIP file. Please try again.');
      setDownloadingZip(false);
      setDownloadProgress(0);
    }
  };

  // Handle checkbox selection for individual submissions
  const handleSelectSubmission = (submissionId) => {
    setSelectedItems(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedItems.length === submissions.length) {
      // If all are selected, unselect all
      setSelectedItems([]);
    } else {
      // Otherwise, select all
      setSelectedItems(submissions.map(s => s.submission_id));
    }
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

  // Get faculty name by ID
  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.faculty_id === facultyId);
    return faculty ? faculty.faculty_name : facultyId;
  };

  // Get file type icon based on file extension
  const getFileTypeIcon = (filePath) => {
    if (!filePath) return null;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
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
        Selected Submissions
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
              onClick={() => setError('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div ref={addToContentRefs} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                Submission Details
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
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">
                      {selectedSubmission.email || 'Not available'}
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
                    {getFileTypeIcon(selectedSubmission.file_path)}
                    <span className="text-white ml-2 mr-2">
                      {selectedSubmission.file_path?.split('/').pop() || 'No file attached'}
                    </span>
                    <button
                      onClick={() => handleDownloadFile(selectedSubmission)}
                      className="text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end border-t border-gray-700 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedSubmission(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Download All Button & Filters */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="w-full md:w-auto mb-4 md:mb-0">
              <Button
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
                className="w-full"
              >
                {downloadingZip ? "Preparing ZIP..." : (selectedItems.length > 0 ? `Download Selected (${selectedItems.length})` : "Download All")}
              </Button>
              
              {/* Download Progress Bar */}
              {downloadProgress > 0 && (
                <div className="w-full h-1 bg-gray-700 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-400 w-full md:w-auto text-center md:text-right">
              {submissions.length} selected submission{submissions.length !== 1 ? 's' : ''} found
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          {isLoading && submissions.length > 0 && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-10">
              <LoadingSpinner label="Loading..." />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={submissions.length > 0 && selectedItems.length === submissions.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                  </th>
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {submissions.map((submission) => (
                  <tr key={submission.submission_id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-3 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(submission.submission_id)}
                          onChange={() => handleSelectSubmission(submission.submission_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center">
                          {getFileTypeIcon(submission.file_path)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                        title="View details"
                      >
                        <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownloadFile(submission)}
                        className="text-purple-400 hover:text-purple-300"
                        title="Download file"
                      >
                        <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No submissions found
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

export default SelectedSubmissions;