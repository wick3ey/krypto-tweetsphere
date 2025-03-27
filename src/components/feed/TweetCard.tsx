import React, { useState } from 'react';
import { User, Tweet } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import {
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  Verified,
  MoreHorizontal,
  HeartIcon,
  MessageSquareIcon,
  RepeatIcon,
  Share2Icon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TweetCardProps {
  tweet: Tweet;
  isRetweet?: boolean;
  retweetedBy?: User;
}

const TweetCard = ({ tweet, isRetweet, retweetedBy }: TweetCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likes);
  const { currentUser } = useUser();
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };
  
  const timeAgo = formatDistanceToNow(new Date(tweet.timestamp), { addSuffix: true });
  
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
  
  const user = tweet.user || mockUser;
  
  return (
    <div className="bg-background border border-border rounded-lg p-4">
      {isRetweet && retweetedBy && (
        <div className="text-sm text-muted-foreground mb-2">
          <RepeatIcon className="h-4 w-4 inline-block mr-1" />
          {retweetedBy.displayName} delade
        </div>
      )}
      <div className="flex items-start space-x-3">
        <Link to={`/profile/${user.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.displayName} />
            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Link to={`/profile/${user.username}`}>
              <div className="flex items-center">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                {user.verified && <Verified className="ml-1 h-4 w-4 text-blue-500" />}
              </div>
            </Link>
            <span className="text-sm text-muted-foreground">@{user.username} · {timeAgo}</span>
          </div>
          <p className="text-sm py-2">{tweet.content}</p>
          <div className="mt-4 flex justify-between items-center">
            <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
              <MessageSquareIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">123</span>
            </button>
            <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
              <RepeatIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">45</span>
            </button>
            <button
              className={cn("flex items-center transition-colors",
                isLiked ? 'text-red-500 hover:text-red-700' : 'text-muted-foreground hover:text-red-500')}
              onClick={handleLike}
            >
              <HeartIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{likeCount}</span>
            </button>
            <button className="flex items-center text-muted-foreground hover:text-primary transition-colors">
              <Share2Icon className="h-5 w-5 mr-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
