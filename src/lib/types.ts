export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  walletAddress: string;
  bio: string;
  joinedDate: string;
  following: number | string[];
  followers: number | string[];
  verified: boolean;
  headerUrl?: string; // Added for header image
  website?: string; // Added for user website
  twitterHandle?: string; // Added for Twitter handle
  _id?: string;
  profileImage?: string;
  hasConnectedWallet?: boolean; // Added to support property used in Profile.tsx
}

export interface Tweet {
  id: string;
  content: string;
  user: User;
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  attachments?: string[];
  mentions?: string[];
  hashtags?: string[];
  _id?: string;
  userId?: User | string;
  likeCount?: number;
  retweetCount?: number;
  commentCount?: number;
  createdAt?: string;
  retweetOf?: string;
  replyTo?: string;
  likedBy?: string[];  // Array of user IDs who liked this tweet
  retweetedBy?: string[]; // Array of user IDs who retweeted this tweet
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'swap' | 'transfer';
  amount: number;
  token: string;
  tokenSymbol: string;
  tokenLogo: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
  fee?: number;
}

export interface PnLData {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  amount: number;
  valueUSD: number;
  logo: string;
  change24h: number;
}

export interface UserProfile extends User {
  transactions: Transaction[];
  pnlData: PnLData[];
  tokens: TokenBalance[];
  totalBalance: number;
}

export interface TrendingTopic {
  tag: string;
  description: string;
  tweets: number;
}

export interface TrendingCoin {
  name: string;
  symbol: string;
  logo: string;
  price: string;
  change: string;
}

export interface TrendingEvent {
  name: string;
  image: string;
  type: string;
  date: string;
}

export interface CommunityTopic {
  title: string;
  image: string;
  category: string;
  articles: number;
}

export interface CommunityProject {
  name: string;
  logo: string;
  description: string;
  category: string;
  stats?: Record<string, string | number>;
}

export interface CommunityGroup {
  name: string;
  image: string;
  members: number;
}

export interface TrendingData {
  topics: TrendingTopic[];
  coins: TrendingCoin[];
  events: TrendingEvent[];
}

export interface CommunitiesData {
  topics: CommunityTopic[];
  projects: CommunityProject[];
  groups: CommunityGroup[];
}

export interface SuggestedUser extends User {
  bio: string;
}
