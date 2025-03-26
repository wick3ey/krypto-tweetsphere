
import apiClient from './apiClient';
import { toast } from "sonner";

export const authService = {
  getNonce: async (walletAddress: string) => {
    console.log("Requesting nonce for:", walletAddress);
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
      // Return both nonce and message from server
      return response.data.data;
    } catch (error) {
      console.error("Error getting nonce:", error);
      toast.error("Failed to get authentication nonce", {
        description: "Please try again or contact support if the problem persists."
      });
      throw error;
    }
  },
  
  verifySignature: async (walletAddress: string, signature: any) => {
    try {
      console.log("Verifying signature with params:", { walletAddress, signature });
      
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
    } catch (error: any) {
      console.error('Error verifying signature:', error);
      toast.error("Authentication failed", {
        description: error.message || "Failed to authenticate with the server. Please try again."
      });
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
      toast.success("Logged out successfully");
      return response.data;
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local storage even if the API call fails
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      throw error;
    }
  }
};
