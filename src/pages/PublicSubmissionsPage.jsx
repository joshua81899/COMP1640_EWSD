import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import SubmissionCard from '../components/SubmissionCard';

/**
 * PublicSubmissionsPage - A dedicated page for viewing submissions
 * Both authenticated users and guests can access this page
 */
const PublicSubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    faculty: '',
    academicYear: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Check authentication status and load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is logged in
        const storedToken = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        // Set authentication state
        setIsAuthenticated(isLoggedIn && !!storedToken);
        setToken(storedToken);
        
        // Parse user data if available
        if (userString && isLoggedIn) {
          try {
            const userData = JSON.parse(userString);
            setUser(userData);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        // Fetch faculties for filter
        try {
          const facultiesResponse = await axios.get('http://localhost:5001/api/faculties');
          setFaculties(facultiesResponse.data);
        } catch (error) {
          console.error('Error fetching faculties:', error);
          setFaculties([]);
        }
        
        // Prepare query parameters
        const params = {
          ...(filters.faculty && { faculty: filters.faculty }),
          ...(filters.academicYear && { academicYear: filters.academicYear }),
          ...(searchQuery && { search: searchQuery })
        };
        
        // Always use the public endpoint for submissions to ensure it works for everyone
        const submissionsResponse = await axios.get('http://localhost:5001/api/public/submissions', { params });
        setSubmissions(submissionsResponse.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading submissions:', error);
        setError('Failed to load submissions. Please try again.');
        setSubmissions([]);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [filters, searchQuery]);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Home Link */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="ml-2 text-xl font-medium">University Magazine</span>
              </Link>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white text-sm">Home</Link>
              <Link to="/about" className="text-gray-300 hover:text-white text-sm">About</Link>
              <Link to="/submissions" className="text-blue-400 hover:text-blue-300 text-sm">Submissions</Link>
              <Link to="/guidelines" className="text-gray-300 hover:text-white text-sm">Guidelines</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white text-sm">Contact</Link>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      // Clear auth data
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      localStorage.removeItem('isLoggedIn');
                      localStorage.removeItem('lastLoginTime');
                      // Refresh page
                      window.location.reload();
                    }}
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-300 hover:text-white text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold text-white">University Magazine Submissions</h1>
          <p className="mt-3 text-xl text-gray-400 max-w-2xl mx-auto">
            Browse selected contributions from students across the university.
          </p>
          
          {/* Auth status message */}
          {!isAuthenticated && (
            <div className="mt-4 text-blue-400">
              <Link to="/login" className="underline hover:text-blue-300">Sign in</Link> to contribute your own work to the magazine!
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mb-8 bg-gray-800 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
        </motion.div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Submissions Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Submissions grid */}
            {submissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((submission, index) => (
                  <motion.div
                    key={submission.submission_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * (index % 6) }}
                  >
                    <SubmissionCard
                      submission={submission}
                      isAuthenticated={isAuthenticated}
                      token={token}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center shadow-md">
                <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">No submissions found</h3>
                <p className="text-gray-400 mb-6">
                  Try changing your filter settings or check back later for new submissions.
                </p>
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* CTA Section for guests */}
      {!isAuthenticated && submissions.length > 0 && (
        <div className="bg-gray-800 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Want to contribute to the magazine?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join our community of student writers and artists. Submit your own work for consideration in the next issue.
            </p>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition mr-4"
            >
              Register Now
            </Link>
            <Link
              to="/login"
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-md transition"
            >
              Login
            </Link>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-800 py-6 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="ml-2 text-lg font-medium text-white">University Magazine</span>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/terms" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col md:flex-row justify-between text-sm">
            <p className="text-gray-400 text-center md:text-left">
              &copy; {new Date().getFullYear()} University Magazine. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicSubmissionsPage;