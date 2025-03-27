
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
        // Kontrollera om vi redan har en cachelagrad användare i localStorage
        const cachedUserJson = localStorage.getItem('current_user');
        let cachedUser = null;
        
        if (cachedUserJson) {
          try {
            cachedUser = JSON.parse(cachedUserJson);
          } catch (e) {
            console.error('Invalid cached user data, ignoring:', e);
          }
        }
        
        // Kontrollera Supabase-sessionen
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Ingen session, rensa cachen och returna null
          localStorage.removeItem('current_user');
          localStorage.removeItem('profile_setup_complete');
          localStorage.removeItem('needs_profile_setup');
          return null;
        }
        
        // Om användardata finns i cache och har samma ID som sessionen
        if (cachedUser && cachedUser.id === session.user.id) {
          // Kontrollera om profilen behöver konfigureras baserat på cachelagrad data
          const user = authService.dbUserToUser(cachedUser);
          const isValid = authService.hasCompleteProfile(user);
          
          if (isValid) {
            // Om profilen är komplett, markera detta
            localStorage.setItem('profile_setup_complete', 'true');
            localStorage.removeItem('needs_profile_setup');
            
            // Schemalägger en synkronisering i bakgrunden för att hålla data uppdaterad
            setTimeout(async () => {
              try {
                await supabase.functions.invoke('sync-auth-user', {
                  body: { userId: user.id, forceSync: false }
                });
              } catch (error) {
                console.error('Background sync failed:', error);
              }
            }, 2000);
            
            // Returnera den cachelagrade användaren
            return user;
          }
        }
        
        // Om vi kommer hit behöver vi hämta användaren från backend
        try {
          // Synkronisera med auth via edge-funktionen
          const response = await supabase.functions.invoke('sync-auth-user', {
            body: { userId: session.user.id, forceSync: true }
          });
          
          if (response.data?.success && response.data?.user) {
            // Om synkroniseringen lyckades, uppdatera localStorage
            localStorage.setItem('current_user', JSON.stringify(response.data.user));
            
            if (!response.data.needsProfileSetup) {
              localStorage.setItem('profile_setup_complete', 'true');
              localStorage.removeItem('needs_profile_setup');
            } else {
              localStorage.setItem('needs_profile_setup', 'true');
              localStorage.removeItem('profile_setup_complete');
            }
            
            return authService.dbUserToUser(response.data.user);
          } else {
            throw new Error(response.data?.error || 'Failed to sync user');
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          
          // Som fallback, försök med den vanliga metoden
          const user = await authService.getCurrentUser();
          return user;
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
      localStorage.removeItem('current_user'); // Tvinga ny hämtning
      
      const result = await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No active session');
          }
          
          // Synkronisera via edge-funktionen med force=true
          const response = await supabase.functions.invoke('sync-auth-user', {
            body: { userId: session.user.id, forceSync: true }
          });
          
          if (response.data?.success && response.data?.user) {
            localStorage.setItem('current_user', JSON.stringify(response.data.user));
            
            if (!response.data.needsProfileSetup) {
              localStorage.setItem('profile_setup_complete', 'true');
              localStorage.removeItem('needs_profile_setup');
            } else {
              localStorage.setItem('needs_profile_setup', 'true');
              localStorage.removeItem('profile_setup_complete');
            }
            
            return authService.dbUserToUser(response.data.user);
          } else {
            throw new Error(response.data?.error || 'Failed to sync user');
          }
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
      
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      return updatedUser;
    });
  };

  const resetProfileSetupFlag = () => {
    localStorage.removeItem('profile_setup_complete');
  };

  return {
    currentUser,
    isLoadingCurrentUser,
    currentUserError,
    refetchCurrentUser,
    updateCachedUser,
    resetProfileSetupFlag
  };
}
