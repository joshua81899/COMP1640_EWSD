import React from 'react';

/**
 * FormCheckbox component for checkboxes
 * 
 * @param {Object} props
 * @param {string} props.id - Checkbox ID attribute
 * @param {string} props.name - Checkbox name attribute
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {Function} props.onChange - Checkbox change handler
 * @param {React.ReactNode} props.label - Checkbox label content
 * @param {boolean} props.required - Whether the checkbox is required
 * @param {boolean} props.disabled - Whether the checkbox is disabled
 * @param {string} props.error - Error message text
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.checkboxClassName - Additional CSS classes for the checkbox element
 */
const FormCheckbox = ({
  id,
  name,
  checked,
  onChange,
  label,
  required = false,
  disabled = false,
  error,
  className = '',
  checkboxClassName = '',
  ...rest
}) => {
  return (
    <div className={`${className}`}>
      <div className="flex items-center">
        <input
          id={id || name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700
            ${error ? 'border-red-500' : ''}
            ${checkboxClassName}
          `}
          {...rest}
        />
        {label && (
          <label htmlFor={id || name} className="ml-2 block text-sm text-gray-300">
            {label} {required && <span className="text-blue-500">*</span>}
          </label>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormCheckbox;