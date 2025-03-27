import { User as UserType, Tweet as TweetType } from '@/lib/types';

// Database User Type - represents the structure from Supabase
export interface DbUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  header_url?: string;
  bio?: string;
  joined_date: string;
  last_seen?: string;
  verified: boolean;
  following: string[];
  followers: string[];
  email?: string;
  wallet_address?: string;
}

// Database Tweet Type - represents the structure from Supabase
export interface DbTweet {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  attachments?: string[];
  mentions?: string[];
  hashtags?: string[];
  likes?: string[];
  retweets?: string[];
  comment_count: number;
  retweet_of?: string;
  reply_to?: string;
}

// Database Comment Type - represents the structure from Supabase
export interface DbComment {
  id: string;
  tweet_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Conversion functions to map between DB and application types
export const dbUserToUser = (dbUser: DbUser): UserType => ({
  id: dbUser.id,
  username: dbUser.username,
  displayName: dbUser.display_name,
  avatarUrl: dbUser.avatar_url || '',
  bio: dbUser.bio || '',
  joinedDate: dbUser.joined_date,
  following: dbUser.following || [],
  followers: dbUser.followers || [],
  verified: dbUser.verified || false,
  email: dbUser.email,
  walletAddress: dbUser.wallet_address,
});

export const dbTweetToTweet = (dbTweet: DbTweet, user: UserType): TweetType => ({
  id: dbTweet.id,
  content: dbTweet.content,
  user: user,
  timestamp: dbTweet.created_at,
  likes: dbTweet.likes?.length || 0,
  retweets: dbTweet.retweets?.length || 0,
  comments: dbTweet.comment_count || 0,
  attachments: dbTweet.attachments || [],
  mentions: dbTweet.mentions || [],
  hashtags: dbTweet.hashtags || [],
  likedBy: dbTweet.likes || [],
  retweetedBy: dbTweet.retweets || [],
  retweetOf: dbTweet.retweet_of,
  replyTo: dbTweet.reply_to,
});
