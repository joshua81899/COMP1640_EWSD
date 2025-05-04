import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import FormComponent from '../components/FormComponent';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    faculty: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formStep, setFormStep] = useState(1);
  const registerCardRef = useRef(null);
  const formElementsRef = useRef([]);
  const navigate = useNavigate();

  // Available faculties with their corresponding IDs
  const faculties = [
    { id: "1", name: 'Arts & Humanities' },
    { id: "2", name: 'Business' },
    { id: "3", name: 'Education' },
    { id: "4", name: 'Engineering' },
    { id: "5", name: 'Health Sciences' },
    { id: "6", name: 'Law' },
    { id: "7", name: 'Science' },
    { id: "8", name: 'Social Sciences' }
  ];

  // Convert faculties to options format for FormComponent
  const facultyOptions = faculties.map(faculty => ({
    value: faculty.id,
    label: faculty.name
  }));

  // Form fields for step 1
  const step1Fields = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'John',
      required: true
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Doe',
      required: true
    },
    {
      name: 'email',
      label: 'University Email',
      type: 'email',
      placeholder: 'your.name@university.edu',
      required: true,
      icon: (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      ),
      helpText: 'Must be your university email address',
      validate: (value) => {
        if (!value.includes('university') && !value.endsWith('.edu')) {
          return 'Please use your university email address';
        }
        return null;
      }
    },
    {
      name: 'faculty',
      label: 'Faculty',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select your faculty' },
        ...facultyOptions
      ]
    }
  ];

  // Form fields for step 2
  const step2Fields = [
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a password',
      required: true,
      icon: (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
      helpText: 'Must be at least 8 characters',
      minLength: 8
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm your password',
      required: true,
      icon: (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
      validate: (value, values) => {
        if (value !== values.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    },
    {
      name: 'agreeToTerms',
      type: 'checkbox',
      required: true,
      checkboxLabel: (
        <>
          I agree to the{' '}
          <Link to="/terms" className="text-blue-400 hover:text-blue-300 transition">
            Terms and Conditions
          </Link>
        </>
      )
    }
  ];

  // Handle step 1 submission
  const handleStep1Submit = (values) => {
    setFormData(prevData => ({ ...prevData, ...values }));
    setFormStep(2);
    window.scrollTo(0, 0);
    animateFormStep();
  };

  // Handle final registration with improved error handling
  const handleRegister = async (values) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const finalData = { ...formData, ...values };
      
      // API endpoint with correct port
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      // Log the request data for debugging (without password)
      console.log('Sending registration request to:', `${apiUrl}/api/auth/register`);
      console.log('Registration data:', {
        first_name: finalData.firstName,
        last_name: finalData.lastName,
        email: finalData.email,
        faculty_id: finalData.faculty,
        // Don't log the password
      });
      
      // FIXED: Send faculty_id as a string, not an integer
      // FIXED: Add role_id for student (4)
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: finalData.firstName,
          last_name: finalData.lastName,
          email: finalData.email,
          faculty_id: String(finalData.faculty), // Keep as string to match DB schema
          password: finalData.password,
          role_id: "4" // Add role_id for student - must be a string to match DB schema
        }),
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Registration failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Store user data and token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to the first step
  const handleBack = () => {
    setFormStep(1);
    animateFormStep();
  };

  // Add elements to the formElementsRef array
  const addToFormRefs = (el) => {
    if (el && !formElementsRef.current.includes(el)) {
      formElementsRef.current.push(el);
    }
  };

  // GSAP animations for form elements
  const animateFormStep = () => {
    formElementsRef.current = [];
    
    setTimeout(() => {
      if (formElementsRef.current.length > 0) {
        gsap.fromTo(
          formElementsRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out'
          }
        );
      }
    }, 100);
  };

  // Initial animation
  useEffect(() => {
    if (registerCardRef.current) {
      gsap.fromTo(
        registerCardRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
    
    const animationTimeout = setTimeout(() => {
      if (formElementsRef.current.length > 0) {
        gsap.fromTo(
          formElementsRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out'
          }
        );
      }
    }, 100);
    
    return () => clearTimeout(animationTimeout);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8" 
         style={{ backgroundColor: '#111827' }}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900"
          style={{ opacity: 0.9, background: 'linear-gradient(to bottom right, #111827, #1f2937, #1e3a8a)' }}
        ></div>
        <div className="absolute inset-0 opacity-20">
          {/* Background pattern */}
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="small-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#small-grid)" />
          </svg>
        </div>
      </div>
      
      <div 
        ref={registerCardRef}
        className="register-card max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative z-10" 
        style={{ backgroundColor: '#1f2937', opacity: 1 }}
      >
        {/* Top color accent */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" 
             style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}></div>
        
        <div className="px-6 py-8 sm:px-10">
          <div className="mb-6 text-center">
            <Link to="/" className="flex items-center justify-center" ref={addToFormRefs}>
              <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#60a5fa' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>
            <h2 ref={addToFormRefs} className="mt-4 text-3xl font-extrabold text-white" style={{ color: 'white' }}>
              {formStep === 1 ? 'Create Account' : 'Complete Registration'}
            </h2>
            <p ref={addToFormRefs} className="mt-2 text-sm text-gray-400" style={{ color: '#9ca3af' }}>
              {formStep === 1 
                ? 'Join the University Magazine community'
                : 'Secure your account with a password'
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div ref={addToFormRefs} className="mb-8">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ 
                  width: formStep === 1 ? '50%' : '100%', 
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' 
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Personal Info</span>
              <span>Security</span>
            </div>
          </div>

          {/* Form steps using FormComponent */}
          {formStep === 1 ? (
            <FormComponent
              fields={step1Fields}
              initialValues={formData}
              onSubmit={handleStep1Submit}
              submitText="Continue"
              isSubmitting={false}
              error={error}
              className="bg-transparent p-0 border-0"
              inputClassName="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
              buttonClassName="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              requiresAuth={false} // Important: explicitly set to false
            />
          ) : (
            <FormComponent
              fields={step2Fields}
              initialValues={formData}
              onSubmit={handleRegister}
              submitText={isSubmitting ? "Creating..." : "Create Account"}
              isSubmitting={isSubmitting}
              error={error}
              className="bg-transparent p-0 border-0"
              inputClassName="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
              buttonClassName="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              requiresAuth={false} // Important: explicitly set to false
              footer={formStep === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              )}
            />
          )}

          <div ref={addToFormRefs} className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-600 rounded-md blur opacity-40 group-hover:opacity-80 transition duration-300 group-hover:blur-lg"></div>
                <Link
                  to="/login"
                  className="relative w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;