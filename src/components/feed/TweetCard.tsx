
import { Heart, MessageSquare, Repeat2, Share } from 'lucide-react';
import { Tweet } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TweetCardProps {
  tweet: Tweet;
  className?: string;
  style?: React.CSSProperties;
}

const TweetCard = ({ tweet, className, style }: TweetCardProps) => {
  // Add null check to ensure tweet and tweet.user exist
  if (!tweet || !tweet.user) {
    console.error("Tweet or tweet.user is undefined:", tweet);
    return null;
  }

  const formattedDate = formatDistanceToNow(new Date(tweet.timestamp), { addSuffix: true });
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div 
      className={cn("glass-card p-4 overflow-hidden transition-all duration-300 hover-scale", className)}
      style={style}
    >
      <div className="flex space-x-3">
        <Link to={`/profile/${tweet.user.username}`} className="flex-shrink-0">
          <img
            src={tweet.user.avatarUrl}
            alt={tweet.user.displayName}
            className="h-10 w-10 rounded-full object-cover border border-border"
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link to={`/profile/${tweet.user.username}`} className="font-semibold">
              {tweet.user.displayName}
            </Link>
            {tweet.user.verified && (
              <span className="ml-1 text-crypto-blue">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
            )}
            <span className="ml-2 text-muted-foreground text-sm truncate">
              @{tweet.user.username}
            </span>
            <span className="mx-1 text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">{formattedDate}</span>
          </div>
          
          <p className="mt-1 text-balance">{tweet.content}</p>
          
          {tweet.hashtags && tweet.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tweet.hashtags.map((tag) => (
                <Link key={tag} to={`/hashtag/${tag}`} className="text-crypto-blue hover:underline text-sm">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex justify-between text-muted-foreground text-sm max-w-md">
            <button className="flex items-center space-x-1 group">
              <MessageSquare className="h-4 w-4 group-hover:text-crypto-blue transition-colors" />
              <span className="group-hover:text-crypto-blue transition-colors">{formatNumber(tweet.comments)}</span>
            </button>
            
            <button className="flex items-center space-x-1 group">
              <Repeat2 className="h-4 w-4 group-hover:text-crypto-green transition-colors" />
              <span className="group-hover:text-crypto-green transition-colors">{formatNumber(tweet.retweets)}</span>
            </button>
            
            <button className="flex items-center space-x-1 group">
              <Heart className="h-4 w-4 group-hover:text-crypto-red transition-colors" />
              <span className="group-hover:text-crypto-red transition-colors">{formatNumber(tweet.likes)}</span>
            </button>
            
            <button className="flex items-center space-x-1 group">
              <Share className="h-4 w-4 group-hover:text-crypto-blue transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
