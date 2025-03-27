
import { supabase } from '@/integrations/supabase/client';
import { dbUserToUser } from '@/lib/db-types';

export const messageService = {
  sendMessage: async (receiverId: string, content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Skapa en notifikation för mottagaren
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          type: 'new_message',
          content: 'Du har fått ett nytt meddelande',
          related_id: data.id
        });
        
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  getConversations: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return [];
      }
      
      // Hämta alla konversationer där användaren är avsändare
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read,
          receiver_id,
          sender_id,
          users:receiver_id(id, username, display_name, wallet_address, avatar_url, bio, joined_date, following, followers, verified)
        `)
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });
        
      if (sentError) throw sentError;
      
      // Hämta alla konversationer där användaren är mottagare
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read,
          receiver_id,
          sender_id,
          users:sender_id(id, username, display_name, wallet_address, avatar_url, bio, joined_date, following, followers, verified)
        `)
        .eq('receiver_id', currentUserId)
        .order('created_at', { ascending: false });
        
      if (receivedError) throw receivedError;
      
      // Kombinera meddelanden och strukturera dem i konversationer
      const conversations = new Map();
      
      // Lägg till skickade meddelanden
      if (sentMessages && sentMessages.length > 0) {
        sentMessages.forEach(message => {
          const otherUser = message.users;
          
          if (!otherUser) return;
          
          const userId = otherUser.id;
          
          if (!userId) return; // Skip if user id is undefined
          
          if (!conversations.has(userId)) {
            conversations.set(userId, {
              user: dbUserToUser(otherUser),
              lastMessage: {
                id: message.id,
                content: message.content,
                created_at: message.created_at,
                read: message.read,
                receiver_id: message.receiver_id,
                sender_id: message.sender_id
              },
              unreadCount: 0
            });
          } else if (new Date(message.created_at) > new Date(conversations.get(userId).lastMessage.created_at)) {
            const conv = conversations.get(userId);
            conv.lastMessage = {
              id: message.id,
              content: message.content,
              created_at: message.created_at,
              read: message.read,
              receiver_id: message.receiver_id,
              sender_id: message.sender_id
            };
          }
        });
      }
      
      // Lägg till mottagna meddelanden
      if (receivedMessages && receivedMessages.length > 0) {
        receivedMessages.forEach(message => {
          const otherUser = message.users;
          
          if (!otherUser) return;
          
          const userId = otherUser.id;
          
          if (!userId) return; // Skip if user id is undefined
          
          if (!conversations.has(userId)) {
            conversations.set(userId, {
              user: dbUserToUser(otherUser),
              lastMessage: {
                id: message.id,
                content: message.content,
                created_at: message.created_at,
                read: message.read,
                receiver_id: message.receiver_id,
                sender_id: message.sender_id
              },
              unreadCount: message.read ? 0 : 1
            });
          } else {
            const conv = conversations.get(userId);
            if (new Date(message.created_at) > new Date(conv.lastMessage.created_at)) {
              conv.lastMessage = {
                id: message.id,
                content: message.content,
                created_at: message.created_at,
                read: message.read,
                receiver_id: message.receiver_id,
                sender_id: message.sender_id
              };
            }
            if (!message.read) {
              conv.unreadCount += 1;
            }
          }
        });
      }
      
      return Array.from(conversations.values());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },
  
  getUnreadCount: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return { count: 0 };
      }
      
      const { data, error } = await supabase.rpc('get_unread_messages_count', {
        user_id: currentUserId
      });
      
      if (error) throw error;
      return { count: data || 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0 };
    }
  },
  
  getConversation: async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return { messages: [] };
      }
      
      // Hämta meddelanden mellan nuvarande användare och den angivna användaren
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Markera alla meddelanden som lästa om de är till användaren
      const unreadIds = data
        ? data.filter(msg => msg.receiver_id === currentUserId && !msg.read)
            .map(msg => msg.id)
        : [];
        
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
      
      return { messages: data || [] };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { messages: [] };
    }
  },
  
  markAsRead: async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },
  
  deleteMessage: async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUserId) // Säkerställ att användaren är avsändaren
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};
