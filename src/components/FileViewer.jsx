import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * FileViewer component for downloading different file types
 * Only handles downloads, no preview functionality
 * 
 * @param {Object} props
 * @param {number} props.submissionId - ID of the submission to download
 * @param {string} props.filePath - Path to the file (optional, used for direct path)
 * @param {string} props.fileType - Type of file (pdf, doc, docx, jpeg, jpg, png)
 * @param {string} props.title - Title of the submission
 * @param {string} props.token - Authentication token (optional, for authenticated users)
 * @param {boolean} props.isPublic - Whether this is being viewed in public context
 * @param {Function} props.onError - Error callback
 */
const FileViewer = ({
  submissionId,
  filePath,
  fileType,
  title = "Document",
  token,
  isPublic = false,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine file type if not provided
  const determineFileType = (path) => {
    if (!path) return null;
    const extension = path.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'document';
    
    return 'unknown';
  };

  const detectedFileType = fileType || determineFileType(filePath);

  // Handle file download
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let downloadUrl;
      
      if (submissionId) {
        if (isPublic) {
          downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/public/submissions/${submissionId}/download`;
        } else {
          downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/submissions/${submissionId}/download`;
        }
        
        // Fetch the file as a blob
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
        let filename = title;
        
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
      } else if (filePath) {
        // For direct file path, fetch it as blob
        const response = await axios.get(filePath, {
          responseType: 'blob',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        // Create download link
        const blobUrl = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', title || 'download');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error('Either submissionId or filePath must be provided');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err.response?.data?.error || err.message || 'Failed to download file');
      if (onError) onError(err);
      setIsLoading(false);
    }
  };

  // Render download interface
  return (
    <div className="flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          {/* File type icon */}
          {detectedFileType === 'pdf' && (
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {detectedFileType === 'image' && (
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {detectedFileType === 'document' && (
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {detectedFileType === 'unknown' && (
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className="text-white font-medium truncate max-w-md">{title}</span>
        </div>
        
        {/* Download Button */}
        <button 
          onClick={handleDownload}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download file"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </>
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-800 border border-red-600 text-white">
          <p className="font-medium">Error downloading file:</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* File info */}
      <div className="p-8 flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center">
          {/* File Type Icons based on file type */}
          {detectedFileType === 'pdf' && (
            <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {detectedFileType === 'image' && (
            <svg className="w-20 h-20 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {detectedFileType === 'document' && (
            <svg className="w-20 h-20 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {detectedFileType === 'unknown' && (
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">
            Click the download button to save this file to your device.
          </p>
          <button 
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;