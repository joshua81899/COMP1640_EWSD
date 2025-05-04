import axios from 'axios';

// Create an axios instance with default configuration
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for handling authentication
instance.interceptors.request.use(
  config => {
    // Add token to request if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (e.g., token expired)
          console.error('Authentication error:', error.response.data);
          // Optional: Redirect to login page
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Permission denied:', error.response.data);
          break;
        case 404:
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('Request setup error:', error.message);
    }
    
    // Pass the error through for components to handle
    return Promise.reject(error);
  }
);

export default instance;