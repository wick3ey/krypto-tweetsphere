
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { User } from '@/lib/types';
import { toast } from 'sonner';

export function useProfileActions() {
  const queryClient = useQueryClient();

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

  return {
    updateProfile: updateProfileMutation.mutate,
    createProfile: createProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingProfile: createProfileMutation.isPending
  };
}
