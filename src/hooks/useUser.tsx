
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { User } from '@/lib/types';

export function useUser() {
  const queryClient = useQueryClient();
  
  // Hämta inloggad användare
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
  });

  // Hämta en specifik användarprofil med ID, wallet-adress eller användarnamn
  const getUserProfile = (identifier: string, options = {}) => {
    return useQuery({
      queryKey: ['userProfile', identifier],
      queryFn: () => userService.getUserProfile(identifier),
      staleTime: 2 * 60 * 1000, // 2 minuter
      ...options
    });
  };

  // Uppdatera användarens profil
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

  // Följ användare
  const followUserMutation = useMutation({
    mutationFn: (userId: string) => userService.followUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
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
      toast.success("Du följer inte längre denna användare");
    },
    onError: (error: any) => {
      toast.error("Kunde inte sluta följa användaren", {
        description: error.message || "Försök igen senare"
      });
    }
  });

  // Hämta användarens följare
  const getUserFollowers = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userFollowers', userId],
      queryFn: () => userService.getUserFollowers(userId),
      ...options
    });
  };

  // Hämta användare som användaren följer
  const getUserFollowing = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userFollowing', userId],
      queryFn: () => userService.getUserFollowing(userId),
      ...options
    });
  };

  return {
    currentUser,
    isLoadingCurrentUser,
    currentUserError,
    refetchCurrentUser,
    getUserProfile,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    followUser: followUserMutation.mutate,
    isFollowingUser: followUserMutation.isPending,
    unfollowUser: unfollowUserMutation.mutate,
    isUnfollowingUser: unfollowUserMutation.isPending,
    getUserFollowers,
    getUserFollowing
  };
}
