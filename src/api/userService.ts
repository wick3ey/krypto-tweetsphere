import apiClient from './apiClient';
import { User } from '@/lib/types';
import { toast } from "sonner";
import { logService } from './logService';

export const userService = {
  searchUsers: async (query: string) => {
    try {
      // Validate that query has some meaningful content before making API call
      if (!query || query.trim().length === 0) {
        logService.debug("Skipping empty user search query", {}, "userService");
        return []; // Return empty array instead of making the API call
      }
      
      logService.debug("Searching users", { query }, "userService");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/users/search', { params: { query } });
      return response.data.users;
    } catch (error) {
      logService.error('Error searching users:', { error }, "userService");
      throw error;
    }
  },
  
  setupProfile: async (profileData: Partial<User>) => {
    try {
      logService.info("Setting up user profile", { profileData }, "userService");
      const response = await apiClient.post('https://f3oci3ty.xyz/api/users/setup', profileData);
      logService.info("Profile setup completed", { userId: response.data.user.id }, "userService");
      toast.success("Profile setup completed successfully");
      return response.data.user;
    } catch (error: any) {
      logService.error('Error completing profile setup', { error }, "userService");
      toast.error("Profile setup failed", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  getUserProfile: async (identifier: string, options?: { includeNFTs?: boolean, includeTweets?: boolean }) => {
    try {
      const params = new URLSearchParams();
      if (options?.includeNFTs) params.append('includeNFTs', 'true');
      if (options?.includeTweets) params.append('includeTweets', 'true');
      
      logService.debug("Getting user profile", { identifier, options }, "userService");
      const response = await apiClient.get(
        `https://f3oci3ty.xyz/api/users/${identifier}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data.user;
    } catch (error) {
      logService.error('Error getting user profile', { error, identifier }, "userService");
      throw error;
    }
  },
  
  updateProfile: async (profileData: Partial<User>) => {
    try {
      logService.info("Updating user profile", { profileData }, "userService");
      const response = await apiClient.put('https://f3oci3ty.xyz/api/users/profile', profileData);
      logService.info("Profile updated successfully", { userId: response.data.user.id }, "userService");
      toast.success("Profile updated successfully");
      return response.data.user;
    } catch (error: any) {
      logService.error('Error updating profile', { error, profileData }, "userService");
      toast.error("Profile update failed", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  followUser: async (userId: string) => {
    try {
      logService.info("Following user", { targetUserId: userId }, "userService");
      const response = await apiClient.post(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
      logService.info("Successfully followed user", { targetUserId: userId }, "userService");
      return response.data;
    } catch (error: any) {
      logService.error('Error following user', { error, targetUserId: userId }, "userService");
      toast.error("Failed to follow user", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  unfollowUser: async (userId: string) => {
    try {
      logService.info("Unfollowing user", { targetUserId: userId }, "userService");
      const response = await apiClient.delete(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
      logService.info("Successfully unfollowed user", { targetUserId: userId }, "userService");
      return response.data;
    } catch (error: any) {
      logService.error('Error unfollowing user', { error, targetUserId: userId }, "userService");
      toast.error("Failed to unfollow user", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  getUserFollowers: async (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    try {
      logService.debug("Getting user followers", { userId, page, limit, sortBy }, "userService");
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/followers`, {
        params: { page, limit, sortBy }
      });
      return response.data.followers;
    } catch (error) {
      logService.error('Error getting user followers', { error, userId }, "userService");
      throw error;
    }
  },
  
  getUserFollowing: async (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    try {
      logService.debug("Getting user following", { userId, page, limit, sortBy }, "userService");
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/following`, {
        params: { page, limit, sortBy }
      });
      return response.data.following;
    } catch (error) {
      logService.error('Error getting user following', { error, userId }, "userService");
      throw error;
    }
  },
  
  getUserTweets: async (userId: string, options?: { type?: string, page?: number, limit?: number, sortBy?: string }) => {
    try {
      const { type = 'all', page = 1, limit = 20, sortBy = 'recent' } = options || {};
      logService.debug("Getting user tweets", { userId, type, page, limit, sortBy }, "userService");
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/tweets`, {
        params: { type, page, limit, sortBy }
      });
      return response.data.tweets;
    } catch (error) {
      logService.error('Error getting user tweets', { error, userId }, "userService");
      throw error;
    }
  }
};
