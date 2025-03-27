
import { useState, useEffect } from 'react';
import { Heart, MessageSquare, Repeat2, Share, MoreHorizontal, Calendar, Shield, Zap } from 'lucide-react';
import { Tweet } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnhancedTweetCardProps {
  tweet: Tweet;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  animated?: boolean;
}

const EnhancedTweetCard = ({ 
  tweet, 
  className, 
  style, 
  compact = false, 
  animated = true 
}: EnhancedTweetCardProps) => {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likes);
  const [retweetCount, setRetweetCount] = useState(tweet.retweets);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(!animated);
  const [isHovered, setIsHovered] = useState(false);
  
  // Add null check to ensure tweet and tweet.user exist
  if (!tweet || !tweet.user) {
    console.error("Tweet or tweet.user is undefined:", tweet);
    return null;
  }

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, Math.random() * 500);
      
      return () => clearTimeout(timer);
    }
  }, [animated]);

  // Safe date formatting with error handling
  const getFormattedDate = () => {
    try {
      const date = new Date(tweet.timestamp);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp in tweet:", tweet.timestamp);
        return "recently";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, tweet.timestamp);
      return "recently";
    }
  };
  
  const formattedDate = getFormattedDate();
  
  const formatNumber = (num: number): string => {
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

  // Safe timestamp for display
  const safeTimestamp = () => {
    try {
      const date = new Date(tweet.timestamp);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleString(); // Fallback to current time
      }
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return new Date().toLocaleString(); // Fallback to current time
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "crypto-card p-3 hover:shadow-md transition-all duration-300",
          !isVisible && "opacity-0 translate-y-4",
          isVisible && "opacity-100 translate-y-0",
          className
        )}
        style={{
          ...style,
          transitionDelay: animated ? `${Math.random() * 0.3}s` : '0s',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center">
          <Link to={`/profile/${tweet.user.username}`} className="flex-shrink-0">
            <div className={cn(
              "h-8 w-8 rounded-full overflow-hidden border border-border/50",
              "transition-transform duration-300",
              isHovered && "scale-110"
            )}>
              <img
                src={tweet.user.avatarUrl}
                alt={tweet.user.displayName}
                className="h-full w-full object-cover"
              />
            </div>
          </Link>
          
          <div className="ml-2 flex-1 min-w-0">
            <div className="flex items-center">
              <Link to={`/profile/${tweet.user.username}`} className="font-medium text-sm truncate">
                {tweet.user.displayName}
              </Link>
              <span className="mx-1 text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <p className="text-sm line-clamp-1">{tweet.content}</p>
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
        "crypto-card p-4 overflow-hidden transition-all duration-300", 
        liked && "border-crypto-red/20", 
        retweeted && "border-crypto-green/20",
        !isVisible && "opacity-0 translate-y-4",
        isVisible && "opacity-100 translate-y-0",
        className
      )}
      style={{
        ...style,
        transitionDelay: animated ? `${Math.random() * 0.3}s` : '0s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex space-x-3">
        <Link to={`/profile/${tweet.user.username}`} className="flex-shrink-0">
          <div className={cn(
            "h-10 w-10 rounded-full overflow-hidden border border-border/50",
            "transition-transform duration-300",
            isHovered && "scale-110"
          )}>
            <img
              src={tweet.user.avatarUrl}
              alt={tweet.user.displayName}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <Link to={`/profile/${tweet.user.username}`} className="font-semibold hover:underline truncate">
                {tweet.user.displayName}
              </Link>
              {tweet.user.verified && (
                <Badge variant="outline" className="ml-1 h-5 px-1 text-xs text-crypto-blue border-crypto-blue/30">
                  <Shield className="h-3 w-3 mr-0.5" />
                  <span className="hidden xxs:inline">Verified</span>
                </Badge>
              )}
              <span className="mx-1 text-muted-foreground flex-shrink-0">·</span>
              <span className="text-muted-foreground text-sm truncate hover:underline cursor-pointer flex-shrink-0">
                @{tweet.user.username}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground hidden md:inline-block">
                <time dateTime={tweet.timestamp} title={safeTimestamp()}>
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
            {tweet.content}
          </p>
          
          {tweet.content.length > 150 && !isExpanded && (
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
          
          {tweet.hashtags && tweet.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tweet.hashtags.map((tag) => (
                <Link 
                  key={tag} 
                  to={`/hashtag/${tag}`} 
                  className={cn(
                    "text-crypto-blue hover:bg-crypto-blue/10 px-2 py-0.5 rounded-full text-sm transition-colors",
                    isHovered && "animate-pulse-slow"
                  )}
                  style={{ animationDelay: `${Math.random() * 1}s` }}
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
              <span>{formatNumber(tweet.comments)}</span>
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
            <time dateTime={tweet.timestamp}>
              {safeTimestamp()}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTweetCard;
