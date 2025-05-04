import React from 'react';

/**
 * Button component with consistent styling
 * 
 * @param {Object} props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', or 'outline'
 * @param {string} props.size - Button size: 'sm', 'md', or 'lg'
 * @param {boolean} props.fullWidth - Whether the button should take up full width
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.iconPosition - Icon position: 'left' or 'right'
 * @param {boolean} props.isLoading - Whether to show a loading spinner
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) => {
  // Base classes for all buttons
  const baseClasses = "inline-flex items-center justify-center font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  
  // Variant-specific classes
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white",
    outline: "border border-gray-600 hover:bg-gray-700 text-white"
  };
  
  // Size-specific classes
  const sizeClasses = {
    sm: "text-xs py-1 px-2 rounded",
    md: "text-sm py-2 px-4 rounded-md",
    lg: "text-base py-3 px-6 rounded-md"
  };
  
  // Width class
  const widthClass = fullWidth ? "w-full" : "";
  
  // Disabled class
  const disabledClass = disabled || isLoading ? "opacity-70 cursor-not-allowed" : "";
  
  // Build the final className
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`;

  // Loading spinner
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button 
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <LoadingSpinner />}
      
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;