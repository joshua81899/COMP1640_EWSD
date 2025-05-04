import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import SubmissionsManagement from './SubmissionsManagement';
import FacultyManagement from './FacultyManagement';
import AnalyticsView from './AnalyticsView';
import SystemSettings from './SystemSettings';
import { adminService } from '../../services/adminService';

/**
 * AdminDashboardPage - Main container for admin dashboard
 * Handles authentication, tab switching, and rendering appropriate content
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastLogin, setLastLogin] = useState(null);
  const [error, setError] = useState('');
  const [importantDates, setImportantDates] = useState([]);
  
  // Verify admin authentication and load user data
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        setIsLoading(true);
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Verify admin permissions
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
          
          // Check if user is an admin (could be role_id 1 or 'ADMIN')
          if (userData.role_id !== 1 && userData.role_id !== 'ADMIN') {
            navigate('/dashboard'); // Redirect non-admins to regular dashboard
            return;
          }
          
          // Set user data
          setUser({
            id: userData.user_id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            faculty: userData.faculty_name || 'Administrator',
            role: 'Administrator'
          });
          
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
          
          // FALLBACK: If API fails, check localStorage for admin role
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser && (storedUser.role === 1 || storedUser.role === 'ADMIN')) {
            setUser({
              id: storedUser.id,
              firstName: storedUser.firstName || 'Admin',
              lastName: storedUser.lastName || 'User',
              email: storedUser.email || '',
              faculty: 'Administrator',
              role: 'Administrator'
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

        // Fetch important dates from the API
        try {
          const academicSettings = await adminService.getAcademicSettings(token);
          
          // Transform academic settings to the format expected by the sidebar
          const dates = [];
          
          if (academicSettings.submission_deadline) {
            dates.push({
              title: 'Submission Deadline',
              date: formatDate(academicSettings.submission_deadline)
            });
          }
          
          if (academicSettings.final_edit_deadline) {
            dates.push({
              title: 'Final Edit Deadline',
              date: formatDate(academicSettings.final_edit_deadline)
            });
          }
          
          // You can add more dates if your academic settings include them
          // For example, if you have a publication_date field:
          if (academicSettings.publication_date) {
            dates.push({
              title: 'Publication Date',
              date: formatDate(academicSettings.publication_date)
            });
          }
          
          // If no dates were retrieved, use fallback dates
          if (dates.length === 0) {
            dates.push(
              { title: 'Submission Deadline', date: 'May 25, 2025' },
              { title: 'Final Edit Deadline', date: 'June 23, 2025' },
              { title: 'Publication Date', date: 'April 1, 2025' }
            );
          }
          
          setImportantDates(dates);
        } catch (err) {
          console.error('Error fetching academic settings:', err);
          // Fallback to default dates if API call fails
          setImportantDates([
            { title: 'Submission Deadline', date: 'May 25, 2025' },
            { title: 'Final Edit Deadline', date: 'June 23, 2025' },
            { title: 'Publication Date', date: 'April 1, 2025' }
          ]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Admin dashboard initialization error:', err);
        setError('Failed to initialize dashboard. Please try again.');
        setIsLoading(false);
      }
    };
    
    verifyAdmin();
  }, [navigate]);

  // Helper function to format dates
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

  // Function to refresh important dates (can be called after settings update)
  const refreshImportantDates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const academicSettings = await adminService.getAcademicSettings(token);
      
      // Transform academic settings to the format expected by the sidebar
      const dates = [];
      
      if (academicSettings.submission_deadline) {
        dates.push({
          title: 'Submission Deadline',
          date: formatDate(academicSettings.submission_deadline)
        });
      }
      
      if (academicSettings.final_edit_deadline) {
        dates.push({
          title: 'Final Edit Deadline',
          date: formatDate(academicSettings.final_edit_deadline)
        });
      }
      
      if (academicSettings.publication_date) {
        dates.push({
          title: 'Publication Date',
          date: formatDate(academicSettings.publication_date)
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

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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
      content: (addToContentRefs) => <AdminOverview addToContentRefs={addToContentRefs} />
    },
    {
      id: 'users',
      title: 'User Management',
      content: (addToContentRefs) => <UserManagement addToContentRefs={addToContentRefs} />
    },
    {
      id: 'submissions',
      title: 'Submissions Management',
      content: (addToContentRefs) => <SubmissionsManagement addToContentRefs={addToContentRefs} />
    },
    {
      id: 'faculties',
      title: 'Faculty Management',
      content: (addToContentRefs) => <FacultyManagement addToContentRefs={addToContentRefs} />
    },
    {
      id: 'analytics',
      title: 'Analytics',
      content: (addToContentRefs) => <AnalyticsView addToContentRefs={addToContentRefs} />
    },
    {
      id: 'settings',
      title: 'System Settings',
      content: (addToContentRefs) => (
        <SystemSettings 
          addToContentRefs={addToContentRefs} 
          onSettingsUpdate={refreshImportantDates} 
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
      label: 'Users',
      isActive: activeTab === 'users',
      onClick: () => handleTabChange('users'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
    {
      label: 'Faculties',
      isActive: activeTab === 'faculties',
      onClick: () => handleTabChange('faculties'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      label: 'Analytics',
      isActive: activeTab === 'analytics',
      onClick: () => handleTabChange('analytics'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
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

export default AdminDashboardPage;