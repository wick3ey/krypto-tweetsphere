
import apiClient from './apiClient';

// Define types for response data
interface TrendingResponse {
  topics: any[];
  coins: any[];
  events: any[];
}

interface CommunitiesResponse {
  topics: any[];
  projects: any[];
  groups: any[];
}

export const exploreService = {
  getTrending: async (): Promise<TrendingResponse> => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/trending');
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
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/explore/hashtags/${tag}`, {
        params: sort ? { sort } : undefined
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching tweets for hashtag #${tag}:`, error);
      return [];
    }
  },
  
  getCommunities: async (): Promise<CommunitiesResponse> => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/communities');
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
  
  getSuggestedUsers: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      return [];
    }
  },
};
