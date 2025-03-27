
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/api/authService';

export function useAuthSync() {
  const syncAuthUser = async (userId: string, forceSync = true) => {
    try {
      const response = await supabase.functions.invoke('sync-auth-user', {
        body: { userId, forceSync }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to sync user');
      }
      
      // Uppdatera localStorage med den senaste informationen
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
      
      if (!response.data.needsProfileSetup) {
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
      } else {
        localStorage.setItem('needs_profile_setup', 'true');
        localStorage.removeItem('profile_setup_complete');
      }
      
      return {
        user: authService.dbUserToUser(response.data.user),
        needsProfileSetup: response.data.needsProfileSetup
      };
    } catch (error) {
      console.error('Error syncing auth user:', error);
      throw error;
    }
  };

  return { syncAuthUser };
}
