
import apiClient from './apiClient';

export const notificationService = {
  getNotifications: async (unreadOnly?: boolean) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping notifications fetch");
        return { notifications: [], total: 0 };
      }
      
      const response = await apiClient.get('/api/notifications', { 
        params: unreadOnly ? { unreadOnly: true } : undefined
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return a default object to prevent UI errors
      return { notifications: [], total: 0 };
    }
  },
  
  getUnreadCount: async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping unread count fetch");
        return { count: 0 };
      }
      
      const response = await apiClient.get('/api/notifications/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0 };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.put(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/api/notifications/all/read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  deleteNotification: async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },
  
  deleteAllNotifications: async () => {
    try {
      const response = await apiClient.delete('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },
};
