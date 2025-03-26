
import apiClient from './apiClient';
import { toast } from "sonner";

export const authService = {
  getNonce: async (walletAddress: string) => {
    console.info("Requesting nonce for wallet", { walletAddress });
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/nonce', { walletAddress });
      console.debug("Nonce response received", { responseData: response.data });
      
      // Check if the response has the expected structure
      if (!response.data || !response.data.nonce || !response.data.message) {
        const error = "Invalid nonce response format from server";
        console.error(error, { responseData: response.data });
        throw new Error(error);
      }

      const result = {
        nonce: response.data.nonce,
        message: response.data.message
      };
      
      console.debug("Parsed nonce from response", result);
      return result;
    } catch (error) {
      console.error("Error getting nonce", { error });
      toast.error("Failed to get authentication nonce", {
        description: "Please try again or contact support if the problem persists."
      });
      throw error;
    }
  },
  
  verifySignature: async (walletAddress: string, signature: any) => {
    try {
      console.info("Verifying signature", { walletAddress, signature: signature?.substring(0, 20) + '...' });
      
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
        
        console.info("Authentication successful", { userId: user.id, needsSetup: user.needsSetup });
        return {
          token,
          user,
          isNewUser: user.needsSetup
        };
      } else {
        const errorMsg = response.data.error || 'Authentication failed';
        console.error("Authentication failed", { message: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error verifying signature', { error });
      toast.error("Authentication failed", {
        description: error.message || "Failed to authenticate with the server. Please try again."
      });
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      console.debug("Getting current user", {});
      const response = await apiClient.get('https://f3oci3ty.xyz/api/auth/me');
      console.debug("Current user retrieved", { user: response.data.user });
      return response.data.user;
    } catch (error) {
      console.error('Error getting current user', { error });
      return null;
    }
  },
  
  logout: async () => {
    try {
      console.info("Logging out user", {});
      
      // Get Phantom provider if available
      const provider = window.phantom?.solana;
      if (provider && provider.isConnected) {
        try {
          // Disconnect from Phantom wallet
          await provider.disconnect();
          console.info("Disconnected from Phantom wallet");
        } catch (walletError) {
          console.error("Error disconnecting from wallet", { walletError });
        }
      }
      
      // Call server-side logout
      const response = await apiClient.post('https://f3oci3ty.xyz/api/auth/logout');
      
      // Clear local storage even if API call succeeds or fails
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      
      console.info("User logged out successfully", {});
      toast.success("Logged out successfully");
      return response.data;
    } catch (error) {
      console.error('Error during logout', { error });
      
      // Still clear local storage even if the API call fails
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      throw error;
    }
  }
};
