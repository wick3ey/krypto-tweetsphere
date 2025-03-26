
import apiClient from './apiClient';
import { User } from '@/lib/types';

export const userService = {
  searchUsers: async (query: string) => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/users/search', { params: { query } });
    return response.data;
  },
  
  setupProfile: async (profileData: Partial<User>) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/users/setup', profileData);
    return response.data;
  },
  
  getUserProfile: async (identifier: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${identifier}`);
    return response.data;
  },
  
  updateProfile: async (profileData: Partial<User>) => {
    const response = await apiClient.put('https://f3oci3ty.xyz/api/users/profile', profileData);
    return response.data;
  },
  
  followUser: async (userId: string) => {
    const response = await apiClient.post(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
    return response.data;
  },
  
  unfollowUser: async (userId: string) => {
    const response = await apiClient.delete(`https://f3oci3ty.xyz/api/users/${userId}/follow`);
    return response.data;
  },
  
  getUserFollowers: async (userId: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/followers`);
    return response.data;
  },
  
  getUserFollowing: async (userId: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/following`);
    return response.data;
  },
  
  getUserTweets: async (userId: string, type?: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/users/${userId}/tweets`, {
      params: type ? { type } : undefined
    });
    return response.data;
  },
};
