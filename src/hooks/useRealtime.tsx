
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type RealtimeOptions = {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  queryKeys?: string[][];
};

/**
 * Hook to subscribe to Supabase real-time updates
 */
export function useRealtime({
  table,
  schema = 'public',
  event = '*',
  filter,
  queryKeys = [[table]]
}: RealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log(`Setting up realtime subscription for ${schema}.${table}`);
    
    // Create subscription configuration
    const channelConfig: any = {
      event,
      schema,
      table
    };
    
    // Add filter if provided
    if (filter) {
      channelConfig.filter = filter;
    }
    
    // Set up the channel
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        channelConfig,
        (payload) => {
          console.log(`Realtime update from ${table}:`, payload);
          
          // Invalidate queries to refresh data
          queryKeys.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      console.log(`Cleaning up realtime subscription for ${schema}.${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, queryClient, queryKeys]);
}

/**
 * Hook to subscribe to Supabase real-time presence updates
 */
export function usePresence(roomId: string, userState: any, onSync?: (state: any) => void) {
  useEffect(() => {
    // Create a channel for presence
    const channel = supabase.channel(roomId);
    
    // Set up presence handlers
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
        if (onSync) onSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Presence join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Presence leave:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Start tracking user state
          await channel.track(userState);
        }
      });
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userState, onSync]);
}

export default useRealtime;
