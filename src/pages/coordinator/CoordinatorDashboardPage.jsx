// src/pages/coordinator/CoordinatorDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import CoordinatorOverview from './CoordinatorOverview';
import FacultySubmissions from './FacultySubmissions';
import SubmissionComments from './SubmissionComments';
import CoordinatorSettings from './CoordinatorSettings';
import coordinatorService from '../../services/coordinatorService';

/**
 * CoordinatorDashboardPage - Main container for faculty coordinator dashboard
 * Handles authentication, tab switching, and rendering appropriate content
 * 
 * @param {Object} props
 * @param {Function} props.onLogout - Function to handle logout
 * @param {string} props.initialTab - Initial tab to display
 */
const CoordinatorDashboardPage = ({ onLogout, initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [lastLogin, setLastLogin] = useState(null);
  const [error, setError] = useState('');
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Verify coordinator authentication and load user data
  useEffect(() => {
    const verifyCoordinator = async () => {
      try {
        setIsLoading(true);
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Verify coordinator permissions
        try {
          // Get current user information
          const response = await fetch('http://localhost:5001/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            throw new Error('Failed to authenticate');
          }
          
          const userData = await response.json();
          
          // Normalize role for consistent comparison
          const userRole = userData.role_id === 3 || 
                           userData.role_id === '3' || 
                           userData.role_id === 'COORD' ? 'COORD' : String(userData.role_id);
          
          // Check if user is a coordinator
          if (userRole !== 'COORD') {
            navigate('/dashboard'); // Redirect non-coordinators to regular dashboard
            return;
          }
          
          // Set user data
          setUser({
            id: userData.user_id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            faculty: userData.faculty_name || 'Faculty Coordinator',
            facultyId: userData.faculty_id,
            role: 'Faculty Coordinator'
          });
          
          // Get faculty information
          try {
            const facultyResponse = await coordinatorService.getFacultyInfo(token);
            setFacultyInfo(facultyResponse);
          } catch (facultyError) {
            console.error('Error fetching faculty info:', facultyError);
          }
          
          // Set last login time
          if (userData.last_login) {
            setLastLogin(new Date(userData.last_login));
          } else {
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            if (lastLoginTime) {
              setLastLogin(new Date(lastLoginTime));
            }
          }
          
        } catch (err) {
          console.error('Auth verification error:', err);
          
          // FALLBACK: If API fails, check localStorage for coordinator role
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const storedRole = storedUser.role || storedUser.role_id;
          
          // Normalize role from localStorage
          const userRole = storedRole === 3 || 
                           storedRole === '3' || 
                           storedRole === 'COORD' ? 'COORD' : String(storedRole);
          
          if (userRole === 'COORD') {
            setUser({
              id: storedUser.id,
              firstName: storedUser.firstName || 'Coordinator',
              lastName: storedUser.lastName || 'User',
              email: storedUser.email || '',
              faculty: storedUser.faculty || 'Faculty Coordinator',
              facultyId: storedUser.facultyId,
              role: 'Faculty Coordinator'
            });
            
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            if (lastLoginTime) {
              setLastLogin(new Date(lastLoginTime));
            }
          } else {
            navigate('/login');
            return;
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Coordinator dashboard initialization error:', err);
        setError('Failed to initialize dashboard. Please try again.');
        setIsLoading(false);
      }
    };
    
    verifyCoordinator();
  }, [navigate]);

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset selected submission when changing tabs
    if (tabId !== 'comments') {
      setSelectedSubmission(null);
    }
  };

  // Handle submission selection for comments
  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setActiveTab('comments');
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lastLoginTime');
    
    // Use window.location for a hard page refresh/redirect
    window.location.href = '/login';
  };

  // Define the tabs content with components
  const tabsContent = [
    {
      id: 'overview',
      title: 'Dashboard Overview',
      content: (addToContentRefs) => (
        <CoordinatorOverview
          addToContentRefs={addToContentRefs}
          facultyInfo={facultyInfo}
          onSelectSubmission={handleSelectSubmission}
        />
      )
    },
    {
      id: 'submissions',
      title: 'Faculty Submissions',
      content: (addToContentRefs) => (
        <FacultySubmissions
          addToContentRefs={addToContentRefs}
          facultyId={user?.facultyId}
          facultyName={facultyInfo?.faculty_name}
          onSelectSubmission={handleSelectSubmission}
        />
      )
    },
    {
      id: 'comments',
      title: 'Submission Comments',
      content: (addToContentRefs) => (
        <SubmissionComments
          addToContentRefs={addToContentRefs}
          submission={selectedSubmission}
          onBack={() => handleTabChange('submissions')}
        />
      )
    },
    {
      id: 'settings',
      title: 'Settings',
      content: (addToContentRefs) => (
        <CoordinatorSettings
          addToContentRefs={addToContentRefs}
          user={user}
          facultyInfo={facultyInfo}
        />
      )
    }
  ];

  // Define sidebar items
  const sidebarItems = [
    {
      label: 'Dashboard',
      isActive: activeTab === 'overview',
      onClick: () => handleTabChange('overview'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Submissions',
      isActive: activeTab === 'submissions',
      onClick: () => handleTabChange('submissions'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    // Only show Comments tab when a submission is selected
    ...(selectedSubmission ? [
      {
        label: 'Comments',
        isActive: activeTab === 'comments',
        onClick: () => handleTabChange('comments'),
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )
      }
    ] : []),
    {
      label: 'Settings',
      isActive: activeTab === 'settings',
      onClick: () => handleTabChange('settings'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  // Important dates for sidebar
  const importantDates = [
    {
      title: 'Submission Deadline',
      date: 'May 25, 2025'
    },
    {
      title: 'Final Edit Deadline',
      date: 'June 23, 2025'
    },
    {
      title: 'Publication Date',
      date: 'April 1, 2025'
    }
  ];

  // If there's an error and no user data, show error message
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading indicator to use instead of a full-page loading screen
  const loadingIndicator = isLoading ? (
    <div className="fixed top-20 right-5 bg-gray-800 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-sm text-white">Loading...</span>
      </div>
    </div>
  ) : null;

  return (
    <>
      {loadingIndicator}
      <DashboardLayout
        user={{
          ...user,
          avatar: null // No avatar image, will show initials
        }}
        lastLogin={lastLogin}
        activeTab={activeTab}
        sidebarItems={sidebarItems}
        importantDates={importantDates}
        onLogout={handleLogout}
        isLoading={false} // Pass false to avoid the full-page loading screen
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            className="w-full max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabsContent.find(tab => tab.id === activeTab)?.content((el) => el) || (
              <div className="text-center py-12">
                <p className="text-white text-lg">Tab content not found</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>
    </>
  );
};

export default CoordinatorDashboardPage;