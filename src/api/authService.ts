
import apiClient from './apiClient';

export const authService = {
  getNonce: async (walletAddress: string) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
    return response.data;
  },
  
  verifySignature: async (address: string, signature: string, nonce: string) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/verify', { 
      walletAddress: address, 
      signature, 
      message: `Sign this message to login: ${nonce}` 
    });
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
