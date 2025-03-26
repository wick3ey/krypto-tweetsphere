
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

// Function to log requests and responses (will be called by interceptors)
const logApiActivity = (type, data) => {
  // Only import the logService here to avoid circular dependency
  const { logService } = require('./logService');
  
  if (type === 'request') {
    const { method, url, headers, data: requestData } = data;
    logService.debug('API Request', { method, url, headers, data: requestData }, 'apiClient');
  } 
  else if (type === 'response') {
    const { status, config, data: responseData } = data;
    logService.debug('API Response', { 
      url: config.url, 
      method: config.method?.toUpperCase(), 
      status, 
      data: responseData 
    }, 'apiClient');
  }
  else if (type === 'error') {
    const { message, config, response, request } = data;
    
    // For response errors (server responded with error)
    if (response) {
      logService.error('API Response Error', {
        url: config.url,
        method: config.method?.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        message
      }, 'apiClient');
    }
    // For request errors (no response received)
    else if (request) {
      logService.error('API Request Error', {
        url: config?.url,
        method: config?.method?.toUpperCase(),
        message: 'No response received',
        error: message
      }, 'apiClient');
    }
    // For setup errors
    else {
      logService.error('API Config Error', {
        message,
        config
      }, 'apiClient');
    }
  }
};

// Add a request interceptor to include JWT token in requests when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request (avoid circular imports)
    setTimeout(() => logApiActivity('request', config), 0);
    
    return config;
  },
  (error) => {
    // Log the error (avoid circular imports)
    setTimeout(() => logApiActivity('error', error), 0);
    
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response (avoid circular imports)
    setTimeout(() => logApiActivity('response', response), 0);
    
    return response;
  },
  (error) => {
    // Log the error (avoid circular imports)
    setTimeout(() => logApiActivity('error', error), 0);
    
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
