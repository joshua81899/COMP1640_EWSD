import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import FormComponent from '../../components/FormComponent';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * CoordinatorSettings component for managing faculty coordinator settings
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 * @param {Object} props.user - User object with profile information
 */
const CoordinatorSettings = ({ addToContentRefs, user }) => {
  const [profileSettings, setProfileSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    commentNotifications: true,
    submissionNotifications: true,
    reminderNotifications: true
  });
  const [displaySettings, setDisplaySettings] = useState({
    darkMode: true,
    compactView: false,
    showDeadlines: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Initialize settings with user data
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        
        if (user) {
          // Set profile data
          setProfileSettings(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          }));
        }
        
        // Mock API call to fetch notification settings
        setTimeout(() => {
          // In a real app, these would be fetched from an API
          setNotificationSettings({
            emailNotifications: true,
            commentNotifications: true,
            submissionNotifications: true,
            reminderNotifications: true
          });
          
          setDisplaySettings({
            darkMode: true,
            compactView: false,
            showDeadlines: true
          });
          
          setIsLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error loading settings:', err);
        setFormError('Failed to load settings. Please try again.');
        setIsLoading(false);
      }
    };
    
    initializeSettings();
  }, [user]);

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
      value: profileSettings.firstName
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter your last name',
      required: true,
      value: profileSettings.lastName
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
      required: true,
      value: profileSettings.email,
      disabled: true,
      helpText: 'Email address cannot be changed'
    },
    {
      name: 'currentPassword',
      label: 'Current Password',
      type: 'password',
      placeholder: 'Enter current password to confirm changes'
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
      checked: notificationSettings.emailNotifications
    },
    {
      name: 'commentNotifications',
      type: 'checkbox',
      checkboxLabel: 'Notify me when students comment on submissions',
      checked: notificationSettings.commentNotifications
    },
    {
      name: 'submissionNotifications',
      type: 'checkbox',
      checkboxLabel: 'Notify me when new submissions are added',
      checked: notificationSettings.submissionNotifications
    },
    {
      name: 'reminderNotifications',
      type: 'checkbox',
      checkboxLabel: 'Receive deadline reminder notifications',
      checked: notificationSettings.reminderNotifications
    }
  ];

  // Display settings form fields
  const getDisplayFields = () => [
    {
      name: 'darkMode',
      type: 'checkbox',
      checkboxLabel: 'Use dark mode',
      checked: displaySettings.darkMode
    },
    {
      name: 'compactView',
      type: 'checkbox',
      checkboxLabel: 'Use compact view for submissions list',
      checked: displaySettings.compactView
    },
    {
      name: 'showDeadlines',
      type: 'checkbox',
      checkboxLabel: 'Show deadline reminders on dashboard',
      checked: displaySettings.showDeadlines
    }
  ];

  // Handle profile form submission
  const handleProfileSubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Validate passwords match if new password is provided
      if (formValues.newPassword && formValues.newPassword !== formValues.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // In a real app, this would be an API call
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setProfileSettings(prev => ({
        ...prev,
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
      
      // In a real app, this would be an API call
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setNotificationSettings({
        emailNotifications: formValues.emailNotifications,
        commentNotifications: formValues.commentNotifications,
        submissionNotifications: formValues.submissionNotifications,
        reminderNotifications: formValues.reminderNotifications
      });
      
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
      
      // In a real app, this would be an API call
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setDisplaySettings({
        darkMode: formValues.darkMode,
        compactView: formValues.compactView,
        showDeadlines: formValues.showDeadlines
      });
      
      setSuccessMessage('Display settings updated successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating display settings:', err);
      setFormError(err.message || 'Failed to update display settings. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading && !profileSettings.firstName) {
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
        Coordinator Settings
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
    </>
  );
};

export default CoordinatorSettings;