// src/pages/coordinator/CoordinatorOverview.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatCard from '../../components/StatCard';
import ContentCard from '../../components/ContentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import coordinatorService from '../../services/coordinatorService';

/**
 * CoordinatorOverview component for displaying faculty coordinator dashboard 
 * with statistics and quick access
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 * @param {Object} props.facultyInfo - Faculty information
 * @param {Function} props.onSelectSubmission - Function to handle submission selection for comments
 */
const CoordinatorOverview = ({ addToContentRefs, facultyInfo, onSelectSubmission }) => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingComments: 0,
    selectedSubmissions: 0,
    totalContributors: 0
  });
  const [submissionsWithoutComments, setSubmissionsWithoutComments] = useState([]);
  const [submissionsToReview, setSubmissionsToReview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch dashboard statistics using service
        const statsData = await coordinatorService.getDashboardStats(token);
        
        setStats({
          totalSubmissions: statsData.totalSubmissions || 0,
          pendingComments: statsData.pendingComments || 0,
          selectedSubmissions: statsData.selectedSubmissions || 0,
          totalContributors: statsData.totalContributors || 0
        });

        // Fetch submissions without comments using service
        const noCommentsData = await coordinatorService.getSubmissionsWithoutCommentsReport(token);
        setSubmissionsWithoutComments(Array.isArray(noCommentsData) ? noCommentsData.slice(0, 5) : []);

        // Fetch recent submissions using service
        const recentSubmissions = await coordinatorService.getRecentSubmissions(token, 2);
        setSubmissionsToReview(Array.isArray(recentSubmissions) ? recentSubmissions : []);

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [retryCount]);

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

  // Handle retry button click
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div ref={addToContentRefs} className="text-center py-8">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Try Again
        </button>
      </div>
    );
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
        {facultyInfo?.faculty_name || 'Faculty'} Coordinator Dashboard
      </motion.h1>
      
      {/* Statistics Cards */}
      <div ref={addToContentRefs} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard 
          title="Need Comments"
          value={stats.pendingComments}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          iconColor="text-yellow-400"
        />
        <StatCard 
          title="Selected"
          value={stats.selectedSubmissions}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="text-green-400"
        />
        <StatCard 
          title="Contributors"
          value={stats.totalContributors}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          iconColor="text-purple-400"
        />
      </div>
      
      <div ref={addToContentRefs} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Submissions Needing Comments */}
        <div className="lg:col-span-2">
          <ContentCard title="Submissions Needing Comments">
            {submissionsWithoutComments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {submissionsWithoutComments.map((submission) => {
                  const daysSinceSubmission = getDaysSinceSubmission(submission.submitted_at);
                  const isUrgent = daysSinceSubmission >= 10; // Highlight if close to 14 days
                  
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
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className={`text-sm ${isUrgent ? 'text-yellow-400 font-medium' : 'text-gray-400'}`}>
                            {daysSinceSubmission} days ago
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2"
                            onClick={() => onSelectSubmission(submission)}
                          >
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No submissions pending comments
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/coordinator/submissions?needsComment=true'}
              >
                View All
              </Button>
            </div>
          </ContentCard>
        </div>
        
        {/* Quick Actions */}
        <div>
          <ContentCard title="Quick Actions">
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/coordinator/submissions?needsComment=true'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded flex items-center justify-center transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Review Submissions Needing Comments
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Selected Submissions
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Reports
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Update Settings
              </button>
            </div>
          </ContentCard>
        </div>
      </div>
      
      {/* Recent Submissions */}
      <div ref={addToContentRefs}>
        <ContentCard title="Recent Submissions">
          {submissionsToReview.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissionsToReview.map((submission) => (
                <div 
                  key={submission.submission_id}
                  className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <h3 className="text-white font-medium">{submission.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    By {submission.first_name} {submission.last_name} • {formatDate(submission.submitted_at)}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="px-2 py-1 bg-yellow-800 text-yellow-200 rounded-full text-xs">
                      {submission.status}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectSubmission(submission)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No recent submissions to review
            </div>
          )}
        </ContentCard>
      </div>
    </>
  );
};

export default CoordinatorOverview;