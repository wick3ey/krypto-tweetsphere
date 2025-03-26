
import apiClient from './apiClient';
import { User } from '@/lib/types';

export const userService = {
  searchUsers: async (query: string) => {
    const response = await apiClient.get('/users/search', { params: { query } });
    return response.data;
  },
  
  setupProfile: async (profileData: Partial<User>) => {
    const response = await apiClient.post('/users/setup', profileData);
    return response.data;
  },
  
  getUserProfile: async (identifier: string) => {
    const response = await apiClient.get(`/users/${identifier}`);
    return response.data;
  },
  
  updateProfile: async (profileData: Partial<User>) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },
  
  followUser: async (userId: string) => {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response.data;
  },
  
  unfollowUser: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response.data;
  },
  
  getUserFollowers: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/followers`);
    return response.data;
  },
  
  getUserFollowing: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/following`);
    return response.data;
  },
  
  getUserTweets: async (userId: string, type?: string) => {
    const response = await apiClient.get(`/users/${userId}/tweets`, {
      params: type ? { type } : undefined
    });
    return response.data;
  },
};
