
import axios from 'axios';

const API_BASE_URL = 'https://f3oci3ty.xyz/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
