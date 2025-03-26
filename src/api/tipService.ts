
import apiClient from './apiClient';

export const tipService = {
  getTweetTips: async (tweetId: string) => {
    const response = await apiClient.get(`/tips/tweet/${tweetId}`);
    return response.data;
  },
  
  getTip: async (id: string) => {
    const response = await apiClient.get(`/tips/${id}`);
    return response.data;
  },
  
  createTip: async (toUserId: string, amount: number, txHash: string) => {
    const response = await apiClient.post('/tips', { toUserId, amount, txHash });
    return response.data;
  },
  
  getSentTips: async () => {
    const response = await apiClient.get('/tips/sent');
    return response.data;
  },
  
  getReceivedTips: async () => {
    const response = await apiClient.get('/tips/received');
    return response.data;
  },
  
  updateTipStatus: async (txHash: string, status: 'pending' | 'confirmed' | 'failed') => {
    const response = await apiClient.put(`/tips/${txHash}/status`, { status });
    return response.data;
  }
};
