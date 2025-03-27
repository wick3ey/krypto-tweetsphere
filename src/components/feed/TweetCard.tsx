
import { useState } from 'react';
import { Heart, MessageSquare, Repeat2, Share, MoreHorizontal, Calendar, Shield } from 'lucide-react';
import { Tweet } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TweetCardProps {
  tweet: Tweet;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

const TweetCard = ({ tweet, className, style, compact = false }: TweetCardProps) => {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweetCount, setRetweetCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!tweet) {
    console.error("Tweet is undefined");
    return null;
  }
  
  // Make sure we're working with the actual tweet data, not a wrapper
  const actualTweet = tweet;
  
  // Make sure ID is consistent
  if (!actualTweet.id && actualTweet._id) {
    actualTweet.id = actualTweet._id;
  }
  
  // Handle userId object conversion to user if needed
  if (!actualTweet.user && actualTweet.userId) {
    if (typeof actualTweet.userId === 'object') {
      actualTweet.user = {
        id: actualTweet.userId._id || actualTweet.userId.id || 'unknown-id',
        username: actualTweet.userId.username || 'unknown',
        displayName: actualTweet.userId.displayName || actualTweet.userId.username || 'Unknown User',
        avatarUrl: actualTweet.userId.profileImage || actualTweet.userId.avatarUrl || '/placeholder.svg'
      };
    }
  }
  
  if (!actualTweet.user) {
    console.error("Tweet user is undefined:", actualTweet);
    return null;
  }
  
  useState(() => {
    setLikeCount(actualTweet?.likes || actualTweet?.likeCount || 0);
    setRetweetCount(actualTweet?.retweets || actualTweet?.retweetCount || 0);
  });
  
  if (!actualTweet.timestamp && actualTweet.createdAt) {
    actualTweet.timestamp = actualTweet.createdAt;
  }

  const getFormattedDate = () => {
    try {
      if (!actualTweet.timestamp || typeof actualTweet.timestamp !== 'string') {
        console.warn("Invalid or missing timestamp in tweet:", actualTweet);
        return "recently";
      }
      
      const date = new Date(actualTweet.timestamp);
      
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp in tweet:", actualTweet.timestamp);
        return "recently";
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, actualTweet.timestamp);
      return "recently";
    }
  };
  
  const formattedDate = getFormattedDate();
  
  const safeTimestamp = () => {
    try {
      if (!actualTweet.timestamp || typeof actualTweet.timestamp !== 'string') {
        console.warn("Invalid or missing timestamp for display:", actualTweet);
        return new Date().toLocaleString(); // Fallback to current time
      }
      
      const date = new Date(actualTweet.timestamp);
      
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp for display:", actualTweet.timestamp);
        return new Date().toLocaleString(); // Fallback to current time
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp for display:", error);
      return new Date().toLocaleString(); // Fallback to current time
    }
  };
  
  const formatNumber = (num: number): string => {
    if (!num && num !== 0) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
  };
  
  const handleRetweet = () => {
    setRetweeted(!retweeted);
    setRetweetCount(prevCount => retweeted ? prevCount - 1 : prevCount + 1);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const user = actualTweet.user || {
    username: 'unknown',
    displayName: 'Unknown User',
    avatarUrl: '/placeholder.svg',
    verified: false
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
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 ml-2 text-muted-foreground hover:text-crypto-blue"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "glass-card p-4 overflow-hidden transition-all duration-300", 
        liked && "border-crypto-red/20", 
        retweeted && "border-crypto-green/20",
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
          
          <div className="mt-3 flex justify-between text-muted-foreground text-sm max-w-md">
            <button 
              className={cn(
                "flex items-center space-x-1 group transition-colors",
                "hover:text-crypto-blue"
              )}
            >
              <div className="p-1.5 rounded-full group-hover:bg-crypto-blue/10 transition-colors">
                <MessageSquare className="h-4 w-4 transition-colors" />
              </div>
              <span>{formatNumber(actualTweet.comments || 0)}</span>
            </button>
            
            <button 
              className={cn(
                "flex items-center space-x-1 group transition-colors",
                retweeted ? "text-crypto-green" : "hover:text-crypto-green"
              )}
              onClick={handleRetweet}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-colors",
                retweeted ? "bg-crypto-green/10" : "group-hover:bg-crypto-green/10"
              )}>
                <Repeat2 className="h-4 w-4 transition-colors" />
              </div>
              <span>{formatNumber(retweetCount)}</span>
            </button>
            
            <button 
              className={cn(
                "flex items-center space-x-1 group transition-colors",
                liked ? "text-crypto-red" : "hover:text-crypto-red"
              )}
              onClick={handleLike}
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
            
            <button className="flex items-center space-x-1 group hover:text-crypto-blue transition-colors">
              <div className="p-1.5 rounded-full group-hover:bg-crypto-blue/10 transition-colors">
                <Share className="h-4 w-4" />
              </div>
            </button>
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
