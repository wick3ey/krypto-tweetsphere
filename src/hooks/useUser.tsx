
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { User } from '@/lib/types';

// Use a named export with a consistent return type for better HMR compatibility
export function useUser() {
  const queryClient = useQueryClient();
  
  // Get current user
  const { 
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    refetch: refetchCurrentUser
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Update user profile
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

  // Follow user
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

  // Unfollow user
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

  // Define a consistent shape for getUserProfile function 
  const getUserProfile = (identifier: string, options = {}) => {
    return useQuery({
      queryKey: ['userProfile', identifier],
      queryFn: () => userService.getUserProfile(identifier, options),
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options
    });
  };

  // Get user followers with pagination
  const getUserFollowers = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowers', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowers(userId, page, limit, sortBy),
    });
  };

  // Get users that the user is following with pagination
  const getUserFollowing = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowing', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowing(userId, page, limit, sortBy),
    });
  };

  // Get user tweets with options
  const getUserTweets = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userTweets', userId, options],
      queryFn: () => userService.getUserTweets(userId, options),
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
    getUserFollowing,
    getUserTweets
  };
}
