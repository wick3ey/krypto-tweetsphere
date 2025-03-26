
import axios from 'axios';

// Create an axios instance with default config
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  // Set a reasonable timeout
  timeout: 10000,
});

// Add a request interceptor to include JWT token in requests when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors
    if (error.response) {
      if (error.response.status === 401) {
        console.log('Unauthorized request detected, clearing auth data');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('wallet_address');
      }
      
      // Add detailed error info to the error object
      if (error.response.data) {
        error.message = error.response.data.message || error.message;
        error.details = error.response.data;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
