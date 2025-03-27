
import { supabase } from '@/integrations/supabase/client';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      
      return {
        notifications: data || [],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  /**
   * Get count of unread notifications
   */
  async getUnreadCount() {
    try {
      const { data, error } = await supabase.rpc('get_unread_notifications_count');
      
      if (error) throw error;
      
      return { count: data || 0 };
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return { count: 0 };
    }
  },
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};
