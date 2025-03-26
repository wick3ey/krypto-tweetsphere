
import apiClient from './apiClient';
import { User } from '@/lib/types';
import { toast } from "sonner";

export const userService = {
  searchUsers: async (query: string) => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/users/search', { params: { query } });
      return response.data.users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },
  
  setupProfile: async (profileData: Partial<User>) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/users/setup', profileData);
      toast.success("Profile setup completed successfully");
      return response.data.user;
    } catch (error: any) {
      console.error('Error completing profile setup:', error);
      toast.error("Profile setup failed", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  getUserProfile: async (identifier: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${identifier}`);
      return response.data.user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData: Partial<User>) => {
    try {
      const response = await apiClient.put('https://f3oci3ty.xyz/api/users/profile', profileData);
      toast.success("Profile updated successfully");
      return response.data.user;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Profile update failed", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  followUser: async (userId: string) => {
    try {
      const response = await apiClient.post(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
      return response.data;
    } catch (error: any) {
      console.error('Error following user:', error);
      toast.error("Failed to follow user", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  unfollowUser: async (userId: string) => {
    try {
      const response = await apiClient.delete(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
      return response.data;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast.error("Failed to unfollow user", {
        description: error.response?.data?.error || error.message || "Please try again."
      });
      throw error;
    }
  },
  
  getUserFollowers: async (userId: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/followers`);
      return response.data.followers;
    } catch (error) {
      console.error('Error getting user followers:', error);
      throw error;
    }
  },
  
  getUserFollowing: async (userId: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/following`);
      return response.data.following;
    } catch (error) {
      console.error('Error getting user following:', error);
      throw error;
    }
  },
  
  getUserTweets: async (userId: string, type?: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/tweets`, {
        params: type ? { type } : undefined
      });
      return response.data.tweets;
    } catch (error) {
      console.error('Error getting user tweets:', error);
      throw error;
    }
  },
  
  getUserLikedTweets: async (userId: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/likes`);
      return response.data.tweets;
    } catch (error) {
      console.error('Error getting user liked tweets:', error);
      throw error;
    }
  },
  
  getUserCryptoActivity: async (userId: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/crypto-activity`);
      return response.data.cryptoActivity;
    } catch (error) {
      console.error('Error getting user crypto activity:', error);
      throw error;
    }
  }
};
