import React from 'react';
import { motion } from 'framer-motion';

/**
 * StatCard component for displaying statistics in a card format
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the statistic
 * @param {number|string} props.value - Value to display
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.iconColor - Color class for the icon
 * @param {boolean} props.isLoading - Loading state
 */
const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor = "text-blue-400",
  isLoading = false 
}) => {
  // Handle undefined, null, or NaN values
  const displayValue = () => {
    if (isLoading) {
      return (
        <div className="h-8 w-20 bg-gray-700 animate-pulse rounded"></div>
      );
    }
    
    if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
      return '0';
    }
    
    return value;
  };

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-5 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">{title}</h3>
          <p className="text-3xl font-bold text-white">{displayValue()}</p>
        </div>
        <div className={`p-3 bg-gray-700 rounded-full ${iconColor}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;