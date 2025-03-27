import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { User } from '@/lib/types';

export function useUser() {
  const queryClient = useQueryClient();
  
  const { 
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    refetch: refetchUserQuery // Renamed from refetchCurrentUser to avoid conflict
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 5 * 60 * 1000, // 5 minuter
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching current user:', error);
      }
    }
  });

  const checkWalletUser = (walletAddress: string) => {
    return useQuery({
      queryKey: ['walletUser', walletAddress],
      queryFn: () => userService.getUserByWalletAddress(walletAddress),
      enabled: false,
      retry: 1,
      meta: {
        onError: () => {
          console.log('Ingen användare hittad med denna wallet-adress');
        }
      }
    });
  };

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Partial<User>) => userService.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.walletAddress] });
      
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
      
      localStorage.setItem('current_user', JSON.stringify(data));
      
      toast.success("Profil skapad");
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
    if (localStorage.getItem('profile_setup_complete') === 'true') {
      return false;
    }
    
    if (!currentUser) return true;
    
    const needsSetup = !currentUser.username || 
           currentUser.username.startsWith('user_') || 
           !currentUser.displayName || 
           currentUser.displayName === 'New User';
    
    if (!needsSetup) {
      localStorage.setItem('profile_setup_complete', 'true');
    }
    
    return needsSetup;
  };

  const refetchCurrentUser = async () => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => authService.getCurrentUser()
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
    getUserProfile: () => {}, // These will be implemented below
    checkWalletUser,
    updateProfile: updateProfileMutation.mutate,
    createProfile: createProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingProfile: createProfileMutation.isPending,
    followUser: () => {}, // These will be implemented below
    isFollowingUser: false,
    unfollowUser: () => {},
    isUnfollowingUser: false,
    getUserFollowers: () => {},
    getUserFollowing: () => {},
    getUserTweets: () => {},
    needsProfileSetup,
    updateCachedUser,
    resetProfileSetupFlag
  };
}
