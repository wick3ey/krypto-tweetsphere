
import apiClient from './apiClient';

export const tipService = {
  getTweetTips: async (tweetId: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/tips/tweet/${tweetId}`);
    return response.data;
  },
  
  getTip: async (id: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/tips/${id}`);
    return response.data;
  },
  
  createTip: async (toUserId: string, amount: number, txHash: string) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/tips', { toUserId, amount, txHash });
    return response.data;
  },
  
  getSentTips: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/tips/sent');
    return response.data;
  },
  
  getReceivedTips: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/tips/received');
    return response.data;
  },
  
  updateTipStatus: async (txHash: string, status: 'pending' | 'confirmed' | 'failed') => {
    const response = await apiClient.put(`https://f3oci3ty.xyz/api/tips/${txHash}/status`, { status });
    return response.data;
  }
};
