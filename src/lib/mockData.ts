
import { Tweet, User, UserProfile } from './types';

export const currentUser: User = {
  id: "user-1",
  username: "satoshi",
  displayName: "Satoshi Nakamoto",
  avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=satoshi",
  walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  bio: "Bitcoin creator. Cypherpunk. Privacy advocate.",
  joinedDate: "2009-01-03",
  following: 21,
  followers: 1000000,
  verified: true
};

export const suggestedUsers: User[] = [
  {
    id: "user-2",
    username: "vbuterin",
    displayName: "Vitalik Buterin",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=vbuterin",
    walletAddress: "0x61bB630D3B2e8af41b03593a257a61E2eC1ce723",
    bio: "Ethereum co-founder. Blockchain researcher.",
    joinedDate: "2013-12-20",
    following: 145,
    followers: 4500000,
    verified: true
  },
  {
    id: "user-3",
    username: "cz_binance",
    displayName: "CZ",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=cz_binance",
    walletAddress: "0x23a91059Fdc9579A9Fdb02272027880a781D34a4",
    bio: "Building and using. Binance.",
    joinedDate: "2017-07-14",
    following: 333,
    followers: 8700000,
    verified: true
  },
  {
    id: "user-4",
    username: "SBF",
    displayName: "Sam Bankman-Fried",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=sbf",
    walletAddress: "0x45B31E01AA6f42F0549aD8462a92d1A0eCe4431b",
    bio: "Effective altruism. FTX.",
    joinedDate: "2019-05-02",
    following: 284,
    followers: 1200000,
    verified: true
  },
  {
    id: "user-5",
    username: "haydenzadams",
    displayName: "Hayden Adams",
    avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=haydenzadams",
    walletAddress: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    bio: "Uniswap creator. Engineer. DeFi pioneer.",
    joinedDate: "2018-11-02",
    following: 512,
    followers: 340000,
    verified: true
  },
];

export const mockTweets: Tweet[] = [
  {
    id: "tweet-1",
    content: "Just achieved a new ATH for $ETH! The future of finance is being built right before our eyes. #Ethereum #DeFi",
    user: suggestedUsers[0],
    timestamp: "2023-11-10T14:32:00Z",
    likes: 12500,
    retweets: 3200,
    comments: 845,
    hashtags: ["Ethereum", "DeFi", "ATH"],
  },
  {
    id: "tweet-2",
    content: "Binance will list $PEPE today at 14:00 UTC. Get ready for the trading to begin!",
    user: suggestedUsers[1],
    timestamp: "2023-11-09T09:45:00Z",
    likes: 9700,
    retweets: 2100,
    comments: 734,
    hashtags: ["Binance", "PEPE", "Listing"],
  },
  {
    id: "tweet-3",
    content: "Working on a major protocol upgrade. This will reduce gas fees by approximately 30% and increase throughput. Technical details in the thread below.",
    user: suggestedUsers[0],
    timestamp: "2023-11-08T16:21:00Z",
    likes: 18900,
    retweets: 4500,
    comments: 1245,
    hashtags: ["Ethereum", "Upgrade", "GasFees"],
  },
  {
    id: "tweet-4",
    content: "The next bull run will be driven by real utility, not speculation. Build during the bear market, thrive during the bull.",
    user: suggestedUsers[4],
    timestamp: "2023-11-07T11:15:00Z",
    likes: 5600,
    retweets: 1300,
    comments: 423,
    hashtags: ["BullMarket", "BearMarket", "Crypto"],
  },
  {
    id: "tweet-5",
    content: "Uniswap V4 development is progressing well. Can't wait to share more details with the community soon!",
    user: suggestedUsers[4],
    timestamp: "2023-11-06T20:03:00Z",
    likes: 7200,
    retweets: 1800,
    comments: 512,
    hashtags: ["Uniswap", "DeFi", "DEX"],
  },
  {
    id: "tweet-6",
    content: "The peer-to-peer electronic cash system I envisioned is evolving beyond my expectations. Bitcoin was just the beginning.",
    user: currentUser,
    timestamp: "2023-11-05T15:43:00Z",
    likes: 42000,
    retweets: 12500,
    comments: 3600,
    hashtags: ["Bitcoin", "P2P", "Cryptocurrency"],
  },
];

export const userProfile: UserProfile = {
  ...currentUser,
  transactions: [
    {
      id: "tx-1",
      type: "buy",
      amount: 1.5,
      token: "Ethereum",
      tokenSymbol: "ETH",
      tokenLogo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024",
      timestamp: "2023-11-10T09:23:00Z",
      status: "completed",
      hash: "0x3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      fee: 0.005
    },
    {
      id: "tx-2",
      type: "swap",
      amount: 1200,
      token: "USD Coin",
      tokenSymbol: "USDC",
      tokenLogo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=024",
      timestamp: "2023-11-08T14:17:00Z",
      status: "completed",
      hash: "0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
      fee: 0.003
    },
    {
      id: "tx-3",
      type: "sell",
      amount: 0.75,
      token: "Bitcoin",
      tokenSymbol: "BTC",
      tokenLogo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024",
      timestamp: "2023-11-06T10:42:00Z",
      status: "completed",
      hash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
      fee: 0.001
    },
    {
      id: "tx-4",
      type: "transfer",
      amount: 500,
      token: "USD Coin",
      tokenSymbol: "USDC",
      tokenLogo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=024",
      timestamp: "2023-11-03T16:05:00Z",
      status: "completed",
      hash: "0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
      fee: 0.002
    },
    {
      id: "tx-5",
      type: "buy",
      amount: 10,
      token: "Solana",
      tokenSymbol: "SOL",
      tokenLogo: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=024",
      timestamp: "2023-11-01T08:34:00Z",
      status: "completed",
      hash: "0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
      fee: 0.004
    }
  ],
  pnlData: [
    { date: "2023-11-01", value: 10500, change: 0, changePercent: 0 },
    { date: "2023-11-02", value: 10650, change: 150, changePercent: 1.43 },
    { date: "2023-11-03", value: 11200, change: 550, changePercent: 5.16 },
    { date: "2023-11-04", value: 10900, change: -300, changePercent: -2.68 },
    { date: "2023-11-05", value: 11500, change: 600, changePercent: 5.5 },
    { date: "2023-11-06", value: 12000, change: 500, changePercent: 4.35 },
    { date: "2023-11-07", value: 12300, change: 300, changePercent: 2.5 },
    { date: "2023-11-08", value: 11800, change: -500, changePercent: -4.07 },
    { date: "2023-11-09", value: 12500, change: 700, changePercent: 5.93 },
    { date: "2023-11-10", value: 13200, change: 700, changePercent: 5.6 },
  ],
  tokens: [
    {
      token: "Bitcoin",
      symbol: "BTC",
      amount: 0.75,
      valueUSD: 24750,
      logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024",
      change24h: 2.34
    },
    {
      token: "Ethereum",
      symbol: "ETH",
      amount: 12.5,
      valueUSD: 23750,
      logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024",
      change24h: 3.78
    },
    {
      token: "USD Coin",
      symbol: "USDC",
      amount: 10000,
      valueUSD: 10000,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=024",
      change24h: 0.01
    },
    {
      token: "Solana",
      symbol: "SOL",
      amount: 100,
      valueUSD: 7000,
      logo: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=024",
      change24h: 5.67
    },
    {
      token: "Chainlink",
      symbol: "LINK",
      amount: 400,
      valueUSD: 4800,
      logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=024",
      change24h: -1.23
    }
  ],
  totalBalance: 70300
};
