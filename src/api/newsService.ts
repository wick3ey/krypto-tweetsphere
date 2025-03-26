
import apiClient from './apiClient';

export const newsService = {
  getCryptoNews: async () => {
    const response = await apiClient.get('/news/crypto');
    return response.data;
  },
  
  getTrending: async () => {
    const response = await apiClient.get('/news/trending');
    return response.data;
  },
  
  getMarketData: async () => {
    const response = await apiClient.get('/news/market');
    return response.data;
  },
  
  getSentiment: async (symbol: string) => {
    const response = await apiClient.get('/news/sentiment', { params: { symbol } });
    return response.data;
  },
};
