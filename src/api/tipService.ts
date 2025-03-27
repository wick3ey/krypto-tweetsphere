
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const tipService = {
  getTweetTips: async (tweetId: string) => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*, from_user:from_user_id(*), to_user:to_user_id(*)')
        .eq('tweet_id', tweetId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tweet tips:', error);
      return [];
    }
  },
  
  getTip: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*, from_user:from_user_id(*), to_user:to_user_id(*)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tip:', error);
      return null;
    }
  },
  
  createTip: async (toUserId: string, amount: number, txHash: string, tweetId?: string) => {
    try {
      // Få aktuell användares ID från autentiseringssessionen
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      const { data, error } = await supabase
        .from('tips')
        .insert({
          from_user_id: currentUserId,
          to_user_id: toUserId,
          amount: amount,
          tx_hash: txHash,
          tweet_id: tweetId,
          status: 'pending'
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      // Skapa en notifikation för mottagaren
      await supabase
        .from('notifications')
        .insert({
          user_id: toUserId,
          type: 'tip_received',
          content: `Du har fått en dricks på ${amount} tokens`,
          related_id: data.id
        });
        
      return data;
    } catch (error) {
      console.error('Error creating tip:', error);
      toast.error('Kunde inte skicka dricks');
      throw error;
    }
  },
  
  getSentTips: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('tips')
        .select('*, to_user:to_user_id(*)')
        .eq('from_user_id', currentUserId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sent tips:', error);
      return [];
    }
  },
  
  getReceivedTips: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('tips')
        .select('*, from_user:from_user_id(*)')
        .eq('to_user_id', currentUserId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching received tips:', error);
      return [];
    }
  },
  
  updateTipStatus: async (txHash: string, status: 'pending' | 'confirmed' | 'failed') => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .update({ status })
        .eq('tx_hash', txHash)
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tip status:', error);
      throw error;
    }
  }
};
