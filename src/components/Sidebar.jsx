import React from 'react';

/**
 * Sidebar component for the University Magazine portal
 * 
 * @param {Object} props
 * @param {Object} props.user - User object with profile information
 * @param {Array} props.navigationItems - Array of navigation items with label, icon, isActive, and onClick properties
 * @param {Array} props.importantDates - Array of important dates with title and date properties
 * @param {boolean} props.isOpen - Whether the sidebar is open (for mobile)
 * @param {Function} props.onClose - Function to close the sidebar (for mobile)
 */
const Sidebar = ({
  user,
  navigationItems = [],
  importantDates = [],
  isOpen,
  onClose
}) => {
  return (
    <div 
      className={`bg-gray-800 border-r border-gray-700 w-64 fixed md:static inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out z-40 md:z-auto flex-shrink-0 overflow-y-auto`}
    >
      {/* Close button - only visible on mobile */}
      <div className="md:hidden p-4 flex justify-end">
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label="Close sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          {user?.avatar ? (
            <img
              className="h-16 w-16 rounded-full border border-gray-600"
              src={user.avatar}
              alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium">
              {user?.firstName ? user.firstName.charAt(0) : 'U'}
            </div>
          )}
          <div className="ml-3">
            <p className="text-lg font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-400">{user?.faculty || user?.role}</p>
            {user?.email && <p className="text-xs text-blue-400">{user.email}</p>}
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="mt-8 px-2 space-y-2">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
              item.isActive 
                ? 'bg-blue-900 bg-opacity-30 text-white border-l-4 border-blue-500' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.icon && (
              <span className={`mr-3 h-5 w-5 ${item.isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        ))}
      </nav>
      
      {/* Important Dates Section */}
      {importantDates.length > 0 && (
        <div className="mt-8 px-4">
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            IMPORTANT DATES
          </h3>
          <div className="space-y-3">
            {importantDates.map((date, index) => (
              <div key={index} className="bg-gray-700 rounded-md p-3 text-sm">
                <p className="text-white font-medium">{date.title}:</p>
                <p className="text-yellow-400">{date.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;