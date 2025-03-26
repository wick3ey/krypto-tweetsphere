
import apiClient from './apiClient';
import { TrendingData, CommunitiesData, SuggestedUser } from '@/lib/types';

export const exploreService = {
  getTrending: async (): Promise<TrendingData> => {
    try {
      const response = await apiClient.get('/api/explore/trending');
      // Ensure we always return an object with empty arrays as defaults
      return {
        topics: Array.isArray(response.data.topics) ? response.data.topics : [],
        coins: Array.isArray(response.data.coins) ? response.data.coins : [],
        events: Array.isArray(response.data.events) ? response.data.events : []
      };
    } catch (error) {
      console.error('Error fetching trending data:', error);
      // Always return a valid object even on error
      return { topics: [], coins: [], events: [] };
    }
  },
  
  getHashtagTweets: async (tag: string, sort?: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/explore/hashtags/${tag}`, {
        params: sort ? { sort } : undefined
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching tweets for hashtag #${tag}:`, error);
      return [];
    }
  },
  
  getCommunities: async (): Promise<CommunitiesData> => {
    try {
      const response = await apiClient.get('/api/explore/communities');
      // Ensure we always return an object with empty arrays as defaults
      return {
        topics: Array.isArray(response.data.topics) ? response.data.topics : [],
        projects: Array.isArray(response.data.projects) ? response.data.projects : [],
        groups: Array.isArray(response.data.groups) ? response.data.groups : []
      };
    } catch (error) {
      console.error('Error fetching communities:', error);
      // Always return a valid object even on error
      return { topics: [], projects: [], groups: [] };
    }
  },
  
  getSuggestedUsers: async (): Promise<SuggestedUser[]> => {
    try {
      // Check if the user is authenticated before making the request
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping suggested users fetch");
        return [];
      }
      
      const response = await apiClient.get('/api/explore/users');
      
      // Handle successful response
      if (response && response.data) {
        // Ensure we return an array, even if the API returns an object
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          return response.data.users;
        }
      }
      
      // If we got here, the response wasn't in the expected format
      return [];
    } catch (error) {
      // Check if it's an authentication error
      if (error?.response?.status === 401) {
        console.warn("Authentication token expired or invalid");
        // Optionally clear the invalid token
        // localStorage.removeItem('jwt_token');
      }
      
      console.error('Error fetching suggested users:', error);
      // Always return a valid array even on error to prevent component errors
      return [];
    }
  },
};
