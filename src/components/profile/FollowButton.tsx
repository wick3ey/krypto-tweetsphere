
import { useState, useEffect } from 'react';
import { User, Check, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { userService } from '@/api/userService';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onSuccess?: (isFollowing: boolean) => void;
}

const FollowButton = ({ 
  userId, 
  initialFollowing = false, 
  className, 
  variant = 'default',
  size = 'default',
  onSuccess
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { currentUser, refetchCurrentUser } = useUser();
  
  // Check if this is the user's own profile
  const isOwnProfile = currentUser?.id === userId;
  
  // Check local state when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser?.following && Array.isArray(currentUser.following)) {
      setIsFollowing(currentUser.following.includes(userId));
    }
  }, [currentUser, userId]);
  
  // Don't render if this is the user's own profile
  if (isOwnProfile) {
    return null;
  }
  
  const handleFollowClick = async () => {
    if (!currentUser) {
      toast.error("Du måste vara inloggad för att följa användare", {
        description: "Anslut din wallet först."
      });
      return;
    }
    
    if (isPending) return; // Prevent multiple clicks
    
    setIsPending(true);
    
    try {
      // Optimistic update
      setIsFollowing(!isFollowing);
      
      // Call API
      if (!isFollowing) {
        await userService.followUser(userId);
        toast.success("Du följer nu denna användare");
      } else {
        await userService.unfollowUser(userId);
        toast.success("Du följer inte längre denna användare");
      }
      
      // Refresh current user data to update following list
      refetchCurrentUser();
      
      // Callback if provided
      if (onSuccess) {
        onSuccess(!isFollowing);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(isFollowing);
      console.error("Error toggling follow:", error);
      toast.error(isFollowing ? "Kunde inte sluta följa" : "Kunde inte följa användaren");
    } finally {
      setIsPending(false);
    }
  };
  
  if (isFollowing) {
    return (
      <Button
        variant={variant === 'default' ? 'outline' : variant} 
        size={size}
        className={cn(
          "transition-all rounded-full", 
          isHovering && "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-red-200",
          className
        )}
        onClick={handleFollowClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <>
            {isHovering ? 'Avfölj' : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Följer
              </>
            )}
          </>
        )}
      </Button>
    );
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      onClick={handleFollowClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Följ
        </>
      )}
    </Button>
  );
};

export default FollowButton;
