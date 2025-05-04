import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FileTypeIcon from './FileTypeIcon';
import axios from 'axios';

/**
 * SubmissionCard component for displaying submission information
 * 
 * @param {Object} props
 * @param {Object} props.submission - The submission data
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {string} props.token - Authentication token (if user is authenticated)
 * @param {Function} props.onSelectSubmission - Callback when submission is selected
 */
const SubmissionCard = ({ submission, isAuthenticated, token, onSelectSubmission }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Selected':
        return 'bg-green-700 text-green-100';
      case 'Rejected':
        return 'bg-red-700 text-red-100';
      default:
        return 'bg-yellow-700 text-yellow-100';
    }
  };

  // Handle file download
  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownloading(true);
    setError(null);
    
    try {
      // Determine if this is a public or private download
      const downloadUrl = isAuthenticated 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/submissions/${submission.submission_id}/download`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/public/submissions/${submission.submission_id}/download`;

      // Make the request with proper headers
      const response = await axios.get(downloadUrl, {
        responseType: 'blob',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      // Create download link
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Use Content-Disposition header for filename if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = submission.title || 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err.response?.data?.error || err.message || 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
      onClick={() => onSelectSubmission && onSelectSubmission(submission)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white mb-2">{submission.title}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(submission.status)}`}>
            {submission.status}
          </span>
        </div>
        
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {submission.description || 'No description provided.'}
        </p>
        
        <div className="flex items-center text-sm text-gray-400 mb-3">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(submission.submitted_at)}
        </div>
        
        <div className="flex items-center text-gray-400 text-sm mb-4">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {submission.first_name} {submission.last_name}
        </div>
        
        {/* File Information and Download */}
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm">
            <FileTypeIcon fileType={submission.file_type} className="h-5 w-5 mr-1" />
            <span className="text-gray-400">
              {submission.file_type ? submission.file_type.toUpperCase() : 'File'}
            </span>
          </div>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded flex items-center transition disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-3 p-2 bg-red-800 border border-red-600 text-white text-sm rounded">
            <p>{error}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              className="mt-1 text-xs text-red-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionCard;