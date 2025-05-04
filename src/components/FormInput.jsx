import React from 'react';

/**
 * FormInput component for consistent form inputs
 * 
 * @param {Object} props
 * @param {string} props.id - Input ID attribute
 * @param {string} props.name - Input name attribute
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.label - Input label text
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Input change handler
 * @param {boolean} props.required - Whether the input is required
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.error - Error message text
 * @param {string} props.helpText - Help text to display below the input
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.inputClassName - Additional CSS classes for the input element
 */
const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  icon,
  error,
  helpText,
  className = '',
  inputClassName = '',
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
      
      {/* Input container with optional icon */}
      <div className={icon ? "relative" : ""}>
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {/* Input field */}
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-600'} 
            rounded-md bg-gray-700 text-white placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${inputClassName}
          `}
          {...rest}
        />
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

export default FormInput;