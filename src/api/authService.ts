
import apiClient from './apiClient';

export const authService = {
  getNonce: async () => {
    const response = await apiClient.post('/auth/nonce');
    return response.data;
  },
  
  verifySignature: async (address: string, signature: string, nonce: string) => {
    const response = await apiClient.post('/auth/verify', { address, signature, nonce });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('jwt_token');
    return response.data;
  },
};
