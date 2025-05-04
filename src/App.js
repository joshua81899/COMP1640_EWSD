import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MMDashboardPage from './pages/manager/MMDashboardPage';
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboardPage'; // New import for Coordinator Dashboard
import PublicSubmissionsPage from './pages/PublicSubmissionsPage';
import './App.css';

// Import our custom axios configuration
import './utils/axiosConfig';

// Configure axios interceptors
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor
  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      
      if ((error.response?.status === 403 || error.response?.status === 401) && 
          !originalRequest._retry) {
        
        originalRequest._retry = true;
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
};

setupAxiosInterceptors();

// Utility function to normalize roles for consistent comparison
const normalizeRole = (role) => {
  if (role === 2 || role === '2' || role === 'MNGR') return 'MNGR';
  if (role === 1 || role === '1' || role === 'ADMIN') return 'ADMIN';
  if (role === 3 || role === '3' || role === 'COORD') return 'COORD';
  if (role === 4 || role === '4' || role === 'STUDT') return 'STUDT';
  return String(role);
};

// Improved token expiration check
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Make sure token has correct structure before parsing
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Properly decode and parse the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch (err) {
    console.error('Token validation error:', err);
    return false;
  }
};

// Enhanced ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  // Check token validity first
  if (!isTokenValid(token)) {
    console.log('Token is invalid or expired, redirecting to login');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  // Parse user data
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.error('Error parsing user data:', e);
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  // If no user data, redirect to login
  if (!user) {
    console.log('No user data found, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Normalize user role and allowed roles for consistent comparison
  const userRole = normalizeRole(user.role || user.role_id);
  const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));

  console.log('Protected route check - User role:', userRole);
  console.log('Protected route check - Allowed roles:', normalizedAllowedRoles);

  // Check if user has required role
  if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    console.log('User role not authorized for this route, redirecting to appropriate dashboard');
    
    // Redirect based on user's actual role
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" />;
    } else if (userRole === 'MNGR') {
      return <Navigate to="/manager/dashboard" />;
    } else if (userRole === 'COORD') {
      return <Navigate to="/coordinator/dashboard" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication status...");
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && isTokenValid(token) && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log("User data found:", parsedUser);
          
          // Normalize role format
          const normalizedRole = normalizeRole(parsedUser.role || parsedUser.role_id);
          const normalizedUser = {
            ...parsedUser,
            role: normalizedRole
          };
          
          setUser(normalizedUser);
          setIsAuthenticated(true);
          
          // Optional: Verify user with backend
          try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
            await axios.get(`${apiUrl}/api/users/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("User verified with backend");
          } catch (verifyError) {
            console.error('User verification failed:', verifyError);
            handleLogout();
            return;
          }
        } catch (error) {
          console.error('Auth validation failed:', error);
          handleLogout();
        }
      } else {
        console.log("No valid authentication found");
        setIsAuthenticated(false);
        setUser(null);
      }
      setInitialCheckDone(true);
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Navigate to login
    window.location.href = '/login';
  };

  const handleLoginSuccess = (userData) => {
    console.log("Login successful:", userData);
    
    // Normalize role before setting state
    const normalizedRole = normalizeRole(userData.role || userData.role_id);
    const normalizedUser = {
      ...userData,
      role: normalizedRole
    };
    
    setUser(normalizedUser);
    setIsAuthenticated(true);
  };

  const getDashboardRedirect = () => {
    if (!isAuthenticated || !user) {
      console.log("Not authenticated, redirecting to login");
      return <Navigate to="/login" />;
    }
    
    // Get normalized role
    const userRole = normalizeRole(user.role || user.role_id);
    console.log("Getting dashboard redirect for role:", userRole);
    
    if (userRole === 'ADMIN') {
      console.log("Redirecting to admin dashboard");
      return <Navigate to="/admin/dashboard" />;
    } else if (userRole === 'MNGR') {
      console.log("Redirecting to manager dashboard");
      return <Navigate to="/manager/dashboard" />;
    } else if (userRole === 'COORD') {
      console.log("Redirecting to coordinator dashboard");
      return <Navigate to="/coordinator/dashboard" />;
    }
    console.log("Redirecting to student dashboard");
    return <Navigate to="/dashboard" />;
  };

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />} />
        
        <Route 
          path="/login" 
          element={isAuthenticated ? getDashboardRedirect() : <LoginPage onLoginSuccess={handleLoginSuccess} />} 
        />
        
        <Route 
          path="/register" 
          element={isAuthenticated ? getDashboardRedirect() : <RegisterPage onLoginSuccess={handleLoginSuccess} />} 
        />
        
        {/* Student dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['4', 'STUDT']}>
              <StudentDashboardPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin dashboard */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['1', 'ADMIN']}>
              <AdminDashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        {/* Marketing Manager dashboard - Main route */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['2', 'MNGR']}>
              <MMDashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        {/* Marketing Manager dashboard - Additional tab routes */}
        <Route 
          path="/manager/submissions" 
          element={
            <ProtectedRoute allowedRoles={['2', 'MNGR']}>
              <MMDashboardPage onLogout={handleLogout} initialTab="submissions" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manager/statistics" 
          element={
            <ProtectedRoute allowedRoles={['2', 'MNGR']}>
              <MMDashboardPage onLogout={handleLogout} initialTab="statistics" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manager/settings" 
          element={
            <ProtectedRoute allowedRoles={['2', 'MNGR']}>
              <MMDashboardPage onLogout={handleLogout} initialTab="settings" />
            </ProtectedRoute>
          } 
        />
        
        {/* Coordinator Dashboard - New routes */}
        <Route 
          path="/coordinator/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['3', 'COORD']}>
              <CoordinatorDashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/coordinator/submissions" 
          element={
            <ProtectedRoute allowedRoles={['3', 'COORD']}>
              <CoordinatorDashboardPage onLogout={handleLogout} initialTab="submissions" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/coordinator/review" 
          element={
            <ProtectedRoute allowedRoles={['3', 'COORD']}>
              <CoordinatorDashboardPage onLogout={handleLogout} initialTab="review" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/coordinator/settings" 
          element={
            <ProtectedRoute allowedRoles={['3', 'COORD']}>
              <CoordinatorDashboardPage onLogout={handleLogout} initialTab="settings" />
            </ProtectedRoute>
          } 
        />
        
        {/* Public submissions page */}
        <Route path="/submissions" element={<PublicSubmissionsPage />} />
        
        {/* Other public pages */}
        <Route path="/about" element={<div className="p-10 text-center">About Page</div>} />
        <Route path="/guidelines" element={<div className="p-10 text-center">Guidelines Page</div>} />
        <Route path="/contact" element={<div className="p-10 text-center">Contact Page</div>} />
        <Route path="/terms" element={<div className="p-10 text-center">Terms & Conditions</div>} />
        <Route path="/help" element={<div className="p-10 text-center">Help Page</div>} />
        
        {/* 404 route */}
        <Route path="*" element={<div className="p-10 text-center">Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;