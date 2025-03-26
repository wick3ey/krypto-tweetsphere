
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
