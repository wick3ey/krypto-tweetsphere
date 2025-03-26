
import axios from 'axios';
import { toast } from "sonner";

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
        
        // Show toast notification for unauthorized requests
        toast.error("Authentication expired", {
          description: "Please reconnect your wallet to continue."
        });
      }
      
      // Add detailed error info to the error object
      if (error.response.data) {
        error.message = error.response.data.message || error.message;
        error.details = error.response.data;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error', error.request);
      toast.error("Network error", {
        description: "Can't connect to the server. Please check your internet connection."
      });
    } else {
      // Something happened in setting up the request
      console.error('Request setup error', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
