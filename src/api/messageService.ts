
import apiClient from './apiClient';

export const messageService = {
  sendMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('/messages', { receiverId, content });
    return response.data;
  },
  
  getConversations: async () => {
    const response = await apiClient.get('/messages');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread/count');
    return response.data;
  },
  
  getConversation: async (userId: string) => {
    const response = await apiClient.get(`/messages/${userId}`);
    return response.data;
  },
  
  markAsRead: async (messageId: string) => {
    const response = await apiClient.put(`/messages/${messageId}/read`);
    return response.data;
  },
  
  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
