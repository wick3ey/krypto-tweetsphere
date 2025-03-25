
import { Calendar, Link, MapPin, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ProfileCardProps {
  profile: UserProfile;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="glass-panel overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30"></div>
      
      <div className="px-6 pb-6">
        <div className="flex justify-between items-start mt-[-40px]">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white bg-white">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          </div>
          
          <div className="mt-10 flex space-x-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button size="sm" className="rounded-full">
              <UserPlus className="h-4 w-4 mr-1" />
              Follow
            </Button>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{profile.displayName}</h2>
            {profile.verified && (
              <span className="ml-1 text-crypto-blue">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
          
          <div className="mt-3 flex items-center text-sm text-muted-foreground">
            <Link className="h-4 w-4 mr-1" />
            <span className="font-mono">{formatWalletAddress(profile.walletAddress)}</span>
            <button className="ml-1 text-crypto-blue text-xs">Copy</button>
          </div>
          
          <p className="mt-3">{profile.bio}</p>
          
          <div className="mt-3 flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatJoinDate(profile.joinedDate)}</span>
            </div>
          </div>
          
          <div className="mt-3 flex space-x-5">
            <span>
              <span className="font-semibold">{profile.following.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </span>
            <span>
              <span className="font-semibold">{profile.followers.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
