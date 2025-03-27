
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { User } from '@/lib/types';

// Använd ett vanligt exporterat funktionsnamn för bättre HMR-kompatibilitet
export function useUser() {
  const queryClient = useQueryClient();
  
  // Hämta nuvarande användare
  const { 
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    refetch: refetchCurrentUser
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 5 * 60 * 1000, // 5 minuter
    retry: 1,
    onError: (error: any) => {
      console.error('Error fetching current user:', error);
      // Om vi inte kan hämta användaren, men har en token, kanske vi behöver skapa profilen
      if (localStorage.getItem('jwt_token') && localStorage.getItem('wallet_address')) {
        // Logga problemet för debugging
        console.log('Token finns men kunde inte hämta användaren - kan behöva profiluppsättning');
      }
    }
  });

  // Kontrollera om en användare med given wallet-adress existerar
  const checkWalletUser = (walletAddress: string) => {
    return useQuery({
      queryKey: ['walletUser', walletAddress],
      queryFn: () => userService.getUserByWalletAddress(walletAddress),
      enabled: false, // Körs bara manuellt
      retry: 1,
      onError: () => {
        // Om vi får ett fel här så finns troligen ingen användare med denna adress
        console.log('Ingen användare hittad med denna wallet-adress');
      }
    });
  };

  // Uppdatera användarprofil
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Partial<User>) => userService.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.walletAddress] });
      toast.success("Profil uppdaterad");
    },
    onError: (error: any) => {
      toast.error("Kunde inte uppdatera profilen", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  // Skapa ny användarprofil
  const createProfileMutation = useMutation({
    mutationFn: (profileData: Partial<User>) => userService.setupProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Profil skapad");
      
      // Uppdatera lokal lagring för snabbare åtkomst
      localStorage.setItem('current_user', JSON.stringify(data));
    },
    onError: (error: any) => {
      toast.error("Kunde inte skapa profilen", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  // Följ användare
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

  // Sluta följa användare
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

  // Hämta användarprofil med konsekvent funktion
  const getUserProfile = (identifier: string, options = {}) => {
    return useQuery({
      queryKey: ['userProfile', identifier],
      queryFn: () => userService.getUserProfile(identifier, options),
      staleTime: 2 * 60 * 1000, // 2 minuter
      ...options
    });
  };

  // Hämta en användares följare med paginering
  const getUserFollowers = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowers', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowers(userId, page, limit, sortBy),
    });
  };

  // Hämta användare som användaren följer med paginering
  const getUserFollowing = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowing', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowing(userId, page, limit, sortBy),
    });
  };

  // Hämta användares tweets med alternativ
  const getUserTweets = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userTweets', userId, options],
      queryFn: () => userService.getUserTweets(userId, options),
    });
  };

  // Kontrollera om användaren behöver göra profiluppsättning
  const needsProfileSetup = () => {
    if (!currentUser) return true;
    
    return !currentUser.username || 
           currentUser.username.startsWith('user_') || 
           !currentUser.displayName || 
           currentUser.displayName === 'New User';
  };

  return {
    currentUser,
    isLoadingCurrentUser,
    currentUserError,
    refetchCurrentUser,
    getUserProfile,
    checkWalletUser,
    updateProfile: updateProfileMutation.mutate,
    createProfile: createProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingProfile: createProfileMutation.isPending,
    followUser: followUserMutation.mutate,
    isFollowingUser: followUserMutation.isPending,
    unfollowUser: unfollowUserMutation.mutate,
    isUnfollowingUser: unfollowUserMutation.isPending,
    getUserFollowers,
    getUserFollowing,
    getUserTweets,
    needsProfileSetup
  };
}
