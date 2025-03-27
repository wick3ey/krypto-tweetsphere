
import { useState } from 'react';
import { Calendar, MoreHorizontal, Shield } from 'lucide-react';
import { Tweet, User } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TweetActions from './TweetActions';

interface TweetCardProps {
  tweet: Tweet;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  onReply?: () => void;
}

const TweetCard = ({ tweet, className, style, compact = false, onReply }: TweetCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!tweet) {
    console.error("Tweet is undefined");
    return null;
  }
  
  // Make sure we're working with the actual tweet data, not a wrapper
  const actualTweet = tweet;
  
  // Make sure ID is consistent
  const tweetId = actualTweet.id || actualTweet._id || '';
  
  // Create a normalized user object from the tweet data
  let tweetUser: User | null = null;
  
  if (actualTweet.user) {
    // If user object already exists, use it
    tweetUser = actualTweet.user;
  } else if (actualTweet.userId) {
    // If userId is an object, convert it to user
    if (typeof actualTweet.userId === 'object') {
      const userIdObj = actualTweet.userId as any;
      // Create a partial user that meets the minimum requirements
      tweetUser = {
        id: userIdObj._id || userIdObj.id || 'unknown-id',
        username: userIdObj.username || 'unknown',
        displayName: userIdObj.displayName || userIdObj.username || 'Unknown User',
        avatarUrl: userIdObj.profileImage || userIdObj.avatarUrl || '/placeholder.svg',
        // Add required User properties with defaults
        walletAddress: userIdObj.walletAddress || '',
        bio: userIdObj.bio || '',
        joinedDate: userIdObj.joinedDate || new Date().toISOString(),
        following: userIdObj.following || 0,
        followers: userIdObj.followers || 0,
        verified: userIdObj.verified || false
      };
    }
  }
  
  if (!tweetUser) {
    console.error("Tweet user is undefined:", actualTweet);
    return null;
  }
  
  // Handle various timestamp formats
  const tweetTimestamp = actualTweet.timestamp || actualTweet.createdAt || '';

  const getFormattedDate = () => {
    try {
      if (!tweetTimestamp || typeof tweetTimestamp !== 'string') {
        console.warn("Invalid or missing timestamp in tweet:", actualTweet);
        return "recently";
      }
      
      const date = new Date(tweetTimestamp);
      
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp in tweet:", tweetTimestamp);
        return "recently";
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, tweetTimestamp);
      return "recently";
    }
  };
  
  const formattedDate = getFormattedDate();
  
  const safeTimestamp = () => {
    try {
      if (!tweetTimestamp || typeof tweetTimestamp !== 'string') {
        console.warn("Invalid or missing timestamp for display:", actualTweet);
        return new Date().toLocaleString(); // Fallback to current time
      }
      
      const date = new Date(tweetTimestamp);
      
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp for display:", tweetTimestamp);
        return new Date().toLocaleString(); // Fallback to current time
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp for display:", error);
      return new Date().toLocaleString(); // Fallback to current time
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const user = tweetUser || {
    username: 'unknown',
    displayName: 'Unknown User',
    avatarUrl: '/placeholder.svg',
    verified: false,
    walletAddress: '',
    bio: '',
    joinedDate: new Date().toISOString(),
    following: 0,
    followers: 0
  };

  if (compact) {
    return (
      <div 
        className={cn("glass-card p-3 hover:shadow-md transition-all", className)}
        style={style}
      >
        <div className="flex items-center">
          <Link to={`/profile/${user.username}`} className="flex-shrink-0">
            <img
              src={user.avatarUrl || '/placeholder.svg'}
              alt={user.displayName || 'User'}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
          </Link>
          
          <div className="ml-2 flex-1 min-w-0">
            <div className="flex items-center">
              <Link to={`/profile/${user.username}`} className="font-medium text-sm truncate">
                {user.displayName || 'Unknown User'}
              </Link>
              <span className="mx-1 text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <p className="text-sm line-clamp-1">{actualTweet.content || ''}</p>
            
            <TweetActions 
              tweet={actualTweet} 
              onReply={onReply} 
              compact={true} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "glass-card p-4 overflow-hidden transition-all duration-300", 
        className
      )}
      style={style}
    >
      <div className="flex space-x-3">
        <Link to={`/profile/${user.username}`} className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-border">
            <img
              src={user.avatarUrl || '/placeholder.svg'}
              alt={user.displayName || 'User'}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
            />
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <Link to={`/profile/${user.username}`} className="font-semibold hover:underline truncate">
                {user.displayName || 'Unknown User'}
              </Link>
              {user.verified && (
                <Badge variant="outline" className="ml-1 h-5 px-1 text-xs text-crypto-blue border-crypto-blue/30">
                  <Shield className="h-3 w-3 mr-0.5" />
                </Badge>
              )}
              <span className="mx-1 text-muted-foreground flex-shrink-0">·</span>
              <span className="text-muted-foreground text-sm truncate hover:underline cursor-pointer flex-shrink-0">
                @{user.username || 'unknown'}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground hidden md:inline-block">
                <time dateTime={actualTweet.timestamp || ''} title={safeTimestamp()}>
                  {formattedDate}
                </time>
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <p className={cn(
            "mt-1 text-balance transition-all duration-300",
            isExpanded ? "line-clamp-none" : "line-clamp-3"
          )}>
            {actualTweet.content || ''}
          </p>
          
          {(actualTweet.content?.length || 0) > 150 && !isExpanded && (
            <button 
              className="text-xs text-crypto-blue hover:underline mt-1"
              onClick={toggleExpand}
            >
              Show more
            </button>
          )}
          
          {isExpanded && (
            <button 
              className="text-xs text-crypto-blue hover:underline mt-1"
              onClick={toggleExpand}
            >
              Show less
            </button>
          )}
          
          {actualTweet.hashtags && actualTweet.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {actualTweet.hashtags.map((tag) => (
                <Link 
                  key={tag} 
                  to={`/hashtag/${tag}`} 
                  className="text-crypto-blue hover:bg-crypto-blue/10 px-2 py-0.5 rounded-full text-sm transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-3 max-w-md">
            <TweetActions 
              tweet={actualTweet} 
              onReply={onReply} 
            />
          </div>
          
          <div className="mt-2 md:hidden text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline-block align-text-bottom mr-1" />
            <time dateTime={actualTweet.timestamp || ''}>
              {safeTimestamp()}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
