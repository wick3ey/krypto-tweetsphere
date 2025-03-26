
import apiClient from './apiClient';

export const messageService = {
  sendMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/messages', { receiverId, content });
    return response.data;
  },
  
  getConversations: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/messages');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/messages/unread/count');
    return response.data;
  },
  
  getConversation: async (userId: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/messages/${userId}`);
    return response.data;
  },
  
  markAsRead: async (messageId: string) => {
    const response = await apiClient.put(`https://f3oci3ty.xyz/api/messages/${messageId}/read`);
    return response.data;
  },
  
  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete(`https://f3oci3ty.xyz/api/messages/${messageId}`);
    return response.data;
  },
};
