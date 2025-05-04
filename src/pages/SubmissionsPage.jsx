import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import ContentCard from '../components/ContentCard';
import FormComponent from '../components/FormComponent';
import SubmissionCard from '../components/SubmissionCard';
import axios from 'axios';

const SubmissionsPage = ({ isAuthenticated, currentUser }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(currentUser); // Use currentUser passed from ProtectedRoute
  const [activeTab, setActiveTab] = useState('overview');
  const [lastLogin, setLastLogin] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [token, setToken] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    academicYear: ''
  });
  
  // Load user data and submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch faculties for reference (public endpoint)
        try {
          const facultiesResponse = await axios.get('http://localhost:5001/api/faculties');
          setFaculties(facultiesResponse.data);
        } catch (error) {
          console.error('Error fetching faculties:', error);
        }

        // Get auth token
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        // If authenticated, get user details
        if (isAuthenticated) {
          // Get auth token
          if (storedToken) {
            try {
              // Fetch user details from the database
              const userResponse = await axios.get('http://localhost:5001/api/users/me', {
                headers: { 'Authorization': `Bearer ${storedToken}` }
              });
              
              // Get user data from response
              const userData = userResponse.data;
              
              // Get faculty name based on faculty_id
              let facultyName = "Student";
              if (userData.faculty_id) {
                // If we have faculties from API, try to match there
                if (faculties.length > 0) {
                  const faculty = faculties.find(f => f.faculty_id === userData.faculty_id);
                  if (faculty && faculty.faculty_name) {
                    facultyName = faculty.faculty_name;
                  }
                }
              }
              
              // Set user state with the data from database
              setUser({
                id: userData.user_id,
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                facultyId: userData.faculty_id,
                faculty: facultyName,
                role: userData.role_id
              });

              // Get last login time
              if (userData.last_login) {
                setLastLogin(new Date(userData.last_login));
              } else {
                // If no last login in database, use current time
                const lastLoginTime = localStorage.getItem('lastLoginTime');
                if (lastLoginTime) {
                  setLastLogin(new Date(lastLoginTime));
                }
              }
            } catch (userError) {
              console.error('Error fetching user data:', userError);
            }
          }
        }
        
        // Fetch submissions with the appropriate endpoint based on authentication
        if (isAuthenticated && storedToken) {
          // Prepare parameters for filtering
          const params = {
            ...(filters.status && { status: filters.status }),
            ...(filters.academicYear && { academicYear: filters.academicYear })
          };
          
          // Use authenticated endpoint
          const submissionsResponse = await axios.get('http://localhost:5001/api/submissions', {
            headers: { 'Authorization': `Bearer ${storedToken}` },
            params
          });
          
          setSubmissions(submissionsResponse.data);
        } else {
          // Not authenticated, redirect to login
          navigate('/login');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        
        // Set empty submissions but don't redirect to login
        setSubmissions([]);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, activeTab, isAuthenticated, currentUser, filters]);

  // FIXED LOGOUT - Completely synchronous, no async/await, uses window.location for hard redirect
  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lastLoginTime');
    
    // Use window.location for a hard page refresh/redirect
    window.location.href = '/login';
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFormError('');
    setSuccessMessage('');
    setSelectedSubmission(null);
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submission form fields
  const getSubmissionFields = () => [
    {
      name: 'title',
      label: 'Submission Title',
      type: 'text',
      placeholder: 'Enter your submission title',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Briefly describe your submission',
      rows: 4
    },
    {
      name: 'file',
      label: 'Upload File',
      type: 'file',
      accept: '.doc,.docx,.pdf,.jpg,.jpeg,.png',
      required: true,
      maxSize: '10MB',
      helpText: 'Upload a document or image file (max 10MB)'
    },
    {
      name: 'academicYear',
      label: 'Academic Year',
      type: 'select',
      options: [
        { value: '2024-2025', label: '2024-2025' },
        { value: '2025-2026', label: '2025-2026' }
      ],
      required: true
    },
    {
      name: 'termsAccepted',
      type: 'checkbox',
      checkboxLabel: 'I agree to the Terms and Conditions',
      required: true
    }
  ];

  // Handle submission form submit - this only applies to authenticated users
  const handleSubmissionSubmit = async (formValues) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setFormError('Please login to submit content');
      return;
    }
    
    setIsLoading(true);
    setFormError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Explicitly add each field with correct names
      formData.append('title', formValues.title);
      formData.append('description', formValues.description || '');
      
      // The file field must match exactly what multer is expecting
      if (formValues.file) {
        formData.append('file', formValues.file);
      } else {
        throw new Error('Please select a file to upload');
      }
      
      // Add academic year
      formData.append('academicYear', formValues.academicYear || '2024-2025');
      
      // Convert checkbox value to string 'true'/'false' for proper parsing on server
      formData.append('termsAccepted', formValues.termsAccepted ? 'true' : 'false');
      
      // Add debugging to see what's being sent
      console.log('Sending form data with fields:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'file' ? 'FILE DATA' : pair[1]));
      }
      
      // Send to API
      const response = await axios.post('http://localhost:5001/api/submissions', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type here - axios will set it correctly with boundary for multipart/form-data
        }
      });
      
      setSuccessMessage('Your submission has been successfully received!');
      setTimeout(() => {
        handleTabChange('submissions');
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      setFormError(
        error.response?.data?.error ||
        error.message ||
        'An error occurred while submitting your work'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a submission from the list
  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  // Sidebar navigation items - for authenticated users
  const sidebarItems = [
    {
      id: 'overview',
      label: 'Overview',
      isActive: activeTab === 'overview',
      onClick: () => handleTabChange('overview'),
    },
    {
      id: 'submissions',
      label: 'My Submissions',
      isActive: activeTab === 'submissions',
      onClick: () => handleTabChange('submissions'),
    },
    {
      id: 'new-submission',
      label: 'New Submission',
      isActive: activeTab === 'new-submission',
      onClick: () => handleTabChange('new-submission'),
    },
    {
      id: 'settings',
      label: 'Settings',
      isActive: activeTab === 'settings',
      onClick: () => handleTabChange('settings'),
    }
  ];

  // Important dates
  const importantDates = [
    {
      title: 'Submission Deadline',
      date: 'May 25, 2025'
    },
    {
      title: 'Final Edit Deadline',
      date: 'June 23, 2025'
    }
  ];

  // Overview Tab Content
  const renderOverviewContent = () => (
    <>
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Dashboard Overview
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Welcome Message */}
        <ContentCard title={`Welcome, ${user?.firstName || 'Student'}!`}>
          <p className="text-gray-300 text-center">
            This is your dashboard for the University Magazine. From here, you can view and manage your submissions.
          </p>
          
          {lastLogin && (
            <div className="mt-4 p-3 bg-gray-700 rounded text-sm text-center">
              <p className="text-gray-300">
                Last login: {lastLogin.toLocaleString()}
              </p>
            </div>
          )}
        </ContentCard>

        {/* Important Dates */}
        <ContentCard title="Important Dates" delay={0.1}>
          <div className="space-y-4 w-full max-w-md mx-auto">
            {importantDates.map((date, index) => (
              <motion.div 
                key={index} 
                className="flex justify-between items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
              >
                <span>{date.title}:</span>
                <span className="text-yellow-400">{date.date}</span>
              </motion.div>
            ))}
          </div>
        </ContentCard>
      </div>
      
      {/* Recent Submissions */}
      {submissions.length > 0 && (
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ContentCard title="Your Recent Submissions">
            <div className="space-y-4">
              {submissions.slice(0, 2).map((submission) => (
                <div 
                  key={submission.submission_id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => handleSelectSubmission(submission)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{submission.title}</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {submission.description 
                          ? (submission.description.length > 100 
                              ? submission.description.substring(0, 100) + '...' 
                              : submission.description)
                          : 'No description provided.'}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>Status: 
                          <span className={
                            submission.status === 'Selected' 
                              ? 'text-green-400 ml-1' 
                              : submission.status === 'Rejected'
                                ? 'text-red-400 ml-1'
                                : 'text-yellow-400 ml-1'
                          }>
                            {submission.status}
                          </span>
                        </span>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => handleTabChange('submissions')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View all submissions
              </button>
            </div>
          </ContentCard>
        </motion.div>
      )}
    </>
  );

  // My Submissions Tab Content
  const renderSubmissionsContent = () => (
    <>
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        My Submissions
      </motion.h1>
      
      {/* Filters */}
      <div className="mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>
      
      <ContentCard>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.submission_id}
                submission={submission}
                isAuthenticated={true}
                token={token}
                onSelectSubmission={handleSelectSubmission}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            className="py-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-gray-400 text-lg text-center">You haven't submitted any content yet.</p>
            <div className="mt-6 text-center">
              <button
                onClick={() => handleTabChange('new-submission')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Create New Submission
              </button>
            </div>
          </motion.div>
        )}
      </ContentCard>
    </>
  );

  // New Submission Tab Content
  const renderNewSubmissionContent = () => (
    <>
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        New Submission
      </motion.h1>
      
      <ContentCard>
        {successMessage ? (
          <motion.div 
            className="py-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Submission Successful!</h3>
            <p className="text-gray-300 mb-6">{successMessage}</p>
            <button
              onClick={() => handleTabChange('submissions')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              View My Submissions
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-300 mb-6 text-center">
              Submit your article or image for consideration in the university magazine.
              All submissions will be reviewed by your Faculty's Marketing Coordinator.
            </p>
            
            <div className="max-w-3xl mx-auto">
              <FormComponent
                fields={getSubmissionFields()}
                initialValues={{
                  title: '',
                  description: '',
                  academicYear: '2024-2025',
                  termsAccepted: false
                }}
                onSubmit={handleSubmissionSubmit}
                submitText={isLoading ? "Submitting..." : "Submit"}
                isSubmitting={isLoading}
                error={formError}
                requiresAuth={true} // Explicitly require auth for submissions
              />
            </div>
          </motion.div>
        )}
      </ContentCard>
    </>
  );

  // Return the dashboard layout with the appropriate content based on active tab
  return (
    <DashboardLayout
      user={user}
      lastLogin={lastLogin}
      sidebarItems={sidebarItems}
      importantDates={importantDates}
      onLogout={handleLogout}
      isLoading={isLoading}
      activeTab={activeTab}
    >
      <div className="flex flex-col items-center w-full pb-6">
        <div className="w-full max-w-4xl">
          {activeTab === 'overview' && renderOverviewContent()}
          {activeTab === 'submissions' && renderSubmissionsContent()}
          {activeTab === 'new-submission' && renderNewSubmissionContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubmissionsPage;