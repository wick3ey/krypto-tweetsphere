
import { supabase } from '@/integrations/supabase/client';

export const notificationService = {
  getNotifications: async (unreadOnly?: boolean) => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över notifikationshämtning");
        return { notifications: [], total: 0 };
      }
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });
        
      if (unreadOnly) {
        query = query.eq('read', false);
      }
      
      const { data, error, count } = await query.limit(50);
      
      if (error) throw error;
      
      return { notifications: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Returnera ett standardobjekt för att förhindra UI-fel
      return { notifications: [], total: 0 };
    }
  },
  
  getUnreadCount: async () => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över olästa räkningshämtningar");
        return { count: 0 };
      }
      
      const { data, error } = await supabase.rpc('get_unread_notifications_count', {
        user_id: currentUserId
      });
      
      if (error) throw error;
      return { count: data || 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0 };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  deleteNotification: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },
  
  deleteAllNotifications: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUserId)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
};
