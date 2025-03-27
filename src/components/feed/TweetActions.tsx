
import { useState, useEffect } from 'react';
import { Heart, MessageSquare, Repeat2, Share, FileCheck, Copy } from 'lucide-react';
import { Tweet } from '@/lib/types';
import { cn } from '@/lib/utils';
import { tweetService } from '@/api/tweetService';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TweetActionsProps {
  tweet: Tweet;
  onReply?: () => void;
  compact?: boolean;
  className?: string;
}

const TweetActions = ({ tweet, onReply, compact, className }: TweetActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likes || tweet.likeCount || 0);
  const [retweetCount, setRetweetCount] = useState(tweet.retweets || tweet.retweetCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isRetweeting, setIsRetweeting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const { currentUser } = useUser();
  
  useEffect(() => {
    // Update counts if tweet prop changes
    setLikeCount(tweet.likes || tweet.likeCount || 0);
    setRetweetCount(tweet.retweets || tweet.retweetCount || 0);
    
    // Check if user has already liked/retweeted this tweet
    if (currentUser && tweet.likedBy && Array.isArray(tweet.likedBy)) {
      setLiked(tweet.likedBy.includes(currentUser.id));
    }
    
    if (currentUser && tweet.retweetedBy && Array.isArray(tweet.retweetedBy)) {
      setRetweeted(tweet.retweetedBy.includes(currentUser.id));
    }
  }, [tweet, currentUser]);
  
  const formatNumber = (num: number): string => {
    if (!num && num !== 0) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Du måste vara inloggad för att gilla tweets", {
        description: "Anslut din wallet först."
      });
      return;
    }
    
    if (isLiking) return; // Prevent double-clicks
    
    try {
      setIsLiking(true);
      
      // Optimistically update UI
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(prevCount => newLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // Call API
      if (newLiked) {
        await tweetService.likeTweet(tweet.id);
      } else {
        await tweetService.unlikeTweet(tweet.id);
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling like:", error);
      setLiked(!liked);
      setLikeCount(prevCount => liked ? prevCount + 1 : Math.max(0, prevCount - 1));
      toast.error("Kunde inte uppdatera gillastatus");
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleRetweet = async () => {
    if (!currentUser) {
      toast.error("Du måste vara inloggad för att retweeta", {
        description: "Anslut din wallet först."
      });
      return;
    }
    
    if (isRetweeting) return; // Prevent double-clicks
    
    try {
      setIsRetweeting(true);
      
      // Optimistically update UI
      const newRetweeted = !retweeted;
      setRetweeted(newRetweeted);
      setRetweetCount(prevCount => newRetweeted ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // Call API
      if (newRetweeted) {
        await tweetService.retweet(tweet.id);
        toast.success("Tweet delad med dina följare");
      } else {
        await tweetService.unretweet(tweet.id);
        toast.success("Retweet borttagen");
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling retweet:", error);
      setRetweeted(!retweeted);
      setRetweetCount(prevCount => retweeted ? prevCount + 1 : Math.max(0, prevCount - 1));
      toast.error("Kunde inte uppdatera retweetstatus");
    } finally {
      setIsRetweeting(false);
    }
  };
  
  const handleShare = async (platform: string) => {
    if (isSharing) return; // Prevent double-clicks
    
    try {
      setIsSharing(true);
      await tweetService.shareTweet(tweet.id, platform);
    } catch (error) {
      console.error("Error sharing tweet:", error);
      toast.error("Kunde inte dela tweet");
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleReplyClick = () => {
    if (!currentUser) {
      toast.error("Du måste vara inloggad för att svara", {
        description: "Anslut din wallet först."
      });
      return;
    }
    
    if (onReply) onReply();
  };
  
  if (compact) {
    return (
      <div className={cn("flex text-muted-foreground mt-1 text-xs", className)}>
        <button 
          className={cn(
            "flex items-center mr-4 hover:text-foreground transition-colors",
            liked && "text-crypto-red"
          )}
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={cn("h-3 w-3 mr-1", liked && "fill-crypto-red")} />
          <span>{formatNumber(likeCount)}</span>
        </button>
        
        <button 
          className="flex items-center mr-4 hover:text-foreground transition-colors"
          onClick={handleReplyClick}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          <span>{formatNumber(tweet.comments || 0)}</span>
        </button>
        
        <button 
          className={cn(
            "flex items-center hover:text-foreground transition-colors",
            retweeted && "text-crypto-green"
          )}
          onClick={handleRetweet}
          disabled={isRetweeting}
        >
          <Repeat2 className={cn("h-3 w-3 mr-1", retweeted && "fill-crypto-green")} />
          <span>{formatNumber(retweetCount)}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn("flex justify-between text-muted-foreground", className)}>
      <button 
        className={cn(
          "flex items-center space-x-1 group transition-colors",
          "hover:text-crypto-blue"
        )}
        onClick={handleReplyClick}
      >
        <div className="p-1.5 rounded-full group-hover:bg-crypto-blue/10 transition-colors">
          <MessageSquare className="h-4 w-4 transition-colors" />
        </div>
        <span>{formatNumber(tweet.comments || 0)}</span>
      </button>
      
      <button 
        className={cn(
          "flex items-center space-x-1 group transition-colors",
          retweeted ? "text-crypto-green" : "hover:text-crypto-green"
        )}
        onClick={handleRetweet}
        disabled={isRetweeting}
      >
        <div className={cn(
          "p-1.5 rounded-full transition-colors",
          retweeted ? "bg-crypto-green/10" : "group-hover:bg-crypto-green/10"
        )}>
          <Repeat2 className={cn("h-4 w-4 transition-colors", retweeted && "fill-crypto-green")} />
        </div>
        <span>{formatNumber(retweetCount)}</span>
      </button>
      
      <button 
        className={cn(
          "flex items-center space-x-1 group transition-colors",
          liked ? "text-crypto-red" : "hover:text-crypto-red"
        )}
        onClick={handleLike}
        disabled={isLiking}
      >
        <div className={cn(
          "p-1.5 rounded-full transition-colors relative",
          liked ? "bg-crypto-red/10" : "group-hover:bg-crypto-red/10"
        )}>
          <Heart 
            className={cn(
              "h-4 w-4 transition-transform duration-300", 
              liked && "scale-110 fill-crypto-red"
            )} 
          />
          {liked && (
            <span className="animate-ping absolute inset-0 h-full w-full rounded-full bg-crypto-red opacity-30" />
          )}
        </div>
        <span>{formatNumber(likeCount)}</span>
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full p-1.5 hover:bg-crypto-blue/10 hover:text-crypto-blue transition-colors"
          >
            <Share className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="h-4 w-4 mr-2 fill-current"
            >
              <path d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.3 4.3 0 0 0 1.9-2.4c-.8.5-1.8.9-2.7 1a4.2 4.2 0 0 0-7.3 3.9A12 12 0 0 1 3 4.9a4.2 4.2 0 0 0 1.3 5.7c-.7 0-1.4-.2-2-.5 0 2 1.4 3.8 3.3 4.2a4.3 4.3 0 0 1-2 .1 4.2 4.2 0 0 0 4 3 8.5 8.5 0 0 1-5.3 1.8c-.3 0-.7 0-1-.1a12 12 0 0 0 6.5 1.9c7.8 0 12-6.5 12-12.1v-.5c.8-.6 1.5-1.4 2-2.2z" />
            </svg>
            Dela på Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="h-4 w-4 mr-2 fill-current"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Dela på Facebook
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            <Copy className="h-4 w-4 mr-2" />
            Kopiera länk
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TweetActions;
