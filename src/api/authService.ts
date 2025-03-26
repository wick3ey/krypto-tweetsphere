
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
      if (!response.data || !response.data.nonce || !response.data.message) {
        const error = "Invalid nonce response format from server";
        logService.error(error, { responseData: response.data }, "authService");
        throw new Error(error);
      }

      const result = {
        nonce: response.data.nonce,
        message: response.data.message
      };
      
      logService.debug("Parsed nonce from response", result, "authService");
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
      logService.info("Verifying signature", { walletAddress, signature: signature?.substring(0, 20) + '...' }, "authService");
      
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/verify', { 
        walletAddress, 
        signature
      });
      
      // Check if the authentication was successful
      if (response.data.success) {
        // Store the token in localStorage upon successful verification
        const { token, user } = response.data;
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('wallet_address', walletAddress);
        
        logService.info("Authentication successful", { userId: user.id, needsSetup: user.needsSetup }, "authService");
        return {
          token,
          user,
          isNewUser: user.needsSetup
        };
      } else {
        const errorMsg = response.data.error || 'Authentication failed';
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
      logService.debug("Current user retrieved", { user: response.data.user }, "authService");
      return response.data.user;
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
