
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export function useUser() {
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
        // Försök att hämta aktuell användare via den normala metoden
        const user = await authService.getCurrentUser();
        
        // Om användaren finns, synkronisera med vår users-tabell via funktionen
        if (user) {
          try {
            const response = await supabase.functions.invoke('sync-auth-user', {
              body: { userId: user.id }
            });
            
            if (response.data?.success && response.data?.user) {
              // Om synkroniseringen lyckades och vi fick uppdaterad användardata,
              // uppdatera localStorage med den senaste informationen
              localStorage.setItem('current_user', JSON.stringify(response.data.user));
              
              // Bestäm om användaren behöver setup baserat på funktionens svar
              if (!response.data.needsProfileSetup) {
                localStorage.setItem('profile_setup_complete', 'true');
                localStorage.removeItem('needs_profile_setup');
              } else {
                localStorage.setItem('needs_profile_setup', 'true');
                localStorage.removeItem('profile_setup_complete');
              }
              
              // Returnera den uppdaterade användaren
              return authService.dbUserToUser(response.data.user);
            }
          } catch (error) {
            console.error('Failed to sync user:', error);
            // Om synkroniseringen misslyckas, fortsätt med den vanliga användaren
          }
        }
        
        return user;
      } catch (error) {
        console.error('Error in getCurrentUser with sync:', error);
        throw error;
      }
    },
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching current user:', error);
      }
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Partial<User>) => userService.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.username] });
      
      localStorage.setItem('current_user', JSON.stringify(data));
      
      toast.success("Profil uppdaterad");
    },
    onError: (error: any) => {
      toast.error("Kunde inte uppdatera profilen", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: (profileData: Partial<User>) => userService.setupProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      localStorage.setItem('profile_setup_complete', 'true');
      localStorage.removeItem('needs_profile_setup');
      localStorage.setItem('current_user', JSON.stringify(data));
      
      toast.success("Profil skapad");
      
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    },
    onError: (error: any) => {
      toast.error("Kunde inte skapa profilen", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  const followUserMutation = useMutation({
    mutationFn: (userId: string) => userService.followUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Du följer nu denna användare");
    },
    onError: (error: any) => {
      toast.error("Kunde inte följa användaren", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  const unfollowUserMutation = useMutation({
    mutationFn: (userId: string) => userService.unfollowUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Du följer inte längre denna användare");
    },
    onError: (error: any) => {
      toast.error("Kunde inte sluta följa användaren", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  const getUserProfile = (identifier: string, options = {}) => {
    return useQuery({
      queryKey: ['userProfile', identifier],
      queryFn: () => userService.getUserProfile(identifier, options),
      staleTime: 2 * 60 * 1000,
      ...options
    });
  };

  const getUserFollowers = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowers', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowers(userId, page, limit, sortBy),
    });
  };

  const getUserFollowing = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowing', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowing(userId, page, limit, sortBy),
    });
  };

  const getUserTweets = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userTweets', userId, options],
      queryFn: () => userService.getUserTweets(userId, options),
    });
  };

  const needsProfileSetup = () => {
    console.log('Checking if profile setup is needed...');
    
    // Om vi har en explicit flagga i localStorage att profilen är komplett
    if (localStorage.getItem('profile_setup_complete') === 'true') {
      console.log('Profile setup complete flag is set to true');
      return false;
    }
    
    // Om vi har en explicit flagga att profilen behöver setup
    if (localStorage.getItem('needs_profile_setup') === 'true') {
      // Dubbelkontrollera mot faktiska data om de finns
      if (currentUser) {
        const hasValidProfile = isValidProfile(currentUser);
        if (hasValidProfile) {
          console.log('User has valid profile despite needs_profile_setup flag');
          localStorage.setItem('profile_setup_complete', 'true');
          localStorage.removeItem('needs_profile_setup');
          return false;
        }
      }
      console.log('Profile setup needed flag is set');
      return true;
    }
    
    // Om vi inte har någon användare kan vi inte avgöra
    if (!currentUser) {
      console.log('No current user, cannot determine if profile setup is needed');
      return false;
    }
    
    // Kontrollera de faktiska användardata
    const needsSetup = !isValidProfile(currentUser);
    
    if (needsSetup) {
      console.log('User profile is incomplete, needs setup');
      localStorage.setItem('needs_profile_setup', 'true');
      localStorage.removeItem('profile_setup_complete');
    } else {
      console.log('User has a complete profile, no setup needed');
      localStorage.setItem('profile_setup_complete', 'true');
      localStorage.removeItem('needs_profile_setup');
    }
    
    return needsSetup;
  };

  const isValidProfile = (user: User) => {
    if (!user) return false;
    
    const isValid = !!user.username && 
           !user.username.startsWith('user_') && 
           !!user.displayName && 
           user.displayName !== 'New User';
           
    console.log('Profile completeness check:', {
      username: user.username,
      displayName: user.displayName,
      isComplete: isValid
    });
    
    return isValid;
  };

  const refetchCurrentUser = async () => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
          const user = await authService.getCurrentUser();
          
          // Synkronisera användaren via edge-funktionen
          try {
            const response = await supabase.functions.invoke('sync-auth-user', {
              body: { userId: user.id }
            });
            
            if (response.data?.success && response.data?.user) {
              // Uppdatera localStorage
              localStorage.setItem('current_user', JSON.stringify(response.data.user));
              
              // Sätt rätt flaggor baserat på användarens profil
              if (!response.data.needsProfileSetup) {
                localStorage.setItem('profile_setup_complete', 'true');
                localStorage.removeItem('needs_profile_setup');
              } else {
                localStorage.setItem('needs_profile_setup', 'true');
                localStorage.removeItem('profile_setup_complete');
              }
              
              return authService.dbUserToUser(response.data.user);
            }
          } catch (syncError) {
            console.error('Failed to sync user during refetch:', syncError);
          }
          
          return user;
        }
      });
      
      localStorage.setItem('current_user', JSON.stringify(result));
      
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
    getUserProfile: (identifier: string, options = {}) => {
      return userService.getUserProfile(identifier, options);
    },
    updateProfile: updateProfileMutation.mutate,
    createProfile: createProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingProfile: createProfileMutation.isPending,
    followUser: followUserMutation.mutate,
    isFollowingUser: followUserMutation.isPending,
    unfollowUser: unfollowUserMutation.mutate,
    isUnfollowingUser: unfollowUserMutation.isPending,
    getUserFollowers: (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
      return userService.getUserFollowers(userId, page, limit, sortBy);
    },
    getUserFollowing: (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
      return userService.getUserFollowing(userId, page, limit, sortBy);
    },
    getUserTweets: (userId: string, options = {}) => {
      return userService.getUserTweets(userId, options);
    },
    needsProfileSetup,
    isValidProfile,
    updateCachedUser,
    resetProfileSetupFlag,
    
    // Ny funktion för att explicit synkronisera en användare
    syncAuthUser: async (userId: string) => {
      try {
        const response = await supabase.functions.invoke('sync-auth-user', {
          body: { userId }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to sync user');
        }
        
        return {
          user: authService.dbUserToUser(response.data.user),
          needsProfileSetup: response.data.needsProfileSetup
        };
      } catch (error) {
        console.error('Error syncing auth user:', error);
        throw error;
      }
    }
  };
}
