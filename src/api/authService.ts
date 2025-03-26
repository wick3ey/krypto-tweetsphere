
import apiClient from './apiClient';

export const authService = {
  getNonce: async () => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce');
    return response.data;
  },
  
  verifySignature: async (address: string, signature: string, nonce: string) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/verify', { address, signature, nonce });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/logout');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('wallet_address');
    return response.data;
  },
};
