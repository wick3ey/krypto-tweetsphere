
import apiClient from './apiClient';

export const exploreService = {
  getTrending: async () => {
    const response = await apiClient.get('/explore/trending');
    return response.data;
  },
  
  getHashtagTweets: async (tag: string, sort?: string) => {
    const response = await apiClient.get(`/explore/hashtags/${tag}`, {
      params: sort ? { sort } : undefined
    });
    return response.data;
  },
  
  getCommunities: async () => {
    const response = await apiClient.get('/explore/communities');
    return response.data;
  },
  
  getSuggestedUsers: async () => {
    const response = await apiClient.get('/explore/users');
    return response.data;
  },
};
