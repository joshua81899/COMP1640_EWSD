import React from 'react';

/**
 * FormSelect component for dropdown selects
 * 
 * @param {Object} props
 * @param {string} props.id - Select ID attribute
 * @param {string} props.name - Select name attribute
 * @param {string} props.label - Select label text
 * @param {string} props.value - Select value
 * @param {Function} props.onChange - Select change handler
 * @param {Array} props.options - Array of option objects with value and label properties
 * @param {boolean} props.required - Whether the select is required
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.error - Error message text
 * @param {string} props.helpText - Help text to display below the select
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.selectClassName - Additional CSS classes for the select element
 */
const FormSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  icon,
  error,
  helpText,
  className = '',
  selectClassName = '',
  ...rest
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id || name} 
          className="block text-sm font-medium text-gray-300"
        >
          {label} {required && <span className="text-blue-500">*</span>}
        </label>
      )}
      
      {/* Select container with optional icon */}
      <div className={icon ? "relative" : ""}>
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {/* Select field */}
        <select
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-600'} 
            rounded-md bg-gray-700 text-white 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${selectClassName}
          `}
          {...rest}
        >
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Help text or error message */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-blue-400">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;