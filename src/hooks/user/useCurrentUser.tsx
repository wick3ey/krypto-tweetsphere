
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/authService';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';

export function useCurrentUser() {
  const queryClient = useQueryClient();
  
  const { 
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    refetch: refetchUserQuery 
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return null;
        }
        
        // Try to get user data from Supabase
        try {
          const user = await authService.getCurrentUser();
          return user;
        } catch (error) {
          console.error('Error fetching current user:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in getCurrentUser:', error);
        throw error;
      }
    },
    enabled: !!localStorage.getItem('jwt_token') || !!supabase.auth.getSession(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching current user:', error);
      }
    }
  });

  const refetchCurrentUser = async () => {
    try {
      localStorage.removeItem('current_user'); // Force new fetch
      
      const result = await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
          const user = await authService.getCurrentUser();
          return user;
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error refetching current user:', error);
      throw error;
    }
  };

  const updateCachedUser = (userData: Partial<User>) => {
    queryClient.setQueryData(['currentUser'], (oldData: User | undefined) => {
      if (!oldData) return oldData;
      
      const updatedUser = {
        ...oldData,
        ...userData
      };
      
      return updatedUser;
    });
  };

  return {
    currentUser,
    isLoadingCurrentUser,
    currentUserError,
    refetchCurrentUser,
    updateCachedUser
  };
}
