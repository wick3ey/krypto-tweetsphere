
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { toast } from 'sonner';

export function useFollowActions() {
  const queryClient = useQueryClient();

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

  return {
    followUser: followUserMutation.mutate,
    isFollowingUser: followUserMutation.isPending,
    unfollowUser: unfollowUserMutation.mutate,
    isUnfollowingUser: unfollowUserMutation.isPending
  };
}
