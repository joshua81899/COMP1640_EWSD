import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import coordinatorService from '../../services/coordinatorService';

/**
 * SubmissionComments component for handling comments on a submission
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 * @param {Object} props.submission - The submission to display comments for
 * @param {Function} props.onBack - Function to handle back button click
 */
const SubmissionComments = ({ addToContentRefs, submission, onBack }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const commentInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionFile, setSubmissionFile] = useState(null);
  
  // Fetch comments for the submission
  useEffect(() => {
    const fetchComments = async () => {
      if (!submission) return;
      
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

        console.log('Fetching comments for submission:', submission.submission_id);
        
        // Fetch submission details with comments
        const result = await coordinatorService.getSubmissionDetails(token, submission.submission_id);
        console.log('API response:', result);
        
        if (result && result.submission) {
          setSubmissionDetails(result.submission);
          
          // Set submission file info
          setSubmissionFile({
            name: result.submission.file_path ? result.submission.file_path.split('/').pop() || 'document.pdf' : 'document.pdf',
            type: result.submission.file_type || 'pdf',
            size: '(File size unavailable)'
          });
          
          // Set comments from API
          if (Array.isArray(result.comments)) {
            setComments(result.comments);
          } else {
            setComments([]);
          }
        } else {
          setSubmissionDetails(submission);
          setComments([]);
        }
        
        setIsLoading(false);
        
        // Focus comment input if no comments exist
        if ((!result || !result.comments || result.comments.length === 0) && commentInputRef.current) {
          commentInputRef.current.focus();
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again.');
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [submission]);

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || !submission) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setSubmitting(false);
        return;
      }

      console.log('Submitting comment for submission:', submission.submission_id);
      
      // Submit comment to API
      const result = await coordinatorService.addComment(token, submission.submission_id, commentText);
      console.log('API response for comment submission:', result);
      
      // If successful, add the new comment to the list
      if (result && result.comment) {
        // Add the new comment to the beginning of the list
        setComments(prev => [result.comment, ...prev]);
      }
      
      // Clear the comment input
      setCommentText('');
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Handle both commented_at and comment_at
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
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
      case 'jpeg':
      case 'jpg':
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

  // Handle file download
  const handleDownloadFile = async () => {
    if (!submissionDetails) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Use the service to download the file
      await coordinatorService.downloadSubmissionFile(token, submissionDetails.submission_id);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  if (!submission) {
    return (
      <div ref={addToContentRefs} className="text-center py-8">
        <div className="text-yellow-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl text-white mb-2">No Submission Selected</h3>
        <p className="text-gray-400 mb-4">Please select a submission to view or add comments.</p>
        <Button 
          variant="primary"
          onClick={onBack}
        >
          Back to Submissions
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading comments..." />;
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
        Submission Comments
      </motion.h1>
      
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
      
      {/* Submission Details */}
      <div ref={addToContentRefs} className="mb-6">
        <ContentCard>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">{submissionDetails?.title || submission.title || 'Submission'}</h2>
              <p className="text-sm text-gray-400 mt-1">
                By {submissionDetails?.first_name || submission.first_name} {submissionDetails?.last_name || submission.last_name} • Submitted {formatDate(submissionDetails?.submitted_at || submission.submitted_at)}
              </p>
              <p className="text-sm text-gray-300 mt-3">
                {submissionDetails?.description || submission.description || 'No description provided.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
            >
              Back to List
            </Button>
          </div>
          
          {/* File Information */}
          {submissionFile && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg flex items-center">
              <div className="mr-3">
                {getFileIcon(submissionFile.type)}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{submissionFile.name}</p>
                <p className="text-xs text-gray-400">{submissionFile.size}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadFile}
              >
                Download
              </Button>
            </div>
          )}
        </ContentCard>
      </div>
      
      {/* Comments Form */}
      <div ref={addToContentRefs} className="mb-6">
        <ContentCard>
          <h3 className="text-lg font-medium text-white mb-4">Add Comment</h3>
          <form onSubmit={handleSubmitComment}>
            <div className="mb-4">
              <textarea
                ref={commentInputRef}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a comment to this submission..."
                rows="4"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!commentText.trim() || submitting}
                isLoading={submitting}
              >
                {submitting ? "Submitting..." : "Add Comment"}
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
      
      {/* Comments List */}
      <div ref={addToContentRefs}>
        <ContentCard>
          <h3 className="text-lg font-medium text-white mb-4">
            Comments ({comments.length})
          </h3>
          
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div 
                  key={comment.comment_id} 
                  className={`p-4 rounded-lg ${comment.user_role === 'COORD' || comment.role_id === 3 ? 'bg-blue-900/30 border border-blue-800' : 'bg-gray-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-white ${comment.user_role === 'COORD' || comment.role_id === 3 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                        {comment.first_name.charAt(0)}
                      </div>
                      <span className="ml-2 text-white font-medium">
                        {comment.first_name} {comment.last_name}
                        {(comment.user_role === 'COORD' || comment.role_id === 3) && (
                          <span className="ml-2 text-xs bg-blue-700 text-blue-200 px-2 py-0.5 rounded-full">
                            Coordinator
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.commented_at || comment.comment_at)}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400">No comments yet. Be the first to add a comment.</p>
            </div>
          )}
        </ContentCard>
      </div>
    </>
  );
};

export default SubmissionComments;