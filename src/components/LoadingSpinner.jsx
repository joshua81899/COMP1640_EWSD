import React from 'react';

/**
 * LoadingSpinner component for showing loading states
 * 
 * @param {Object} props
 * @param {string} props.size - Size of the spinner: 'sm', 'md', or 'lg'
 * @param {string} props.color - Color of the spinner (default: 'blue')
 * @param {string} props.label - Optional text to display below the spinner
 * @param {string} props.className - Additional CSS classes
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue',
  label,
  className = '' 
}) => {
  // Size-specific classes
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };
  
  // Color-specific classes
  const colorClasses = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };
  
  const spinnerClasses = `${sizeClasses[size]} ${colorClasses[color]} border-t-transparent rounded-full animate-spin ${className}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {label && (
        <p className="mt-3 text-white">{label}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;