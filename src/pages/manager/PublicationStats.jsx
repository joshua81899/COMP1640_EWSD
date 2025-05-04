import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { managerService } from '../../services/managerService';

/**
 * PublicationStats component for displaying statistics related to submissions
 * specific to the Marketing Manager role
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const PublicationStats = ({ addToContentRefs }) => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalContributors: 0,
    selectedSubmissions: 0,
    pendingSelections: 0
  });
  const [facultyStats, setFacultyStats] = useState([]);
  const [contributorStats, setContributorStats] = useState([]);
  const [yearlyStats, setYearlyStats] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('faculty');
  const [chartTimespan, setChartTimespan] = useState('year');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch statistics data
  useEffect(() => {
    const fetchStats = async () => {
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

        // Create an array of promises for parallel data fetching
        const promises = [];
        
        // Main stats promise - THIS IS THE KEY CHANGE, using the correct API endpoint
        promises.push(
          managerService.getPublicationStats(token).catch(err => {
            console.error('Error fetching publication stats:', err);
            return {
              totalSubmissions: 0,
              selectedSubmissions: 0,
              totalContributors: 0,
              pendingSelections: 0
            };
          })
        );
        
        // Faculty stats promise - should always be fetched for the default tab
        promises.push(
          managerService.getFacultySubmissionStats(token).catch(err => {
            console.error('Error fetching faculty stats:', err);
            return [];
          })
        );
        
        // Add more promises based on active tab
        if (activeTab === 'contributors' || activeTab === 'all') {
          promises.push(
            managerService.getContributorStats(token).catch(err => {
              console.error('Error fetching contributor stats:', err);
              return [];
            })
          );
        } else {
          // Add a placeholder to maintain array indices
          promises.push(Promise.resolve([]));
        }
        
        if (activeTab === 'trends' || activeTab === 'all') {
          promises.push(
            managerService.getYearlyStats(token, chartTimespan).catch(err => {
              console.error('Error fetching yearly stats:', err);
              return [];
            })
          );
        } else {
          // Add a placeholder to maintain array indices
          promises.push(Promise.resolve([]));
        }
        
        if (activeTab === 'types' || activeTab === 'all') {
          promises.push(
            managerService.getDocumentTypeStats(token).catch(err => {
              console.error('Error fetching document type stats:', err);
              return [];
            })
          );
        } else {
          // Add a placeholder to maintain array indices
          promises.push(Promise.resolve([]));
        }

        // Wait for all promises to resolve
        const results = await Promise.all(promises);
        
        // Process results
        // THIS IS THE KEY FIX: ensure we're correctly mapping the API response fields
        const mainStats = results[0];
        
        // Update state with fetched data - key change to ensure we map fields correctly
        setStats({
          totalSubmissions: mainStats.totalSubmissions || 0,
          totalContributors: mainStats.totalContributors || 0,
          selectedSubmissions: mainStats.selectedSubmissions || 0,
          pendingSelections: mainStats.pendingSelections || 0
        });
        
        setFacultyStats(results[1] || []);
        
        // Store faculty stats and main stats in localStorage
        localStorage.setItem('cachedStats', JSON.stringify(mainStats));
        localStorage.setItem('cachedFacultyStats', JSON.stringify(results[1] || []));
        
        // Update tab-specific data
        if (activeTab === 'contributors' || activeTab === 'all') {
          setContributorStats(results[2] || []);
        }
        
        if (activeTab === 'trends' || activeTab === 'all') {
          setYearlyStats(results[3] || []);
        }
        
        if (activeTab === 'types' || activeTab === 'all') {
          setDocumentTypes(results[4] || []);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        
        // Try to load from cache if available
        try {
          const cachedStats = JSON.parse(localStorage.getItem('cachedStats') || '{}');
          const cachedFacultyStats = JSON.parse(localStorage.getItem('cachedFacultyStats') || '[]');
          
          if (cachedStats && Object.keys(cachedStats).length > 0) {
            setStats({
              totalSubmissions: cachedStats.totalSubmissions || 0,
              totalContributors: cachedStats.totalContributors || 0,
              selectedSubmissions: cachedStats.selectedSubmissions || 0,
              pendingSelections: cachedStats.pendingSelections || 0
            });
          }
          
          if (cachedFacultyStats && cachedFacultyStats.length > 0) {
            setFacultyStats(cachedFacultyStats);
          }
        } catch (cacheErr) {
          console.error('Error loading from cache:', cacheErr);
        }
        
        setError('Failed to load statistics. Please try again.');
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [activeTab, chartTimespan, retryCount]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle timespan change for charts
  const handleTimespanChange = (timespan) => {
    setChartTimespan(timespan);
  };

  // Handle retry button click
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
  };

  // Calculate percentage for faculty submissions
  const calculatePercentage = (value, total) => {
    if (!total || !value) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  // Generate downloadable CSV data
  const generateCSV = (data, headers) => {
    const headerRow = headers.join(',');
    const dataRows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
  };

  // Handle export to CSV
  const handleExportCSV = (data, headers, filename) => {
    const csvContent = generateCSV(data, headers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object to prevent memory leaks
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Show loading spinner if loading and no data is available
  if (isLoading && !stats.totalSubmissions && !facultyStats.length) {
    return <LoadingSpinner label="Loading statistics..." />;
  }

  // Show error message if there's an error and no data
  if (error && !stats.totalSubmissions && !facultyStats.length) {
    return (
      <div ref={addToContentRefs} className="text-center py-8">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl text-white mb-2">Error Loading Statistics</h3>
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
        Publication Statistics
      </motion.h1>
      
      {/* Error Message - when we have some data but couldn't fully update */}
      {error && (stats.totalSubmissions > 0 || facultyStats.length > 0) && (
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
      
      {/* Statistics Overview Cards */}
      <div ref={addToContentRefs} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Submissions Card */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Total Submissions</h3>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Total Submissions</h3>
              <p className="text-3xl font-bold text-white">{stats.totalSubmissions}</p>
            </>
          )}
        </motion.div>
        
        {/* Selected Submissions Card */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {isLoading ? (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Selected for Publication</h3>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Selected for Publication</h3>
              <p className="text-3xl font-bold text-green-400">{stats.selectedSubmissions}</p>
            </>
          )}
        </motion.div>
        
        {/* Total Contributors Card */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isLoading ? (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Total Contributors</h3>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Total Contributors</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.totalContributors}</p>
            </>
          )}
        </motion.div>
        
        {/* Selection Rate Card */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {isLoading ? (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Selection Rate</h3>
              <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Selection Rate</h3>
              <p className="text-3xl font-bold text-yellow-400">
                {stats.totalSubmissions > 0 
                  ? `${((stats.selectedSubmissions / stats.totalSubmissions) * 100).toFixed(1)}%` 
                  : '0%'}
              </p>
            </>
          )}
        </motion.div>
      </div>
      
      {/* Statistics Tabs */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="flex overflow-x-auto border-b border-gray-700">
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'faculty'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('faculty')}
          >
            Faculty Stats
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'contributors'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('contributors')}
          >
            Contributors
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'trends'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('trends')}
          >
            Trends
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'types'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('types')}
          >
            Document Types
          </button>
        </div>
      </div>
      
      {/* Faculty Statistics Tab */}
      {activeTab === 'faculty' && (
        <ContentCard ref={addToContentRefs}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Faculty Submissions</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportCSV(
                facultyStats, 
                ['Faculty', 'Submissions', 'Selected', 'Selection Rate', 'Contributors'],
                'faculty-statistics.csv'
              )}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              disabled={isLoading || facultyStats.length === 0}
            >
              Export CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Selected
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Selection Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contributors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {isLoading ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, index) => (
                    <tr key={`loading-row-${index}`}>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div></td>
                    </tr>
                  ))
                ) : facultyStats.length > 0 ? (
                  facultyStats.map((faculty, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {faculty.faculty_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {faculty.submission_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {faculty.selected_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {calculatePercentage(faculty.selected_count, faculty.submission_count)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {faculty.contributor_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No faculty statistics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Visual representation of faculty data */}
          {!isLoading && facultyStats.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-white mb-4">Faculty Comparison</h4>
              <div className="space-y-4">
                {facultyStats.map((faculty, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white">{faculty.faculty_name}</span>
                      <span className="text-gray-400">{faculty.selected_count} / {faculty.submission_count}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${calculatePercentage(faculty.selected_count, faculty.submission_count)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ContentCard>
      )}
      
      {/* Contributors Statistics Tab */}
      {activeTab === 'contributors' && (
        <ContentCard ref={addToContentRefs}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Top Contributors</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportCSV(
                contributorStats, 
                ['Name', 'Email', 'Faculty', 'Submissions', 'Selected'],
                'contributor-statistics.csv'
              )}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              disabled={isLoading || contributorStats.length === 0}
            >
              Export CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Selected
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {isLoading ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, index) => (
                    <tr key={`loading-row-${index}`}>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-40 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div></td>
                    </tr>
                  ))
                ) : contributorStats.length > 0 ? (
                  contributorStats.map((contributor, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {contributor.first_name} {contributor.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contributor.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contributor.faculty_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contributor.submission_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {contributor.selected_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No contributor statistics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}
      
      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <ContentCard ref={addToContentRefs}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Submission Trends</h3>
            <div className="flex space-x-2">
              <Button
                variant={chartTimespan === 'month' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleTimespanChange('month')}
                disabled={isLoading}
              >
                Monthly
              </Button>
              <Button
                variant={chartTimespan === 'year' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleTimespanChange('year')}
                disabled={isLoading}
              >
                Yearly
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportCSV(
                  yearlyStats, 
                  ['Period', 'Submissions', 'Selected'],
                  `${chartTimespan}-trends.csv`
                )}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
                disabled={isLoading || yearlyStats.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
          
          {/* Chart representation */}
          <div className="mt-4">
            <div className="w-full h-64 bg-gray-700 rounded-lg p-4">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <LoadingSpinner label="Loading trend data..." />
                </div>
              ) : yearlyStats.length > 0 ? (
                <div className="relative h-full">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-400">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  {/* Chart area */}
                  <div className="ml-10 h-full flex items-end">
                    {yearlyStats.map((stat, index) => {
                      // Calculate the max value for proper scaling
                      const maxCount = Math.max(...yearlyStats.map(s => s.submission_count || 0));
                      const height = maxCount > 0 
                        ? ((stat.submission_count / maxCount) * 100)
                        : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                          {/* Total submissions bar */}
                          <div 
                            className="w-8 bg-blue-600 relative group"
                            style={{ 
                              height: `${height}%`,
                              minHeight: stat.submission_count > 0 ? '2px' : '0'
                            }}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Submissions: {stat.submission_count}
                            </div>
                            
                            {/* Selected submissions bar */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 bg-green-500"
                              style={{ 
                                height: stat.submission_count > 0 
                                  ? `${(stat.selected_count / stat.submission_count) * 100}%` 
                                  : '0',
                                minHeight: stat.selected_count > 0 ? '2px' : '0'
                              }}
                            ></div>
                          </div>
                          
                          {/* X-axis label */}
                          <div className="mt-2 text-xs text-gray-400 whitespace-nowrap">
                            {stat.period}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 mr-2"></div>
                <span className="text-sm text-gray-300">Total Submissions</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-300">Selected</span>
              </div>
            </div>
          </div>
        </ContentCard>
      )}
      
      {/* Document Types Tab */}
      {activeTab === 'types' && (
        <ContentCard ref={addToContentRefs}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Document Types</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportCSV(
                documentTypes, 
                ['Type', 'Count', 'Percentage'],
                'document-types.csv'
              )}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              disabled={isLoading || documentTypes.length === 0}
            >
              Export CSV
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document types table */}
            <div>
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={`loading-row-${index}`} className="h-8 bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
                ))
              ) : (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {documentTypes.length > 0 ? (
                      documentTypes.map((type, index) => (
                        <tr key={index} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {type.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {type.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {type.percentage}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                          No document type statistics available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Visual chart */}
            <div>
              {isLoading ? (
                <div className="h-64 w-full bg-gray-700 rounded-lg animate-pulse"></div>
              ) : documentTypes.length > 0 ? (
                <div className="h-64 flex items-center">
                  <div className="w-64 h-64 mx-auto relative">
                    {/* Simplified donut chart */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {documentTypes.map((type, index) => {
                        const percentage = parseFloat(type.percentage);
                        const prevPercentages = documentTypes
                          .slice(0, index)
                          .reduce((acc, t) => acc + parseFloat(t.percentage || 0), 0);
                        
                        // Calculate SVG arc parameters
                        const startAngle = (prevPercentages / 100) * 360;
                        const endAngle = startAngle + (percentage / 100) * 360;
                        
                        // Convert to radians
                        const startRad = (startAngle - 90) * Math.PI / 180;
                        const endRad = (endAngle - 90) * Math.PI / 180;
                        
                        // Calculate points
                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);
                        
                        // Determine large arc flag
                        const largeArcFlag = percentage > 50 ? 1 : 0;
                        
                        // Generate path
                        const path = `
                          M 50 50
                          L ${x1} ${y1}
                          A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
                          Z
                        `;
                        
                        // Colors based on index
                        const colors = [
                          '#3b82f6', // blue
                          '#10b981', // green
                          '#f59e0b', // yellow
                          '#ef4444', // red
                          '#8b5cf6', // purple
                          '#ec4899', // pink
                          '#6366f1'  // indigo
                        ];
                        
                        return (
                          <path 
                            key={index}
                            d={path}
                            fill={colors[index % colors.length]}
                            stroke="#1f2937"
                            strokeWidth="1"
                          />
                        );
                      })}
                      
                      {/* Inner circle to create donut */}
                      <circle cx="50" cy="50" r="25" fill="#1f2937" />
                    </svg>
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-lg font-bold text-white">{documentTypes.length} Types</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No document type data available
                </div>
              )}
              
              {/* Legend */}
              {documentTypes.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {documentTypes.map((type, index) => {
                    const colors = [
                      '#3b82f6', // blue
                      '#10b981', // green
                      '#f59e0b', // yellow
                      '#ef4444', // red
                      '#8b5cf6', // purple
                      '#ec4899', // pink
                      '#6366f1'  // indigo
                    ];
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 mr-2"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-xs text-gray-300">{type.type} ({type.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ContentCard>
      )}
    </>
  );
};

export default PublicationStats;  