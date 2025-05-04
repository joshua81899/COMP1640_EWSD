import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const HomePage = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();
  
  // State for mobile menu and notifications
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState(null);
  
  // Refs for animation targets
  const heroTitleRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroButtonsRef = useRef(null);
  const featureCardsRef = useRef([]);
  const stepItemsRef = useRef([]);
  const timelineItemsRef = useRef([]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };
  
  // Handle logout function
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('lastLoginTime');
      navigate('/login');
    }
  };

  // Fetch faculties from API
  useEffect(() => {
    const fetchFaculties = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/faculties');
        if (!response.ok) {
          throw new Error('Failed to fetch faculties');
        }
        const data = await response.json();
        setFaculties(data);
      } catch (error) {
        console.error('Error fetching faculties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculties();
    
    // Get last login time if available
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      setLastLogin(new Date(lastLoginTime));
    }
  }, []);

  // Set up refs for feature cards
  const addToFeatureCardsRef = (el) => {
    if (el && !featureCardsRef.current.includes(el)) {
      featureCardsRef.current.push(el);
    }
  };

  // Set up refs for step items
  const addToStepItemsRef = (el) => {
    if (el && !stepItemsRef.current.includes(el)) {
      stepItemsRef.current.push(el);
    }
  };

  // Set up refs for timeline items
  const addToTimelineItemsRef = (el) => {
    if (el && !timelineItemsRef.current.includes(el)) {
      timelineItemsRef.current.push(el);
    }
  };

  // GSAP Animations
  useEffect(() => {
    // Reset refs arrays on each render
    featureCardsRef.current = [];
    stepItemsRef.current = [];
    timelineItemsRef.current = [];
    
    const animationTimer = setTimeout(() => {
      // Hero section animations
      if (heroTitleRef.current && heroSubtitleRef.current && heroButtonsRef.current) {
        const heroTimeline = gsap.timeline();
        heroTimeline
          .fromTo(heroTitleRef.current, 
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
          )
          .fromTo(heroSubtitleRef.current, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 
            0.3
          )
          .fromTo(heroButtonsRef.current, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 
            0.6
          );
      }

      // Function to create scroll animations with proper refs
      const createScrollAnimation = (refArray, options = {}) => {
        if (refArray.length > 0) {
          gsap.fromTo(
            refArray,
            { opacity: 0, y: 50, ...options.from },
            {
              opacity: 1,
              y: 0,
              stagger: 0.2,
              duration: 0.8,
              ease: 'power2.out',
              ...options.to,
              scrollTrigger: {
                trigger: refArray[0],
                start: 'top 80%',
                toggleActions: 'play none none none',
                once: true
              }
            }
          );
        }
      };

      // Apply scroll animations when refs are populated
      if (featureCardsRef.current.length > 0) {
        createScrollAnimation(featureCardsRef.current);
      }

      if (stepItemsRef.current.length > 0) {
        createScrollAnimation(stepItemsRef.current, {
          from: { x: -30 },
          to: { x: 0, ease: 'back.out(1.2)' }
        });
      }

      if (timelineItemsRef.current.length > 0) {
        createScrollAnimation(timelineItemsRef.current, {
          from: { scale: 0.9 },
          to: { scale: 1, ease: 'power1.out' }
        });
      }

      // Refresh ScrollTrigger
      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(animationTimer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Custom Navigation Bar */}
      <nav className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation Links */}
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center group">
                  <svg className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="ml-2 text-xl font-medium text-white group-hover:text-blue-300 transition-colors duration-300">University Magazine</span>
                </Link>
              </div>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex ml-10 space-x-8">
                <Link to="/about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300">About</Link>
                <Link to="/submissions" className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300">Submissions</Link>
                <Link to="/guidelines" className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300">Guidelines</Link>
                <Link to="/contact" className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300">Contact</Link>
                {isAuthenticated && (
                  <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300">
                    Dashboard
                  </Link>
                )}
              </div>
              
              {/* Mobile menu toggle button */}
              <div className="md:hidden flex ml-4">
                <button 
                  onClick={toggleMobileMenu}
                  className="text-gray-400 hover:text-white focus:outline-none transition-colors duration-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Right side elements */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell with Dropdown */}
                  <div className="relative">
                    <button 
                      className="text-gray-400 hover:text-white mr-4 focus:outline-none transition-colors duration-300"
                      onClick={toggleNotifications}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-sm font-medium text-white">Notifications</p>
                        </div>
                        
                        {/* Last Login Info */}
                        {lastLogin && (
                          <div className="px-4 py-3 border-b border-gray-700 text-sm">
                            <p className="text-gray-400">
                              Last login: {lastLogin.toLocaleString()}
                            </p>
                          </div>
                        )}
                        
                        <div className="px-4 py-3 text-center">
                          <p className="text-gray-400 text-sm">No new notifications</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* User Profile */}
                  <div className="flex items-center">
                    {/* User Avatar/Initial */}
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 transition-colors duration-300 hover:bg-blue-500">
                      <span className="text-xl font-medium">
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'T'}
                      </span>
                    </div>
                    
                    <div className="hidden md:block mr-6">
                      <span className="text-white">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Test User'}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="text-gray-300 hover:text-white transition-colors duration-300"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors duration-300">
                    Login
                  </Link>
                  <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-300">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu - only shown when mobile menu is open */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800">
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
                About
              </Link>
              <Link to="/submissions" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
                Submissions
              </Link>
              <Link to="/guidelines" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
                Guidelines
              </Link>
              <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300">
                Contact
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors duration-300">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with padding to account for fixed navbar */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        {/* Image Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <div className="absolute inset-0 bg-gray-900 opacity-80 z-10"></div>
          <img
            className="absolute min-w-full min-h-full object-cover brightness-50"
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxhbGx8fHx8fHx8fHwxNjIwMzg5OTM5&ixlib=rb-1.2.1&q=80&w=1080"
            alt="University background"
          />
        </div>

        <div className="max-w-4xl w-full text-center z-20">
          <h1 ref={heroTitleRef} className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            University Magazine Submission Portal
          </h1>
          <p ref={heroSubtitleRef} className="text-xl md:text-2xl text-gray-300 mb-8 drop-shadow-md">
            Share your creativity, get published, and join our university's literary community
          </p>
          <div ref={heroButtonsRef} className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Conditional rendering based on authentication status */}
            {isAuthenticated ? (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md blur opacity-60 group-hover:opacity-100 transition duration-300 group-hover:blur-lg"></div>
                <Link
                  to="/dashboard"
                  className="relative bg-gray-900 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl block"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                {/* Gradient Hero Login Button */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md blur opacity-60 group-hover:opacity-100 transition duration-300 group-hover:blur-lg"></div>
                  <Link
                    to="/login"
                    className="relative bg-gray-900 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl block"
                  >
                    Log In
                  </Link>
                </div>
               
                {/* Gradient Hero Register Button */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md blur opacity-60 group-hover:opacity-100 transition duration-300 group-hover:blur-lg"></div>
                  <Link
                    to="/register"
                    className="relative bg-gray-900 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl block"
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
       
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <svg
            className="w-6 h-6 text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
              });
            }}
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
<section className="features-section py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
      Platform Features
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {[
        {
          title: "Submit Articles",
          description: "Upload your articles as Word documents and images to be considered for publication",
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          title: "Receive Feedback",
          description: "Get personalized feedback from your Faculty's Marketing Coordinator",
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )
        },
        {
          title: "Get Published",
          description: "Selected contributions will be featured in the university's annual magazine",
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          )
        }
      ].map((feature, index) => (
        <div 
          key={index}
          ref={addToFeatureCardsRef}
          className="feature-card bg-gray-800 rounded-xl p-8 shadow-md border border-gray-700 hover:border-blue-500 hover:bg-gray-700 transition-all duration-200"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto hover:bg-blue-500 transition-colors duration-200">
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold text-center text-white mb-3">{feature.title}</h3>
          <p className="text-gray-300 text-center">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Steps Section */}
<section className="steps-section py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
      How It Works
    </h2>
    
    <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-4 md:gap-8">
      {[
        {
          number: '1',
          title: 'Register',
          description: 'Create an account with your university email'
        },
        {
          number: '2',
          title: 'Create',
          description: 'Write your article and prepare your images'
        },
        {
          number: '3',
          title: 'Submit',
          description: 'Upload your contributions before the deadline'
        },
        {
          number: '4',
          title: 'Review',
          description: 'Receive feedback and make any requested edits'
        }
      ].map((step, index) => (
        <div
          key={step.number}
          ref={addToStepItemsRef}
          className="step-item flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 group-hover:bg-blue-500 transition-colors duration-200">
            {step.number}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 text-center">
            {step.title}
          </h3>
          <p className="text-gray-300 text-center">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Timeline Section */}
      <section className="timeline-section py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Important Dates
          </h2>
         
          <div className="space-y-8">
            <div ref={addToTimelineItemsRef} className="timeline-item flex">
              <div className="flex flex-col items-center mr-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 hover:bg-blue-500 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="h-full w-0.5 bg-gray-600"></div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 shadow-md flex-1 mb-2 border border-gray-600 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Submissions Open
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  1st September 2024
                </p>
                <p className="text-gray-300">
                  The portal opens for new article and image submissions
                </p>
              </div>
            </div>
           
            <div ref={addToTimelineItemsRef} className="timeline-item flex">
              <div className="flex flex-col items-center mr-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 hover:bg-blue-500 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="h-full w-0.5 bg-gray-600"></div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 shadow-md flex-1 mb-2 border border-gray-600 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Deadline for New Submissions
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  15th February 2025
                </p>
                <p className="text-gray-300">
                  Last day to submit new articles and images
                </p>
              </div>
            </div>
           
            <div ref={addToTimelineItemsRef} className="timeline-item flex">
              <div className="flex flex-col items-center mr-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 hover:bg-blue-500 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="h-full w-0.5 bg-gray-600"></div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 shadow-md flex-1 mb-2 border border-gray-600 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Edits & Updates Period
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  15th Feb - 15th March 2025
                </p>
                <p className="text-gray-300">
                  Period for making updates to existing submissions based on coordinator feedback
                </p>
              </div>
            </div>
           
            <div ref={addToTimelineItemsRef} className="timeline-item flex">
              <div className="flex flex-col items-center mr-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2 hover:bg-blue-500 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* No connector for the last item */}
              </div>
              <div className="bg-gray-700 rounded-lg p-6 shadow-md flex-1 mb-2 border border-gray-600 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Final Selections Announced
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  1st April 2025
                </p>
                <p className="text-gray-300">
                  Announcement of articles selected for publication in this year's magazine
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section before footer */}
      <section className="bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Share Your Work?</h2>
          <p className="text-xl text-gray-300 mb-8">Join our community of student writers and artists today.</p>
          <div className="relative group inline-block">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md blur opacity-60 group-hover:opacity-100 transition duration-300 group-hover:blur-lg"></div>
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="relative bg-gray-900 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Today"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - fixed at the bottom */}
      <footer className="bg-gray-800 py-6 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="ml-2 text-lg font-medium text-white">University Magazine</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col md:flex-row justify-between text-sm">
            <p className="text-gray-400 text-center md:text-left">
              &copy; {new Date().getFullYear()} University Magazine. All rights reserved.
            </p>
            <div className="flex justify-center md:justify-start space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;