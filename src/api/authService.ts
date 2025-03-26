import apiClient from './apiClient';
import { toast } from "sonner";
import { logService } from './logService';

export const authService = {
  getNonce: async (walletAddress: string) => {
    logService.info("Requesting nonce for wallet", { walletAddress }, "authService");
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
      logService.debug("Nonce response received", { responseData: response.data }, "authService");
      
      // Check if the response has the expected structure
      if (!response.data || (!response.data.data && !response.data.nonce)) {
        const error = "Invalid response format from server";
        logService.error(error, { responseData: response.data }, "authService");
        throw new Error(error);
      }
      
      // Handle different response formats
      // If response.data.data exists, use that structure
      if (response.data.data) {
        const result = {
          nonce: response.data.data.nonce,
          message: response.data.data.message
        };
        logService.debug("Parsed nonce from response.data.data", result, "authService");
        return result;
      }
      
      // Otherwise try to get nonce and message directly from response.data
      const result = {
        nonce: response.data.nonce,
        message: response.data.message || `Sign in to CryptoSocial with your Solana wallet. Nonce: ${response.data.nonce}`
      };
      logService.debug("Parsed nonce from response.data", result, "authService");
      return result;
    } catch (error) {
      logService.error("Error getting nonce", { error }, "authService");
      toast.error("Failed to get authentication nonce", {
        description: "Please try again or contact support if the problem persists."
      });
      throw error;
    }
  },
  
  verifySignature: async (walletAddress: string, signature: any) => {
    try {
      logService.info("Verifying signature", { walletAddress, signature }, "authService");
      
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
        
        logService.info("Authentication successful", { userId: user.id, isNewUser: user.isNewUser }, "authService");
        return {
          token,
          user,
          isNewUser: user.isNewUser
        };
      } else {
        const errorMsg = response.data.message || 'Authentication failed';
        logService.error("Authentication failed", { message: errorMsg }, "authService");
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      logService.error('Error verifying signature', { error }, "authService");
      toast.error("Authentication failed", {
        description: error.message || "Failed to authenticate with the server. Please try again."
      });
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      logService.debug("Getting current user", {}, "authService");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/auth/me');
      logService.debug("Current user retrieved", { user: response.data.data.user }, "authService");
      return response.data.data.user;
    } catch (error) {
      logService.error('Error getting current user', { error }, "authService");
      return null;
    }
  },
  
  logout: async () => {
    try {
      logService.info("Logging out user", {}, "authService");
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/logout');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      logService.info("User logged out successfully", {}, "authService");
      toast.success("Logged out successfully");
      return response.data;
    } catch (error) {
      logService.error('Error during logout', { error }, "authService");
      // Still clear local storage even if the API call fails
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      throw error;
    }
  }
};
