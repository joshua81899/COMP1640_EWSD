import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImportantDateItem from './ImportantDateItem';

/**
 * Dashboard Layout component with dark theme
 */
const DashboardLayout = ({ 
  user,
  lastLogin, 
  children, 
  activeTab,
  sidebarItems, 
  importantDates = [],
  onLogout,
  isLoading = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading indicator for a non-intrusive loading experience
  const loadingIndicator = isLoading ? (
    <div className="fixed top-20 right-5 bg-gray-800 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-sm text-white">Loading...</span>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {loadingIndicator}
      
      {/* Top Navigation Bar - Fixed */}
      <motion.nav 
        className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation Links */}
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="ml-2 text-xl font-medium">University Magazine</span>
                </Link>
              </div>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex ml-16 space-x-10">
                <Link to="/about" className="text-gray-300 hover:text-white text-sm font-medium">About</Link>
                <Link to="/submissions" className="text-gray-300 hover:text-white text-sm font-medium">Submissions</Link>
                <Link to="/guidelines" className="text-gray-300 hover:text-white text-sm font-medium">Guidelines</Link>
                <Link to="/contact" className="text-gray-300 hover:text-white text-sm font-medium">Contact</Link>
                <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  Dashboard
                </Link>
              </div>
            </div>
            
            {/* Right side items: Notification, User, Logout */}
            <div className="flex items-center">
              {/* Notification Bell */}
              <motion.div 
                className="mr-5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </motion.div>
              
              {/* User Avatar/Initial */}
              <div className="mr-4">
                {user?.avatar ? (
                  <img
                    className="h-9 w-9 rounded-full"
                    src={user.avatar}
                    alt={`${user.firstName || ''} ${user.lastName || ''}`}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'T'}
                  </div>
                )}
              </div>
              
              {/* User Name & Logout */}
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <motion.button 
                  onClick={onLogout}
                  className="text-sm font-medium text-gray-300 hover:text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area with Fixed Sidebar */}
      <div className="flex pt-16 min-h-screen">
        {/* Sidebar - Fixed, scrollable internally with hidden scrollbar */}
        <motion.div 
          className="bg-gray-800 w-64 fixed top-16 bottom-0 left-0 overflow-y-auto scrollbar-hide z-40"
          style={{ 
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* User Profile Section */}
          <div className="p-6 flex flex-col items-center text-center">
            {user?.avatar ? (
              <img
                className="h-24 w-24 rounded-full mb-4"
                src={user.avatar}
                alt={`${user.firstName || ''} ${user.lastName || ''}`}
              />
            ) : (
              <motion.div 
                className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-medium mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'T'}
              </motion.div>
            )}
            <h2 className="text-xl font-medium">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-400 text-sm mb-1">{user?.email}</p>
            <p className="text-blue-400 text-sm">{user?.faculty || 'Student'}</p>
            
            {/* Last login moved from navbar to sidebar */}
            {lastLogin && (
              <p className="text-gray-400 text-xs mt-2">
                Last login: {lastLogin.toLocaleString()}
              </p>
            )}
          </div>
          
          {/* Navigation Menu */}
          <nav className="px-4 mt-6">
            {sidebarItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={item.onClick}
                className={`w-full text-left py-3 px-4 rounded mb-2 transition-colors ${
                  item.isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>
          
          {/* Important Dates Section */}
          {importantDates.length > 0 && (
            <div className="mt-8 px-4 pb-8">
              <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                IMPORTANT DATES
              </h3>
              <div className="space-y-3">
                {importantDates.map((date, index) => (
                  <ImportantDateItem 
                    key={index}
                    title={date.title} 
                    date={date.date}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Main scrollable content area - With left margin for sidebar and hidden scrollbar */}
        <div 
          className="ml-64 flex-1 overflow-auto scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              className="p-6 flex justify-center min-h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="dashboard-container w-full flex justify-center">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;