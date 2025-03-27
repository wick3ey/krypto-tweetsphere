import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  Verified,
  MoreHorizontal,
  ArrowUpRight,
  HeartIcon,
  MessageSquareIcon,
  RepeatIcon,
  Share2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, Tweet } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { tweetService } from '@/api/tweetService';
import { Link } from 'react-router-dom';

interface EnhancedTweetCardProps {
  tweet: Tweet;
  animated?: boolean;
}

const EnhancedTweetCard = ({ tweet, animated = true }: EnhancedTweetCardProps) => {
  const [isLiked, setIsLiked] = useState(tweet.likedBy?.includes('current-user-id') || false);
  const [likesCount, setLikesCount] = useState(tweet.likes || 0);
  const { currentUser } = useUser();
  const [isRetweeted, setIsRetweeted] = useState(tweet.retweetedBy?.includes('current-user-id') || false);
  const [retweetsCount, setRetweetsCount] = useState(tweet.retweets || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const mockUser: User = {
    id: 'mock-user-id',
    username: 'mock-user',
    displayName: 'Mock User',
    avatarUrl: '',
    bio: '',
    joinedDate: new Date().toISOString(),
    following: [],
    followers: [],
    verified: false
  };
  
  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Du måste vara inloggad för att gilla ett inlägg');
      return;
    }
    
    try {
      if (isLiked) {
        await tweetService.unlikeTweet(tweet.id);
        setIsLiked(false);
        setLikesCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        await tweetService.likeTweet(tweet.id);
        setIsLiked(true);
        setLikesCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Kunde inte gilla/ogilla inlägg');
    }
  };
  
  const handleRetweet = async () => {
    if (!currentUser) {
      toast.error('Du måste vara inloggad för att dela ett inlägg');
      return;
    }
    
    try {
      if (isRetweeted) {
        await tweetService.unretweet(tweet.id);
        setIsRetweeted(false);
        setRetweetsCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        await tweetService.retweet(tweet.id);
        setIsRetweeted(true);
        setRetweetsCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      console.error('Error toggling retweet:', error);
      toast.error('Kunde inte dela/ta bort delning av inlägg');
    }
  };
  
  const handleDelete = async () => {
    if (!currentUser) {
      toast.error('Du måste vara inloggad för att ta bort ett inlägg');
      return;
    }
    
    setIsDeleting(true);
    try {
      await tweetService.deleteTweet(tweet.id);
      toast.success('Inlägg borttaget');
      // Refresh feed after deleting
      window.location.reload();
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Kunde inte ta bort inlägg');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleShare = async (platform: string) => {
    try {
      await tweetService.shareTweet(tweet.id, platform);
    } catch (error) {
      console.error('Error sharing tweet:', error);
      toast.error('Kunde inte dela inlägg');
    }
  };
  
  const renderTweetActions = () => (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" size="icon" className="group">
        <MessageSquareIcon className="h-5 w-5 shrink-0" />
        <span className="sr-only">Kommentera</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("group", isRetweeted && "text-green-500")}
        onClick={handleRetweet}
        disabled={isDeleting}
      >
        <RepeatIcon className="h-5 w-5 shrink-0" />
        <span className="sr-only">Dela</span>
        {retweetsCount > 0 && (
          <span className="ml-1 text-sm text-muted-foreground">{retweetsCount}</span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("group", isLiked && "text-red-500")}
        onClick={handleLike}
        disabled={isDeleting}
      >
        <HeartIcon className="h-5 w-5 shrink-0" />
        <span className="sr-only">Gilla</span>
        {likesCount > 0 && (
          <span className="ml-1 text-sm text-muted-foreground">{likesCount}</span>
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="group">
            <Share2Icon className="h-5 w-5 shrink-0" />
            <span className="sr-only">Dela</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Dela inlägg</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            Kopiera länk
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  const renderDropdownMenu = () => {
    if (tweet.user?.id !== currentUser?.id) {
      return null;
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="absolute right-2 top-2">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Mer</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" forceMount>
          <DropdownMenuLabel>Alternativ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? (
              <>Tar bort...</>
            ) : (
              <>Ta bort inlägg</>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  return (
    <div className={cn(
      "relative border rounded-lg bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md",
      animated ? "hover:scale-[1.01]" : ""
    )}>
      {renderDropdownMenu()}
      
      <div className="flex space-x-3 p-4">
        <Link to={`/profile/${tweet.user?.username || tweet.user?.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={tweet.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.user?.username || tweet.user?.id}`} alt={tweet.user?.displayName} />
            <AvatarFallback>{tweet.user?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/profile/${tweet.user?.username || tweet.user?.id}`}>
                <h4 className="text-sm font-semibold leading-none">{tweet.user?.displayName}</h4>
                <p className="text-sm text-muted-foreground">
                  @{tweet.user?.username}
                  {tweet.user?.verified && (
                    <Verified className="ml-1 inline-block h-4 w-4 text-blue-500" />
                  )}
                </p>
              </Link>
            </div>
            <div className="ml-2 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(tweet.timestamp), { addSuffix: true, locale: enUS })}
            </div>
          </div>
          <p className="text-sm leading-tight">{tweet.content}</p>
          {tweet.attachments && tweet.attachments.length > 0 && (
            <div className="mt-2">
              {tweet.attachments.map((attachment, index) => (
                <img
                  key={index}
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="mt-2 max-h-40 w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {renderTweetActions()}
    </div>
  );
};

export default EnhancedTweetCard;
