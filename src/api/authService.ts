
import apiClient from './apiClient';

export const authService = {
  getNonce: async (walletAddress: string) => {
    console.log("Requesting nonce for:", walletAddress);
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
    return response.data;
  },
  
  verifySignature: async (address: string, signature: string, nonce: string) => {
    const message = `Logga in på CryptoSocial med din Solana-wallet. Nonce: ${nonce}`;
    console.log("Verifying signature with message:", message);
    
    const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/verify', { 
      walletAddress: address, 
      signature, 
      message
    });
    
    // Store the token in localStorage immediately upon successful verification
    if (response.data && response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('wallet_address', address);
    }
    
    return response.data;
  },
  
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  logout: async () => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/logout');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      return response.data;
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local storage even if the API call fails
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      throw error;
    }
  },
};
