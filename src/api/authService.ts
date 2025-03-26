
import apiClient from './apiClient';
import { toast } from "@/hooks/use-toast";

export const authService = {
  getNonce: async (walletAddress: string) => {
    console.log("Requesting nonce for:", walletAddress);
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
      // Return both nonce and message from server
      return response.data.data;
    } catch (error) {
      console.error("Error getting nonce:", error);
      throw error;
    }
  },
  
  verifySignature: async (walletAddress: string, signature: any, nonce: string) => {
    try {
      console.log("Verifying signature with params:", { walletAddress, signature, nonce });
      
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/verify', { 
        walletAddress, 
        signature
      });
      
      // Check if the authentication was successful
      if (response.data.success) {
        // Store the token in localStorage upon successful verification
        const { token, user } = response.data.data;
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('wallet_address', walletAddress);
        
        console.log("Authentication successful, user data:", user);
        return {
          token,
          user,
          isNewUser: user.isNewUser
        };
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/auth/me');
      return response.data.data.user;
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
  
  completeProfile: async (profileData: { username: string, bio?: string, profilePicture?: string }) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/complete-profile', profileData);
      return response.data.data.user;
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  }
};
