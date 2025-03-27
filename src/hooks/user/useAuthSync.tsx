
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/api/authService';
import { toast } from 'sonner';

export function useAuthSync() {
  const syncAuthUser = async (userId: string, forceSync = true) => {
    try {
      const response = await supabase.functions.invoke('sync-auth-user', {
        body: { userId, forceSync }
      });
      
      // Check if response is null or undefined (network error)
      if (!response || !response.data) {
        console.error('Sync auth user failed: No response received');
        toast.error('Kunde inte synkronisera användarprofilen', {
          description: 'Kontrollera din internetanslutning och försök igen.'
        });
        throw new Error('No response received from sync-auth-user function');
      }
      
      // We received a response, but it wasn't successful
      if (!response.data.success) {
        console.error('Sync auth user failed:', response.data.error);
        toast.error('Synkronisering misslyckades', {
          description: response.data.error || 'Ett fel uppstod vid synkronisering av användarprofilen'
        });
        throw new Error(response.data.error || 'Failed to sync user');
      }
      
      // Successful response - update localStorage with the latest information
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
      
      if (!response.data.needsProfileSetup) {
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
      } else {
        localStorage.setItem('needs_profile_setup', 'true');
        localStorage.removeItem('profile_setup_complete');
      }
      
      // Store the auth email separately as well
      if (response.data.user.auth_email) {
        localStorage.setItem('auth_user_email', response.data.user.auth_email);
      }
      
      return {
        user: authService.dbUserToUser(response.data.user),
        needsProfileSetup: response.data.needsProfileSetup
      };
    } catch (error) {
      console.error('Error syncing auth user:', error);
      
      // Try to recover with locally cached data if available
      const cachedUserJson = localStorage.getItem('current_user');
      if (cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          return {
            user: authService.dbUserToUser(cachedUser),
            needsProfileSetup: localStorage.getItem('needs_profile_setup') === 'true'
          };
        } catch (cacheError) {
          console.error('Error parsing cached user data:', cacheError);
        }
      }
      
      throw error;
    }
  };

  const getAuthEmail = () => {
    return localStorage.getItem('auth_user_email') || '';
  };

  return { syncAuthUser, getAuthEmail };
}
