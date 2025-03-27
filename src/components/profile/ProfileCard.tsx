
import { useState } from 'react';
import { Calendar, Copy, ExternalLink, Link, MessageCircle, Shield, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserType, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface ProfileCardProps {
  profile: UserType | UserProfile;
  minimal?: boolean;
  className?: string;
}

const ProfileCard = ({ profile, minimal = false, className }: ProfileCardProps) => {
  const [copied, setCopied] = useState(false);
  
  const { currentUser, followUser, unfollowUser, isFollowingUser, isUnfollowingUser } = useUser();
  
  // Beräkna om den inloggade användaren följer denna profil
  const isCurrentUser = currentUser?.id === profile.id;
  const isFollowing = currentUser?.following?.includes?.(profile.id);
  
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Gick med ${date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`;
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile.walletAddress);
    setCopied(true);
    toast.success("Wallet-adress kopierad");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUser(profile.id);
    } else {
      followUser(profile.id);
    }
  };

  // Minimal version för listningar
  if (minimal) {
    return (
      <div className={cn("flex items-center p-4 rounded-lg hover:bg-secondary/50 transition-colors", className)}>
        <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
          <img 
            src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} 
            alt={profile.displayName} 
            className="h-full w-full object-cover" 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium">{profile.displayName}</h3>
            {profile.verified && (
              <Badge variant="outline" className="ml-1 h-5 px-1 text-xs text-crypto-blue border-crypto-blue/30">
                <Shield className="h-3 w-3 mr-0.5" />
                <span>Verifierad</span>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        
        {!isCurrentUser && (
          <Button 
            size="sm" 
            variant={isFollowing ? "outline" : "default"} 
            className="rounded-full ml-2"
            onClick={handleFollowToggle}
            disabled={isFollowingUser || isUnfollowingUser}
          >
            {isFollowing ? 'Följer' : 'Följ'}
          </Button>
        )}
      </div>
    );
  }

  // Full profilkort
  return (
    <div className={cn("glass-panel overflow-hidden", className)}>
      <div className="h-32 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30"></div>
      
      <div className="px-6 pb-6">
        <div className="flex justify-between items-start mt-[-40px]">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`}
              alt={profile.displayName}
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
                <Button 
                  size="sm" 
                  className={cn(
                    "rounded-full",
                    isFollowing && "bg-transparent text-foreground border border-input hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={handleFollowToggle}
                  disabled={isFollowingUser || isUnfollowingUser}
                >
                  {isFollowing ? (
                    <>
                      <User className="h-4 w-4 mr-1" />
                      Följer
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Följ
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{profile.displayName}</h2>
            {profile.verified && (
              <span className="ml-1 text-crypto-blue">
                <Shield className="h-5 w-5" />
              </span>
            )}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
          
          <div className="mt-3 flex items-center text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
            <Link className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="font-mono">{formatWalletAddress(profile.walletAddress)}</span>
            <button 
              className={cn(
                "ml-1 px-1.5 py-0.5 rounded text-xs transition-colors",
                copied ? "bg-green-500/10 text-green-600" : "text-crypto-blue hover:bg-crypto-blue/10"
              )}
              onClick={copyToClipboard}
            >
              {copied ? 'Kopierad!' : (
                <div className="flex items-center">
                  <Copy className="h-3 w-3 mr-0.5" />
                  Kopiera
                </div>
              )}
            </button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto h-6 px-2" 
              asChild
            >
              <a href={`https://etherscan.io/address/${profile.walletAddress}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="text-xs">Visa</span>
              </a>
            </Button>
          </div>
          
          <p className="mt-3">{profile.bio}</p>
          
          <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatJoinDate(profile.joinedDate)}</span>
            </div>
          </div>
          
          <div className="mt-3 flex space-x-5">
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{profile.following?.length || 0}</span>
              <span className="text-muted-foreground ml-1">Följer</span>
            </div>
            <div className="bg-secondary/50 px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{profile.followers?.length || 0}</span>
              <span className="text-muted-foreground ml-1">Följare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
