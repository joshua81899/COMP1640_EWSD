import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import FormComponent from '../../components/FormComponent';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import managerService from '../../services/managerService';
/**
 * ManagerSettings component for managing Marketing Manager settings
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const ManagerSettings = ({ addToContentRefs }) => {
  const [user, setUser] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    comment_notifications: true,
    selection_notifications: true,
    deadline_reminders: true
  });
  const [displaySettings, setDisplaySettings] = useState({
    dark_mode: true,
    compact_view: false,
    show_statistics: true,
    default_view: 'submissions'
  });
  const [exportSettings, setExportSettings] = useState({
    include_comments: true,
    include_metadata: true,
    default_format: 'zip'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch user and settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setFormError('');
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          setFormError('Authentication required. Please log in again.');
          setIsLoading(false);
          return;
        }

        // Fetch user profile
        const userResponse = await managerService.getCurrentUser(token);
        setUser(userResponse);
        
        // Fetch notification settings
        const notificationResponse = await managerService.getNotificationSettings(token);
        setNotificationSettings(notificationResponse);
        
        // Fetch display settings
        const displayResponse = await managerService.getDisplaySettings(token);
        setDisplaySettings(displayResponse);
        
        // Fetch export settings
        const exportResponse = await managerService.getExportSettings(token);
        setExportSettings(exportResponse);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching settings:', err);
        
        // Default fallback if API fails
        // Set user from localStorage
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser && storedUser.id) {
            setUser({
              id: storedUser.id,
              firstName: storedUser.firstName || '',
              lastName: storedUser.lastName || '',
              email: storedUser.email || '',
              facultyId: storedUser.facultyId || '',
              faculty: storedUser.faculty || ''
            });
          }
        } catch (userError) {
          console.error('Error parsing user from localStorage:', userError);
        }
        
        setFormError('Failed to load settings. Using default values.');
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormError('');
    setSuccessMessage('');
  };

  // Profile settings form fields
  const getProfileFields = () => [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter your first name',
      required: true,
      value: user?.firstName || ''
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter your last name',
      required: true,
      value: user?.lastName || ''
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
      required: true,
      value: user?.email || '',
      disabled: true,
      helpText: 'Email address cannot be changed'
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
      helpText: 'Leave blank to keep your current password'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm New Password',
      type: 'password',
      placeholder: 'Confirm new password',
      validate: (value, values) => {
        if (values.newPassword && value !== values.newPassword) {
          return 'Passwords do not match';
        }
        return null;
      }
    }
  ];

  // Notification settings form fields
  const getNotificationFields = () => [
    {
      name: 'emailNotifications',
      type: 'checkbox',
      checkboxLabel: 'Enable email notifications',
      checked: notificationSettings.email_notifications
    },
    {
      name: 'commentNotifications',
      type: 'checkbox',
      checkboxLabel: 'Notify when new comments are added to submissions',
      checked: notificationSettings.comment_notifications
    },
    {
      name: 'selectionNotifications',
      type: 'checkbox',
      checkboxLabel: 'Notify when submissions are selected by coordinators',
      checked: notificationSettings.selection_notifications
    },
    {
      name: 'deadlineReminders',
      type: 'checkbox',
      checkboxLabel: 'Receive deadline reminder notifications',
      checked: notificationSettings.deadline_reminders
    }
  ];

  // Display settings form fields
  const getDisplayFields = () => [
    {
      name: 'darkMode',
      type: 'checkbox',
      checkboxLabel: 'Use dark mode',
      checked: displaySettings.dark_mode
    },
    {
      name: 'compactView',
      type: 'checkbox',
      checkboxLabel: 'Use compact view for submissions',
      checked: displaySettings.compact_view
    },
    {
      name: 'showStatistics',
      type: 'checkbox',
      checkboxLabel: 'Show statistics on dashboard',
      checked: displaySettings.show_statistics
    },
    {
      name: 'defaultView',
      label: 'Default Dashboard View',
      type: 'select',
      options: [
        { value: 'overview', label: 'Overview' },
        { value: 'submissions', label: 'Selected Submissions' },
        { value: 'statistics', label: 'Statistics' }
      ],
      value: displaySettings.default_view
    }
  ];

  // Export settings form fields
  const getExportFields = () => [
    {
      name: 'includeComments',
      type: 'checkbox',
      checkboxLabel: 'Include comments when exporting submissions',
      checked: exportSettings.include_comments
    },
    {
      name: 'includeMetadata',
      type: 'checkbox',
      checkboxLabel: 'Include metadata (submission date, faculty, etc.)',
      checked: exportSettings.include_metadata
    },
    {
      name: 'defaultFormat',
      label: 'Default Export Format',
      type: 'select',
      options: [
        { value: 'zip', label: 'ZIP Archive' },
        { value: 'pdf', label: 'PDF Document' },
        { value: 'csv', label: 'CSV Spreadsheet' }
      ],
      value: exportSettings.default_format
    }
  ];

  // Handle profile form submission
  const handleProfileSubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Validate passwords match if new password is provided
      if (formValues.newPassword && formValues.newPassword !== formValues.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // Prepare data for API
      const userData = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword || undefined
      };
      
      // Update profile
      const response = await managerService.updateProfile(token, userData);
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        firstName: formValues.firstName,
        lastName: formValues.lastName
      }));
      
      // Update user in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        firstName: formValues.firstName,
        lastName: formValues.lastName
      }));
      
      setSuccessMessage('Profile updated successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setFormError(err.message || 'Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle notification settings form submission
  const handleNotificationSubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Prepare data for API
      const notificationData = {
        email_notifications: formValues.emailNotifications,
        comment_notifications: formValues.commentNotifications,
        selection_notifications: formValues.selectionNotifications,
        deadline_reminders: formValues.deadlineReminders
      };
      
      // Update notification settings
      await managerService.updateNotificationSettings(token, notificationData);
      
      // Update local state
      setNotificationSettings(notificationData);
      
      setSuccessMessage('Notification settings updated successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setFormError(err.message || 'Failed to update notification settings. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle display settings form submission
  const handleDisplaySubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Prepare data for API
      const displayData = {
        dark_mode: formValues.darkMode,
        compact_view: formValues.compactView,
        show_statistics: formValues.showStatistics,
        default_view: formValues.defaultView
      };
      
      // Update display settings
      await managerService.updateDisplaySettings(token, displayData);
      
      // Update local state
      setDisplaySettings(displayData);
      
      setSuccessMessage('Display settings updated successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating display settings:', err);
      setFormError(err.message || 'Failed to update display settings. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle export settings form submission
  const handleExportSubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Prepare data for API
      const exportData = {
        include_comments: formValues.includeComments,
        include_metadata: formValues.includeMetadata,
        default_format: formValues.defaultFormat
      };
      
      // Update export settings
      await managerService.updateExportSettings(token, exportData);
      
      // Update local state
      setExportSettings(exportData);
      
      setSuccessMessage('Export settings updated successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating export settings:', err);
      setFormError(err.message || 'Failed to update export settings. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return <LoadingSpinner label="Loading settings..." />;
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
        Settings
      </motion.h1>
      
      {/* Success Message */}
      {successMessage && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-green-700 border border-green-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccessMessage('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {formError && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-red-700 border border-red-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{formError}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setFormError('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Settings Tabs */}
      <div ref={addToContentRefs} className="mb-6">
        <div className="flex border-b border-gray-700 overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'profile'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('profile')}
          >
            Profile
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'notifications'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('notifications')}
          >
            Notifications
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'display'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('display')}
          >
            Display
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'export'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('export')}
          >
            Export
          </button>
        </div>
      </div>
      
      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <ContentCard ref={addToContentRefs}>
          <h3 className="text-xl font-bold text-white mb-4">Profile Information</h3>
          <p className="text-gray-400 mb-6">
            Update your personal information and change your password.
          </p>
          
          <FormComponent
            fields={getProfileFields()}
            onSubmit={handleProfileSubmit}
            submitText={isLoading ? "Saving..." : "Save Changes"}
            isSubmitting={isLoading}
            error=""
          />
        </ContentCard>
      )}
      
      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <ContentCard ref={addToContentRefs}>
          <h3 className="text-xl font-bold text-white mb-4">Notification Preferences</h3>
          <p className="text-gray-400 mb-6">
            Configure how you want to receive notifications about submissions and activities.
          </p>
          
          <FormComponent
            fields={getNotificationFields()}
            onSubmit={handleNotificationSubmit}
            submitText={isLoading ? "Saving..." : "Save Preferences"}
            isSubmitting={isLoading}
            error=""
          />
        </ContentCard>
      )}
      
      {/* Display Settings */}
      {activeTab === 'display' && (
        <ContentCard ref={addToContentRefs}>
          <h3 className="text-xl font-bold text-white mb-4">Display Settings</h3>
          <p className="text-gray-400 mb-6">
            Customize how the dashboard looks and behaves.
          </p>
          
          <FormComponent
            fields={getDisplayFields()}
            onSubmit={handleDisplaySubmit}
            submitText={isLoading ? "Saving..." : "Save Display Settings"}
            isSubmitting={isLoading}
            error=""
          />
        </ContentCard>
      )}
      
      {/* Export Settings */}
      {activeTab === 'export' && (
        <ContentCard ref={addToContentRefs}>
          <h3 className="text-xl font-bold text-white mb-4">Export Settings</h3>
          <p className="text-gray-400 mb-6">
            Configure how submissions are exported and downloaded.
          </p>
          
          <FormComponent
            fields={getExportFields()}
            onSubmit={handleExportSubmit}
            submitText={isLoading ? "Saving..." : "Save Export Settings"}
            isSubmitting={isLoading}
            error=""
          />
        </ContentCard>
      )}
    </>
  );
};

export default ManagerSettings;