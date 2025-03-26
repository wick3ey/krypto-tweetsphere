
import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async (unreadOnly?: boolean) => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/notifications', { 
      params: unreadOnly ? { unreadOnly: true } : undefined
    });
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/notifications/unread/count');
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await apiClient.put(`https://f3oci3ty.xyz/api/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await apiClient.put('https://f3oci3ty.xyz/api/notifications/all/read');
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`https://f3oci3ty.xyz/api/notifications/${id}`);
    return response.data;
  },
  
  deleteAllNotifications: async () => {
    const response = await apiClient.delete('https://f3oci3ty.xyz/api/notifications');
    return response.data;
  },
};
