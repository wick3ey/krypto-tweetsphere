
import apiClient from './apiClient';

export const tweetService = {
  getFeed: async () => {
    const response = await apiClient.get('/tweets/feed');
    return response.data;
  },
  
  getExploreFeed: async () => {
    const response = await apiClient.get('/tweets/explore');
    return response.data;
  },
  
  searchTweets: async (query: string) => {
    const response = await apiClient.get('/tweets/search', { params: { query } });
    return response.data;
  },
  
  createTweet: async (content: string, attachments?: string[]) => {
    const response = await apiClient.post('/tweets', { content, attachments });
    return response.data;
  },
  
  getTweet: async (id: string) => {
    const response = await apiClient.get(`/tweets/${id}`);
    return response.data;
  },
  
  deleteTweet: async (id: string) => {
    const response = await apiClient.delete(`/tweets/${id}`);
    return response.data;
  },
  
  likeTweet: async (id: string) => {
    const response = await apiClient.post(`/tweets/${id}/like`);
    return response.data;
  },
  
  unlikeTweet: async (id: string) => {
    const response = await apiClient.delete(`/tweets/${id}/like`);
    return response.data;
  },
  
  retweet: async (id: string) => {
    const response = await apiClient.post(`/tweets/${id}/retweet`);
    return response.data;
  },
  
  unretweet: async (id: string) => {
    const response = await apiClient.delete(`/tweets/${id}/retweet`);
    return response.data;
  },
  
  replyToTweet: async (id: string, content: string, attachments?: string[]) => {
    const response = await apiClient.post(`/tweets/${id}/reply`, { content, attachments });
    return response.data;
  },
  
  getTweetReplies: async (id: string) => {
    const response = await apiClient.get(`/tweets/${id}/replies`);
    return response.data;
  },
};
