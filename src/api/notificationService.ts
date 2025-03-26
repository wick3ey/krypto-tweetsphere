
import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async (unreadOnly?: boolean) => {
    const response = await apiClient.get('/notifications', { 
      params: unreadOnly ? { unreadOnly: true } : undefined
    });
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/all/read');
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
  
  deleteAllNotifications: async () => {
    const response = await apiClient.delete('/notifications');
    return response.data;
  },
};
