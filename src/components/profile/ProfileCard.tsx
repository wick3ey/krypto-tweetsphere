
import { useState } from 'react';
import { Calendar, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserType, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import FollowButton from './FollowButton';

interface ProfileCardProps {
  profile: UserType | UserProfile;
  minimal?: boolean;
  className?: string;
}

const ProfileCard = ({ profile, minimal = false, className }: ProfileCardProps) => {
  const { currentUser } = useUser();
  
  // Check if the logged-in user follows this profile
  const isCurrentUser = currentUser?.id === profile.id;
  // Fix: Safely check if following includes the profile.id regardless of type
  const isFollowing = Array.isArray(currentUser?.following) 
    ? currentUser?.following.includes(profile.id) 
    : false;
  
  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `Gick med ${date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`;
    } catch (error) {
      console.error('Error formatting join date:', error);
      return 'Datum okänt';
    }
  };

  // Minimal version for listings
  if (minimal) {
    return (
      <div className={cn("flex items-center p-4 rounded-lg hover:bg-secondary/50 transition-colors", className)}>
        <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
          <img 
            src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username || profile.id}`} 
            alt={profile.displayName || "Användare"} 
            className="h-full w-full object-cover" 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium">{profile.displayName || "Namnlös användare"}</h3>
            {profile.verified && (
              <Badge variant="outline" className="ml-1 h-5 px-1 text-xs text-crypto-blue border-crypto-blue/30">
                <Shield className="h-3 w-3 mr-0.5" />
                <span>Verifierad</span>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username || "användarnamn"}</p>
        </div>
        
        {!isCurrentUser && (
          <FollowButton 
            userId={profile.id} 
            initialFollowing={isFollowing} 
            size="sm"
          />
        )}
      </div>
    );
  }

  // Full profile card
  return (
    <div className={cn("glass-panel overflow-hidden", className)}>
      <div className="h-32 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30"></div>
      
      <div className="px-6 pb-6">
        <div className="flex justify-between items-start mt-[-40px]">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username || profile.id}`}
              alt={profile.displayName || "Användare"}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          
          <div className="mt-10 flex space-x-2">
            {!isCurrentUser && (
              <>
                <Button variant="outline" size="sm" className="rounded-full hover:bg-secondary/80">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Meddelande
                </Button>
                
                <FollowButton 
                  userId={profile.id} 
                  initialFollowing={isFollowing} 
                  size="sm"
                />
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{profile.displayName || "Namnlös användare"}</h2>
            {profile.verified && (
              <span className="ml-1 text-crypto-blue">
                <Shield className="h-5 w-5" />
              </span>
            )}
          </div>
          <p className="text-muted-foreground">@{profile.username || "användarnamn"}</p>
          
          <p className="mt-3">{profile.bio || "Ingen biografi tillgänglig"}</p>
          
          {profile.joinedDate && (
            <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatJoinDate(profile.joinedDate)}</span>
              </div>
            </div>
          )}
          
          <div className="mt-3 flex space-x-5">
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{profile.following || 0}</span>
              <span className="text-muted-foreground ml-1">Följer</span>
            </div>
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{profile.followers || 0}</span>
              <span className="text-muted-foreground ml-1">Följare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
