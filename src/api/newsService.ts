
import apiClient from './apiClient';

export const newsService = {
  getCryptoNews: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/news/crypto');
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      return [];
    }
  },
  
  getTrending: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/news/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending news:', error);
      return [];
    }
  },
  
  getMarketData: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/news/market');
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  },
  
  getSentiment: async (symbol: string) => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/news/sentiment', { 
        params: { symbol } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching sentiment for ${symbol}:`, error);
      return { sentiment: 'neutral', score: 0 };
    }
  },
};
