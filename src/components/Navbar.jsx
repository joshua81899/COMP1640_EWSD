import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Navbar component for the University Magazine portal
 * 
 * @param {Object} props
 * @param {Object} props.user - User object
 * @param {Date|string} props.lastLogin - Last login timestamp
 * @param {Array} props.notifications - Notifications array
 * @param {Function} props.onLogout - Logout handler function
 * @param {Function} props.onToggleSidebar - Function to toggle sidebar on mobile
 */
const Navbar = ({ 
  user, 
  lastLogin, 
  notifications = [], 
  onLogout, 
  onToggleSidebar 
}) => {
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="hidden md:flex ml-6 space-x-4">
              <Link to="/about" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">About</Link>
              <Link to="/submissions" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Submissions</Link>
              <Link to="/guidelines" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Guidelines</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Contact</Link>
            </div>
            
            {/* Mobile Toggle Button */}
            <div className="md:hidden ml-4">
              <button 
                onClick={onToggleSidebar}
                type="button" 
                className="text-gray-400 hover:text-white focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Last Login Info */}
          {lastLogin && (
            <div className="hidden md:block text-sm text-gray-400">
              Last login: {lastLogin.toLocaleString()}
            </div>
          )}
          
          {/* User Menu & Actions */}
          <div className="flex items-center">
            {/* Notifications icon */}
            <div className="relative mr-4">
              <button className="relative text-gray-400 hover:text-white focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification badge - use blue instead of red */}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500"></span>
                )}
              </button>
            </div>
            
            {/* User profile */}
            <div className="flex items-center">
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full border border-gray-600"
                  src={user.avatar}
                  alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.firstName ? user.firstName.charAt(0) : 'U'}
                </div>
              )}
              <span className="ml-2 text-sm font-medium text-white hidden md:block">
                {user?.firstName} {user?.lastName}
              </span>
              <button 
                onClick={onLogout}
                className="ml-3 text-sm text-gray-400 hover:text-white transition focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;