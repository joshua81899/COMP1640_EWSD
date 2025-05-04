import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Form Component
 * 
 * This component creates a flexible, reusable form that can handle:
 * - Different types of input fields (text, email, password, checkbox, textarea, select, file)
 * - Form validation
 * - Error messages
 * - Loading states
 * - Custom styling
 */
const FormComponent = ({
  title,
  fields,
  initialValues = {},
  onSubmit,
  submitText = "Submit",
  isSubmitting = false,
  error = "",
  footer = null,
  className = "",
  fieldClassName = "",
  inputClassName = "",
  buttonClassName = "",
  getInputFocusStyles = null,
  requiresAuth = true // New prop to determine if form needs authentication
}) => {
  // State to track form values - initialized with any provided initial values
  const [formValues, setFormValues] = useState(initialValues);
  
  // State to track field-specific errors
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Reference to the form element
  const formRef = useRef(null);
  
  // State to track file input names and their display values
  const [fileDisplays, setFileDisplays] = useState({});

  // Effect to update form values when fields values change (for editing)
  useEffect(() => {
    // Create a new form values object based on field values
    const newFormValues = { ...formValues };
    let hasChanges = false;

    // Check each field for value changes
    fields.forEach(field => {
      // Skip if field doesn't have a value property
      if (!('value' in field)) return;
      
      const fieldName = field.name;
      const fieldValue = field.value;
      
      // If the value in the field is different from what's in formValues
      // and the field value is not undefined or empty string, update it
      if (formValues[fieldName] !== fieldValue && fieldValue !== undefined) {
        newFormValues[fieldName] = fieldValue;
        hasChanges = true;
      }
    });

    // Only update state if there were actual changes
    if (hasChanges) {
      console.log('Updating form values from fields:', newFormValues);
      setFormValues(newFormValues);
    }
  }, [fields]); // Re-run whenever fields prop changes

  /**
   * Handle input changes for all field types
   * Updates the form values state and clears any existing errors for the changed field
   */
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Special handling based on input type
    if (type === 'file' && files && files.length > 0) {
      // For file inputs, store the actual File object
      const file = files[0];
      
      // Validate file size before accepting
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFieldErrors(prevErrors => ({
          ...prevErrors,
          [name]: 'File size exceeds the 10MB limit'
        }));
        return;
      }
      
      setFormValues(prevValues => ({
        ...prevValues,
        [name]: file
      }));
      // Store the file name for display
      setFileDisplays(prev => ({
        ...prev,
        [name]: file.name
      }));
      
      // Clear any previous errors for this field
      if (fieldErrors[name]) {
        setFieldErrors(prevErrors => ({
          ...prevErrors,
          [name]: ''
        }));
      }
    } else if (type === 'checkbox') {
      // For checkboxes, store boolean checked value
      setFormValues(prevValues => ({
        ...prevValues,
        [name]: checked
      }));
    } else {
      // For all other inputs, store the string value
      setFormValues(prevValues => ({
        ...prevValues,
        [name]: value
      }));
    }
    
    // Clear the error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  /**
   * Validate the form before submission
   * Runs through all fields and checks for required fields, email format, etc.
   * Returns an object with fieldName: errorMessage pairs
   */
  const validateForm = () => {
    const errors = {};
    
    // Check each field for validation rules
    fields.forEach(field => {
      // Required field validation
      if (field.required && !formValues[field.name]) {
        errors[field.name] = `${field.label || field.name} is required`;
      }
      
      // Email validation using regex
      if (field.type === 'email' && formValues[field.name] && 
          !formValues[field.name].match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors[field.name] = 'Please enter a valid email address';
      }
      
      // Password length validation
      if (field.type === 'password' && field.minLength && 
          formValues[field.name] && formValues[field.name].length < field.minLength) {
        errors[field.name] = `Password must be at least ${field.minLength} characters`;
      }
      
      // File type validation
      if (field.type === 'file' && field.accept && formValues[field.name]) {
        const file = formValues[field.name];
        const acceptedTypes = field.accept.split(',').map(type => type.trim());
        
        // Check if the file extension matches any of the accepted types
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const mimeType = file.type;
        
        const isExtensionAccepted = acceptedTypes.some(type => {
          // Extension check (e.g., .jpg)
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          // MIME type check (e.g., image/jpeg)
          else if (!type.includes('*')) {
            return mimeType === type;
          }
          // Wildcard check (e.g., image/*)
          else if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return mimeType.startsWith(category + '/');
          }
          return false;
        });
        
        if (!isExtensionAccepted) {
          errors[field.name] = `Please select a file of type: ${field.accept}`;
        }
      }
      
      // File size validation
      if (field.type === 'file' && field.maxSize && formValues[field.name]) {
        const file = formValues[field.name];
        const maxSizeBytes = parseFileSize(field.maxSize);
        
        if (file.size > maxSizeBytes) {
          errors[field.name] = `File size should not exceed ${field.maxSize}`;
        }
      }
      
      // Run any custom validation function provided with the field
      if (field.validate && formValues[field.name]) {
        const customError = field.validate(formValues[field.name], formValues);
        if (customError) {
          errors[field.name] = customError;
        }
      }
    });
    
    return errors;
  };

  /**
   * Parse file size string to bytes
   * e.g. "10MB" to 10485760 bytes
   */
  const parseFileSize = (sizeStr) => {
    const units = {
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };
    
    const matches = sizeStr.match(/^(\d+)(\w+)$/);
    if (!matches) return parseInt(sizeStr, 10);
    
    const [, size, unit] = matches;
    return parseInt(size, 10) * (units[unit.toUpperCase()] || 1);
  };

  /**
   * Handle form submission
   * Validates the form first, then calls the onSubmit callback if valid
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // FIXED: Check for authentication only if requiresAuth is true AND 
    // we're not on a registration page
    const isRegisterPage = window.location.pathname.includes("register");
    if (requiresAuth === true && !isRegisterPage) {
      const token = localStorage.getItem('token');
      if (!token) {
        // If the token is missing and authentication is required, display an error
        setFieldErrors({
          ...fieldErrors,
          form: 'Authentication required. Please log in again.'
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        return;
      }
    }
    
    // Validate form
    const errors = validateForm();
    
    // If there are errors, display them and don't submit
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }
    
    // Prepare form data for submission
    const processedValues = { ...formValues };
    
    // Call the provided onSubmit function
    try {
      onSubmit(processedValues);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle specific error types
      if (error.response?.status === 403 || error.response?.status === 401) {
        setFieldErrors({
          ...fieldErrors,
          form: 'Your session has expired. Please log in again.'
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setFieldErrors({
          ...fieldErrors,
          form: error.message || 'An error occurred during submission'
        });
      }
    }
  };

  /**
   * Reset the form to initial values
   */
  const resetForm = () => {
    setFormValues(initialValues);
    setFieldErrors({});
    setFileDisplays({});
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  /**
   * Generate default styles for input focus state if not provided
   * Creates a glowing effect around focused inputs
   */
  const defaultInputFocusStyles = (color = '#3b82f6', intensity = 0.8) => {
    return {
      boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, ${intensity})`,
      borderColor: color
    };
  };

  // Use custom focus styles if provided, otherwise use default
  const focusStyles = getInputFocusStyles || defaultInputFocusStyles;

  /**
   * Render file input field with preview and controls
   */
  const renderFileInput = (field) => {
    const fieldId = field.id || field.name;
    const fileName = fileDisplays[field.name] || '';
    const hasFile = !!fileName;
    
    return (
      <div className="file-input-container">
        <div className={`relative flex items-center w-full ${hasFile ? 'bg-gray-700' : 'bg-gray-700'} border ${fieldErrors[field.name] ? 'border-red-500' : 'border-gray-600'} rounded-md overflow-hidden group transition-all duration-300`}>
          {/* Hidden native file input */}
          <input
            id={fieldId}
            name={field.name}
            type="file"
            onChange={handleChange}
            accept={field.accept || ''}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={field.disabled || isSubmitting}
            required={field.required}
          />
          
          {/* Custom file input display */}
          <div className="flex-1 p-2 truncate text-sm text-gray-300 pl-4">
            {fileName || 'Choose a file...'}
          </div>
          
          {/* Browse button */}
          <div className="flex-shrink-0 bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500 transition-colors duration-300">
            Browse
          </div>
          
          {/* Clear button (only show if a file is selected) */}
          {hasFile && (
            <button
              type="button"
              className="absolute right-0 top-0 bottom-0 px-2 bg-red-700 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setFormValues(prev => ({
                  ...prev,
                  [field.name]: undefined
                }));
                setFileDisplays(prev => ({
                  ...prev,
                  [field.name]: ''
                }));
                // Also reset the file input
                if (formRef.current) {
                  const fileInput = formRef.current.querySelector(`input[name="${field.name}"]`);
                  if (fileInput) {
                    fileInput.value = '';
                  }
                }
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* File size info */}
        {field.maxSize && (
          <p className="mt-1 text-xs text-gray-400">Maximum file size: {field.maxSize}</p>
        )}
      </div>
    );
  };

  // FIXED: Check if we're on a register page
  const isAuthenticated = !!localStorage.getItem('token');
  const isRegisterPage = window.location.pathname.includes("register");
  
  // FIXED: Don't show warning if we're on the register page or if requiresAuth is false
  const showAuthWarning = requiresAuth === true && !isAuthenticated && !isRegisterPage;

  // Main component render
  return (
    <div className={`bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 ${className}`}>
      {/* Conditional form title */}
      {title && (
        <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
      )}
      
      {/* FIXED: Authentication warning - only shown if form requires authentication AND not on register page */}
      {showAuthWarning && (
        <div className="mb-4 bg-yellow-900/50 border border-yellow-500 text-yellow-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">You are not logged in. Please log in to submit this form.</span>
        </div>
      )}
      
      {/* Form-wide error message */}
      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Field-level form error message */}
      {fieldErrors.form && (
        <div className="mb-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{fieldErrors.form}</span>
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        {/* Map through and render each field */}
        {fields.map((field) => (
          <div key={field.name} className={`space-y-1 ${fieldClassName}`}>
            {/* Field label */}
            {field.label && field.type !== 'checkbox' && (
              <label 
                htmlFor={field.id || field.name} 
                className="block text-sm font-medium text-gray-300"
              >
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
            )}
            
            {/* Field input container */}
            <div className={field.icon ? "relative" : ""}>
              {/* Icon for field (if provided) */}
              {field.icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {field.icon}
                </div>
              )}
              
              {/* Render different input types based on field.type */}
              {field.type === 'textarea' ? (
                <textarea
                  id={field.id || field.name}
                  name={field.name}
                  value={formValues[field.name] || ''}
                  onChange={handleChange}
                  rows={field.rows || 4}
                  placeholder={field.placeholder || ''}
                  className={`${inputClassName || 'w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300'} ${field.icon ? 'pl-10' : ''} ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
                  disabled={field.disabled || isSubmitting}
                  required={field.required}
                  onFocus={(e) => {
                    const styles = focusStyles('#3b82f6', 0.5);
                    e.target.style.boxShadow = styles.boxShadow;
                    e.target.style.borderColor = styles.borderColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = fieldErrors[field.name] ? '#ef4444' : '#4b5563';
                  }}
                />
              ) : field.type === 'select' ? (
                // Select input with options
                <select
                  id={field.id || field.name}
                  name={field.name}
                  value={formValues[field.name] || ''}
                  onChange={handleChange}
                  className={`${inputClassName || 'w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300'} ${field.icon ? 'pl-10' : ''} ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
                  disabled={field.disabled || isSubmitting}
                  required={field.required}
                  onFocus={(e) => {
                    const styles = focusStyles('#3b82f6', 0.5);
                    e.target.style.boxShadow = styles.boxShadow;
                    e.target.style.borderColor = styles.borderColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = fieldErrors[field.name] ? '#ef4444' : '#4b5563';
                  }}
                >
                  {field.options && field.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                // Checkbox input with label
                <div className="flex items-center">
                  <input
                    id={field.id || field.name}
                    name={field.name}
                    type="checkbox"
                    checked={formValues[field.name] || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600 rounded"
                    disabled={field.disabled || isSubmitting}
                  />
                  {field.checkboxLabel && (
                    <label htmlFor={field.id || field.name} className="ml-2 block text-sm text-gray-300">
                      {field.checkboxLabel} {field.required && <span className="text-red-500">*</span>}
                    </label>
                  )}
                </div>
              ) : field.type === 'file' ? (
                // Custom file input with preview
                renderFileInput(field)
              ) : (
                // Default input (text, email, password, etc.)
                <input
                  id={field.id || field.name}
                  name={field.name}
                  type={field.type || 'text'}
                  value={formValues[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder || ''}
                  className={`${inputClassName || 'w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300'} ${field.icon ? 'pl-10' : ''} ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
                  disabled={field.disabled || isSubmitting}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  pattern={field.pattern}
                  onFocus={(e) => {
                    const styles = focusStyles('#3b82f6', 0.5);
                    e.target.style.boxShadow = styles.boxShadow;
                    e.target.style.borderColor = styles.borderColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = fieldErrors[field.name] ? '#ef4444' : '#4b5563';
                  }}
                />
              )}
            </div>
            
            {/* Field help text - displays below field unless there's an error */}
            {field.helpText && !fieldErrors[field.name] && (
              <p className="mt-1 text-xs text-blue-400">{field.helpText}</p>
            )}
            
            {/* Field error message - displays if validation fails */}
            {fieldErrors[field.name] && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
        
        {/* Show custom footer instead of default submit button when footer is provided */}
        {footer ? (
          <div className="mt-4">{footer}</div>
        ) : (
          /* Default Submit button with loading state */
          <div className="flex space-x-4">
            {/* Reset button (optional) */}
            {fields.length > 0 && Object.keys(formValues).some(key => !!formValues[key]) && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
            
            {/* Submit button - FIXED: also check if we're on register page */}
            <button
              type="submit"
              disabled={isSubmitting || (requiresAuth === true && !isAuthenticated && !isRegisterPage)}
              className={`${buttonClassName || 'flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed'} flex justify-center items-center`}
            >
              {isSubmitting ? (
                // Show loading spinner and "Processing..." text when submitting
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                // Show the submit button text when not submitting
                submitText
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormComponent;