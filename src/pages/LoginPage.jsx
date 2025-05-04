import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import axios from 'axios';
import FormComponent from '../components/FormComponent';

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastLogin, setLastLogin] = useState(null);
  const loginCardRef = useRef(null);
  const formElementsRef = useRef([]);
  const navigate = useNavigate();

  // Form fields configuration
  const loginFields = [
    {
      name: 'email',
      label: 'Email address',
      type: 'email',
      placeholder: 'Your university email',
      required: true,
      icon: (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      )
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Your password',
      required: true,
      icon: (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: 'rememberMe',
      type: 'checkbox',
      checkboxLabel: 'Remember me'
    }
  ];

  // Handle login with database integration
  const handleLogin = async (formValues) => {
    console.log('Login attempt started with:', formValues);
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Sending request to backend...');
      const response = await axios.post(
        'http://localhost:5001/api/auth/login',
        { 
          email: formValues.email, 
          password: formValues.password 
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('Response received:', response);
      const { token, user } = response.data;
      
      // Normalize role before storing
      let normalizedRole = user.role;
      if (user.role === 2 || user.role === '2') {
        normalizedRole = 'MNGR';
      } else if (user.role === 1 || user.role === '1') {
        normalizedRole = 'ADMIN';
      } else if (user.role === 3 || user.role === '3') {
        normalizedRole = 'COORD';
      } else if (user.role === 4 || user.role === '4') {
        normalizedRole = 'STUDT';
      }
      
      // Store normalized user data
      const normalizedUser = {
        ...user,
        role: normalizedRole
      };
      
      console.log('Storing authentication data...');
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      if (formValues.rememberMe) {
        localStorage.setItem('userEmail', formValues.email);
      } else {
        localStorage.removeItem('userEmail');
      }
      
      // Call the onLoginSuccess callback with the user data
      if (onLoginSuccess) {
        onLoginSuccess(normalizedUser);
      }
      
      console.log('Navigation to dashboard...');
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login error full details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      setError(
        error.response?.data?.error || 
        error.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for previous login and saved email
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (token && user && isLoggedIn === 'true') {
      navigate('/dashboard');
      return;
    }
    
    // Get last login time if available
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      setLastLogin(new Date(lastLoginTime));
    }
    
    // Restore saved email if "remember me" was checked
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, [navigate]);

  // Animation setup
  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      if (loginCardRef.current) {
        // Main card animation
        gsap.fromTo(loginCardRef.current, 
          { y: 50, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
        
        // Animate form elements with stagger
        if (formElementsRef.current.length > 0) {
          gsap.fromTo(
            formElementsRef.current,
            { y: 20, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              stagger: 0.1, 
              duration: 0.6, 
              delay: 0.3, 
              ease: "power2.out" 
            }
          );
        }
      }
    }, 100);
    
    return () => clearTimeout(animationTimeout);
  }, []);

  // Helper function to add refs for animation
  const addToFormRefs = (el) => {
    if (el && !formElementsRef.current.includes(el)) {
      formElementsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#111827' }}>
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900"
          style={{ opacity: 0.9, background: 'linear-gradient(to bottom right, #111827, #1f2937, #1e3a8a)' }}></div>
        <div className="absolute inset-0 opacity-20">
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
      
      <div ref={loginCardRef} className="login-card max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative z-10" style={{ backgroundColor: '#1f2937' }}>
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}></div>
        
        <div className="px-6 py-8 sm:px-10">
          <div className="mb-6 text-center">
            <Link to="/" className="flex items-center justify-center" ref={addToFormRefs}>
              <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#60a5fa' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>
            <h2 ref={addToFormRefs} className="mt-4 text-3xl font-extrabold text-white">
              Welcome Back
            </h2>
            <p ref={addToFormRefs} className="mt-2 text-sm text-gray-400">
              Sign in to your University Magazine account
            </p>
            
            {lastLogin && (
              <div ref={addToFormRefs} className="mt-2 text-xs text-blue-400">
                Last login: {lastLogin.toLocaleString()}
              </div>
            )}
          </div>

          <div ref={addToFormRefs}>
            <FormComponent
              fields={loginFields}
              initialValues={formData}
              onSubmit={handleLogin}
              submitText={isSubmitting ? "Signing in..." : "Sign in"}
              isSubmitting={isSubmitting}
              error={error}
              className="bg-transparent p-0 border-0 shadow-none"
              inputClassName="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
              buttonClassName="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
              requiresAuth={false}  // IMPORTANT: Set this to false for login forms
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-400 hover:text-blue-300 transition">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>

          <div ref={addToFormRefs} className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-600 rounded-md blur opacity-40 group-hover:opacity-80 transition duration-300 group-hover:blur-lg"></div>
                <Link
                  to="/register"
                  className="relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Create new account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;