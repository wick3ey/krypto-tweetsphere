
import { useCurrentUser } from './user/useCurrentUser';
import { useUserProfile } from './user/useUserProfile';
import { useProfileActions } from './user/useProfileActions';
import { useFollowActions } from './user/useFollowActions';

export function useUser() {
  const currentUserHook = useCurrentUser();
  const userProfileHook = useUserProfile();
  const profileActionsHook = useProfileActions();
  const followActionsHook = useFollowActions();

  return {
    // Current user data and actions
    ...currentUserHook,
    
    // User profile queries
    ...userProfileHook,
    
    // Profile creation and update
    ...profileActionsHook,
    
    // Follow/unfollow actions
    ...followActionsHook
  };
}
