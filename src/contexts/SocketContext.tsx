
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SocketContextType = {
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

type SocketProviderProps = {
  children: ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize any real-time connections here
    const channel = supabase.channel('public:tweets');
    
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'tweets' 
    }, payload => {
      console.log('Real-time change received:', payload);
    }).subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to real-time updates');
        setIsConnected(true);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
