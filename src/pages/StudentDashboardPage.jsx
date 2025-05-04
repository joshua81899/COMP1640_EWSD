import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import ContentCard from '../components/ContentCard';
import FormComponent from '../components/FormComponent';
import axios from 'axios';

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastLogin, setLastLogin] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  
  // Faculty mapping based on updated schema
  const facultyMapping = {
    'ARTS&HUM': 'Arts & Humanities',
    'BUS': 'Business',
    'COMPSCI': 'Computer Science',
    'EDU': 'Education',
    'ENG': 'Engineering',
    'HEALTHSCI': 'Health Sciences',
    'LAW': 'Law',
    'SCI': 'Science',
    'SOCSCI': 'Social Sciences'
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string if parsing fails
    }
  };
  
  // Load user data and important dates from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch faculties for reference
        try {
          const facultiesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/faculties`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setFaculties(facultiesResponse.data);
        } catch (error) {
          console.error('Error fetching faculties:', error);
        }

        // Fetch academic settings for important dates
        try {
          // Use the public endpoint instead of admin endpoint
          const academicSettingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/public/academic-settings`);
          
          // Transform academic settings to the format expected by the sidebar
          const dates = [];
          
          if (academicSettingsResponse.data.submission_deadline) {
            dates.push({
              title: 'Submission Deadline',
              date: formatDate(academicSettingsResponse.data.submission_deadline)
            });
          }
          
          if (academicSettingsResponse.data.final_edit_deadline) {
            dates.push({
              title: 'Final Edit Deadline',
              date: formatDate(academicSettingsResponse.data.final_edit_deadline)
            });
          }
          
          if (academicSettingsResponse.data.publication_date) {
            dates.push({
              title: 'Publication Date',
              date: formatDate(academicSettingsResponse.data.publication_date)
            });
          }
          
          // If no dates were retrieved, use fallback dates
          if (dates.length === 0) {
            dates.push(
              { title: 'Submission Deadline', date: 'May 25, 2025' },
              { title: 'Final Edit Deadline', date: 'June 23, 2025' }
            );
          }
          
          setImportantDates(dates);
        } catch (err) {
          console.error('Error fetching academic settings:', err);
          // Fallback to default dates if API call fails
          setImportantDates([
            { title: 'Submission Deadline', date: 'May 25, 2025' },
            { title: 'Final Edit Deadline', date: 'June 23, 2025' }
          ]);
        }

        // Fetch user details from the database
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Get user data from response
        const userData = userResponse.data;
        
        // Get faculty name based on faculty_id (now a string like "COMPSCI")
        let facultyName = "Student";
        if (userData.faculty_id) {
          // Try to get from the faculty mapping first
          facultyName = facultyMapping[userData.faculty_id] || userData.faculty_id;
          
          // If we have faculties from API, try to match there as well
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

        // If it's submissions tab, fetch submissions
        if (activeTab === 'submissions') {
          fetchSubmissions(token);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        
        // Fallback to localStorage if API fails
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser && storedUser.id) {
            // Get faculty name if possible
            let facultyName = "Student";
            if (storedUser.facultyId && facultyMapping[storedUser.facultyId]) {
              facultyName = facultyMapping[storedUser.facultyId];
            } else if (storedUser.faculty) {
              facultyName = storedUser.faculty;
            }
            
            setUser({
              id: storedUser.id,
              firstName: storedUser.firstName,
              lastName: storedUser.lastName,
              email: storedUser.email,
              facultyId: storedUser.facultyId,
              faculty: facultyName
            });
            
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            if (lastLoginTime) {
              setLastLogin(new Date(lastLoginTime));
            }
          } else {
            // If no valid user data, redirect to login
            navigate('/login');
            return;
          }
        } catch (localStorageError) {
          console.error('Error reading from localStorage:', localStorageError);
          navigate('/login');
          return;
        }
        
        // Set fallback important dates
        setImportantDates([
          { title: 'Submission Deadline', date: 'May 25, 2025' },
          { title: 'Final Edit Deadline', date: 'June 23, 2025' }
        ]);
        
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, activeTab, faculties.length]);

  // Function to refresh important dates
  const refreshImportantDates = async () => {
    try {
      // Use the public endpoint instead of admin endpoint
      const academicSettingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/public/academic-settings`);
      
      // Transform academic settings to the format expected by the sidebar
      const dates = [];
      
      if (academicSettingsResponse.data.submission_deadline) {
        dates.push({
          title: 'Submission Deadline',
          date: formatDate(academicSettingsResponse.data.submission_deadline)
        });
      }
      
      if (academicSettingsResponse.data.final_edit_deadline) {
        dates.push({
          title: 'Final Edit Deadline',
          date: formatDate(academicSettingsResponse.data.final_edit_deadline)
        });
      }
      
      if (academicSettingsResponse.data.publication_date) {
        dates.push({
          title: 'Publication Date',
          date: formatDate(academicSettingsResponse.data.publication_date)
        });
      }
      
      // Only update if dates were retrieved
      if (dates.length > 0) {
        setImportantDates(dates);
      }
    } catch (err) {
      console.error('Error refreshing important dates:', err);
      // No fallback needed here as we're just refreshing
    }
  };

  // Fetch user submissions
  const fetchSubmissions = async (token) => {
    try {
      if (!token) {
        token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token available');
        }
      }
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
  };

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
    
    // If switching to submissions tab, fetch submissions
    if (tabId === 'submissions' && user) {
      const token = localStorage.getItem('token');
      if (token) {
        fetchSubmissions(token);
      }
    }
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

  // Settings form fields
  const getSettingsFields = () => [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Your first name',
      value: user?.firstName || '',
      required: true
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Your last name',
      value: user?.lastName || '',
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Your email address',
      value: user?.email || '',
      disabled: true
    },
    {
      name: 'currentPassword',
      label: 'Current Password',
      type: 'password',
      placeholder: 'Enter your current password'
    },
    {
      name: 'newPassword',
      label: 'New Password',
      type: 'password',
      placeholder: 'Enter new password',
      helpText: 'Leave blank if you don\'t want to change password'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm New Password',
      type: 'password',
      placeholder: 'Confirm new password'
    },
    {
      name: 'notifications',
      type: 'checkbox',
      checkboxLabel: 'Receive email notifications about your submissions'
    }
  ];

  // FIXED: Handle submission form submit
  const handleSubmissionSubmit = async (formValues) => {
    try {
      // Reset state
      setIsLoading(true);
      setFormError('');
      
      // Validate the form data
      if (!formValues.title) {
        setFormError('Please enter a submission title');
        setIsLoading(false);
        return;
      }
      
      if (!formValues.file) {
        setFormError('Please select a file to upload');
        setIsLoading(false);
        return;
      }
      
      // Get the token synchronously
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('Your session has expired. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Create a vanilla XMLHttpRequest (avoids issues with Axios and fetch)
      const xhr = new XMLHttpRequest();
      
      // Set up progress and completion handlers
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          console.log(`Upload progress: ${percentComplete.toFixed(2)}%`);
        }
      };
      
      // Handle completion
      xhr.onload = function() {
        setIsLoading(false);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          console.log('File uploaded successfully');
          setSuccessMessage('Your submission has been successfully received!');
          setTimeout(() => {
            fetchSubmissions();
            handleTabChange('submissions');
          }, 2000);
        } else {
          // Error
          console.error('Upload failed', xhr.status, xhr.statusText);
          try {
            const response = JSON.parse(xhr.responseText);
            setFormError(response.error || `Upload failed: ${xhr.statusText}`);
          } catch (e) {
            setFormError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
          }
        }
      };
      
      // Handle network errors
      xhr.onerror = function() {
        console.error('Network error during upload');
        setFormError('Network error during upload. Please check your connection and try again.');
        setIsLoading(false);
      };
      
      // Open the request
      xhr.open('POST', `${process.env.REACT_APP_API_URL}/api/submissions`, true);
      
      // Set authorization header
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      // Create FormData
      const formData = new FormData();
      formData.append('title', formValues.title);
      formData.append('description', formValues.description || '');
      formData.append('academicYear', formValues.academicYear || '2024-2025');
      formData.append('termsAccepted', formValues.termsAccepted ? 'true' : 'false');
      formData.append('file', formValues.file);
      
      // Log what we're sending in development (debugging only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending the following data:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${key === 'file' ? value.name : value}`);
        }
      }
      
      // Send the request
      xhr.send(formData);
      
    } catch (error) {
      console.error('Submission error:', error);
      setFormError(error.message || 'An unexpected error occurred during submission');
      setIsLoading(false);
    }
  };

  // Handle settings form submit
  const handleSettingsSubmit = async (formValues) => {
    setIsLoading(true);
    setFormError('');
    
    try {
      // Validate passwords match if new password is provided
      if (formValues.newPassword && formValues.newPassword !== formValues.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Prepare data for API
      const userData = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword || undefined,
        notifications: formValues.notifications
      };
      
      // Send to API
      const response = await axios.patch(`${process.env.REACT_APP_API_URL}/api/users/settings`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update user state with new data
      setUser(prev => ({
        ...prev,
        firstName: formValues.firstName,
        lastName: formValues.lastName
      }));
      
      // Update user data in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        firstName: formValues.firstName,
        lastName: formValues.lastName
      }));
      
      setSuccessMessage('Your settings have been successfully updated!');
    } catch (error) {
      console.error('Settings update error:', error);
      setFormError(
        error.response?.data?.error ||
        error.message ||
        'An error occurred while updating settings'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sidebar navigation items
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
            This is your student dashboard for the University Magazine. From here, you can
            view and manage your submissions.
          </p>
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
      
      <ContentCard centered>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-4 w-full">
            {submissions.map((submission) => (
              <motion.div
                key={submission.submission_id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{submission.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{submission.description}</p>
                    <div className="mt-2 flex items-center text-xs text-gray-400">
                      <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>Status: 
                        <span className={submission.status === 'Submitted' ? 'text-yellow-400 ml-1' : 'text-red-400 ml-1'}>
                          {submission.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="View submission"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="Download file"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="py-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-gray-400 text-lg">No submissions yet.</p>
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
              />
            </div>
          </motion.div>
        )}
      </ContentCard>
    </>
  );

  // Settings Tab Content
  const renderSettingsContent = () => (
    <>
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Settings
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
            <h3 className="text-xl font-medium text-white mb-2">Settings Updated!</h3>
            <p className="text-gray-300 mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Back to Settings
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-300 mb-6 text-center">
              Update your personal information and account settings.
            </p>
            
            <div className="max-w-3xl mx-auto">
              <FormComponent
                fields={getSettingsFields()}
                initialValues={{
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  email: user?.email || '',
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                  notifications: true
                }}
                onSubmit={handleSettingsSubmit}
                submitText={isLoading ? "Saving..." : "Save Changes"}
                isSubmitting={isLoading}
                error={formError}
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
      user={{
        ...user,
        avatar: null // No avatar image, will show initials
      }}
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
          {activeTab === 'settings' && renderSettingsContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboardPage;