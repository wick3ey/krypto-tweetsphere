
import apiClient from './apiClient';

export const newsService = {
  getCryptoNews: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/news/crypto');
    return response.data;
  },
  
  getTrending: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/news/trending');
    return response.data;
  },
  
  getMarketData: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/news/market');
    return response.data;
  },
  
  getSentiment: async (symbol: string) => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/news/sentiment', { params: { symbol } });
    return response.data;
  },
};
