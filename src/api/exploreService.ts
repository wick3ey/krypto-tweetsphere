
import apiClient from './apiClient';

export const exploreService = {
  getTrending: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/trending');
      return {
        topics: Array.isArray(response.data.topics) ? response.data.topics : [],
        coins: Array.isArray(response.data.coins) ? response.data.coins : [],
        events: Array.isArray(response.data.events) ? response.data.events : []
      };
    } catch (error) {
      console.error('Error fetching trending data:', error);
      return { topics: [], coins: [], events: [] };
    }
  },
  
  getHashtagTweets: async (tag: string, sort?: string) => {
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
  
  getCommunities: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/communities');
      return {
        topics: Array.isArray(response.data.topics) ? response.data.topics : [],
        projects: Array.isArray(response.data.projects) ? response.data.projects : [],
        groups: Array.isArray(response.data.groups) ? response.data.groups : []
      };
    } catch (error) {
      console.error('Error fetching communities:', error);
      return { topics: [], projects: [], groups: [] };
    }
  },
  
  getSuggestedUsers: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      return [];
    }
  },
};
