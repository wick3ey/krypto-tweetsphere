
import apiClient from './apiClient';

export const exploreService = {
  getTrending: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/trending');
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error(`Error fetching tweets for hashtag #${tag}:`, error);
      return [];
    }
  },
  
  getCommunities: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/communities');
      return response.data;
    } catch (error) {
      console.error('Error fetching communities:', error);
      return { topics: [], projects: [], groups: [] };
    }
  },
  
  getSuggestedUsers: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/explore/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      return [];
    }
  },
};
