import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminService } from '../../services/adminService';

/**
 * AnalyticsView component for displaying system analytics and visualizations
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const AnalyticsView = ({ addToContentRefs }) => {
  const [pageVisits, setPageVisits] = useState([]);
  const [browserStats, setBrowserStats] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'year'

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        // Fetch page visits data with date range filter
        const visitsResponse = await adminService.getPageVisits(token, dateRange);
        setPageVisits(visitsResponse);
        
        // Fetch browser statistics
        const browserResponse = await adminService.getBrowserStats(token);
        setBrowserStats(browserResponse);
        
        // Fetch user activity data
        const activityResponse = await adminService.getUserActivity(token, dateRange);
        setUserActivity(activityResponse);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Calculate percentage for browser statistics
  const calculatePercentage = (count, total) => {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  };

  // Calculate total visits
  const totalVisits = pageVisits.reduce((sum, page) => sum + page.view_count, 0);

  // Calculate max count for scaling
  const maxPageVisits = Math.max(...pageVisits.map(page => page.view_count), 1);

  if (isLoading && pageVisits.length === 0) {
    return <LoadingSpinner label="Loading analytics data..." />;
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
        System Analytics
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
      
      {/* Date Range Filter */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="bg-gray-800 p-4 rounded-lg flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none ${
                dateRange === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleDateRangeChange('week')}
            >
              Last Week
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium focus:z-10 focus:outline-none ${
                dateRange === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleDateRangeChange('month')}
            >
              Last Month
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none ${
                dateRange === 'year' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleDateRangeChange('year')}
            >
              Last Year
            </button>
          </div>
        </div>
      </div>
      
      <div ref={addToContentRefs} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Page Visits */}
        <ContentCard title="Page Visits">
          <div className="space-y-4">
            {pageVisits.length > 0 ? (
              pageVisits.map((page, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">
                      {page.page_url}
                    </span>
                    <span className="text-sm text-gray-400">
                      {page.view_count} views
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <motion.div 
                      className="bg-blue-600 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(page.view_count / maxPageVisits) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    ></motion.div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                No page visits data available
              </div>
            )}
          </div>
        </ContentCard>
        
        {/* Browser Statistics */}
        <ContentCard title="Browser Usage">
          <div className="grid grid-cols-1 gap-4">
            {browserStats.length > 0 ? (
              browserStats.map((browser, index) => {
                const percentage = calculatePercentage(browser.user_count, browserStats.reduce((sum, b) => sum + b.user_count, 0));
                
                return (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                          {browser.browser_name === 'Chrome' && (
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.003h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.366zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" />
                            </svg>
                          )}
                          {browser.browser_name === 'Firefox' && (
                            <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5z" />
                              <path d="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5S16.142 4.5 12 4.5z" />
                            </svg>
                          )}
                          {browser.browser_name === 'Safari' && (
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1 22.949c-5.822-.356-10.526-5.11-10.83-10.95h10.83v10.95zm0-12.95H2.171C2.665 5.159 6.49 1.222 11.42.537v9.462h1.58zm0 0v10.949c5.823-.356 10.526-5.11 10.83-10.949H13z" />
                            </svg>
                          )}
                          {browser.browser_name === 'Edge' && (
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5z" />
                              <path d="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5h7.5l-3.75 3.75H4.5c0 4.142 3.358 7.5 7.5 7.5l7.5-7.5c0-4.142-3.358-7.5-7.5-7.5z" />
                            </svg>
                          )}
                          {!['Chrome', 'Firefox', 'Safari', 'Edge'].includes(browser.browser_name) && (
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5z" />
                              <path d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{browser.browser_name}</p>
                          <p className="text-xs text-gray-400">{browser.browser_version || 'Various versions'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{percentage}%</p>
                        <p className="text-xs text-gray-400">{browser.user_count} users</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <motion.div 
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      ></motion.div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                No browser statistics available
              </div>
            )}
          </div>
        </ContentCard>
      </div>
      
      {/* User Activity */}
      <div ref={addToContentRefs}>
        <ContentCard title="User Activity Timeline">
          <div className="space-y-4">
            {userActivity.length > 0 ? (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                
                {/* Activity Items */}
                <div className="space-y-6">
                  {userActivity.map((activity, index) => (
                    <motion.div 
                      key={index}
                      className="relative pl-14"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-blue-600 z-10"></div>
                      
                      {/* Content */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{activity.action_type}</p>
                            <p className="text-sm text-gray-400 mt-1">{activity.action_details}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              by {activity.first_name} {activity.last_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{formatDate(activity.log_timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No user activity data available
              </div>
            )}
          </div>
        </ContentCard>
      </div>
    </>
  );
};

export default AnalyticsView;