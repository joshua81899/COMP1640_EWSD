import React from 'react';

/**
 * NotificationItem component for displaying a single notification
 * 
 * @param {Object} props
 * @param {string} props.text - Notification message text
 * @param {string|Date} props.date - Date of the notification
 * @param {boolean} props.read - Whether the notification has been read
 * @param {Function} props.onClick - Optional click handler
 */
const NotificationItem = ({
  text,
  date,
  read = false,
  onClick
}) => {
  // Format date if it's a Date object or ISO string
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    let formattedDate;
    if (dateValue instanceof Date) {
      formattedDate = dateValue;
    } else {
      try {
        formattedDate = new Date(dateValue);
      } catch (e) {
        return dateValue; // Return as is if we can't parse it
      }
    }
    
    return formattedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="p-3 hover:bg-gray-800 transition"
      onClick={onClick}
    >
      <div className="flex items-start">
        {/* Status indicator - blue dot for unread, gray for read */}
        <div 
          className={`flex-shrink-0 h-2 w-2 mt-1.5 rounded-full ${
            read ? 'bg-gray-600' : 'bg-blue-500'
          }`}
        ></div>
        
        {/* Notification content */}
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-300">{text}</p>
          {date && (
            <p className="text-xs text-gray-500 mt-1">{formatDate(date)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;