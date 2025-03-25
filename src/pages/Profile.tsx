
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Bell, Calendar, ChevronDown, Edit, ExternalLink, 
  Gift, Grid3X3, Heart, Link as LinkIcon, 
  MessageSquare, Repeat2, Settings, Share, Shield, 
  Twitter, UserPlus 
} from 'lucide-react';

import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import TweetCard from '@/components/feed/TweetCard';
import ProfileCard from '@/components/profile/ProfileCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import { mockTweets, suggestedUsers, currentUser, userProfile } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

import {
  ToggleGroup,
  ToggleGroupItem
} from '@/components/ui/toggle-group';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const Profile = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState("tweets");
  const [viewMode, setViewMode] = useState("grid");
  const [showSettings, setShowSettings] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [highlightedTweet, setHighlightedTweet] = useState<string | null>(null);
  
  // Find the user data based on the username parameter
  // Default to currentUser if no matching user is found
  const userData = username
    ? suggestedUsers.find(user => user.username === username) || currentUser
    : currentUser;
  
  // Make sure userData is defined before filtering tweets
  const userTweets = userData 
    ? mockTweets.filter(tweet => 
        tweet.user && tweet.user.username === userData.username
      )
    : [];
  
  // Add profile details for current user 
  const profileDetails = userData.username === currentUser.username 
    ? userProfile 
    : null;

  useEffect(() => {
    // Reset state when username changes
    setActiveTab("tweets");
    setViewMode("grid");
    setShowSettings(false);
    setIsFollowing(false);
  }, [username]);

  // Animate in when component mounts
  useEffect(() => {
    document.querySelectorAll('.animate-on-load').forEach((el, index) => {
      (el as HTMLElement).style.animationDelay = `${index * 100}ms`;
    });
  }, []);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 1000);
  };

  const handleTweetHover = (id: string) => {
    setHighlightedTweet(id);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="text-muted-foreground">The requested profile could not be found.</p>
          <Button className="mt-4" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container max-w-4xl pt-20 px-4">
        {/* Hero Section with Parallax Effect */}
        <div className="relative h-48 md:h-64 mb-16 overflow-hidden rounded-xl">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30 transform hover:scale-105 transition-transform duration-500"
            style={{
              backgroundImage: `url(https://api.dicebear.com/7.x/identicon/svg?seed=${userData.username}-banner)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          
          <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-full border-4 border-background overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img
              src={userData.avatarUrl}
              alt={userData.displayName}
              className="h-full w-full object-cover"
            />
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40">
              <Share className="h-4 w-4 text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40">
              <Bell className="h-4 w-4 text-white" />
            </Button>
            {userData.username === currentUser.username && (
              <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40">
                <Edit className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>
        </div>
        
        {/* User Info and Actions */}
        <div className="mb-6 animate-fade-in animate-on-load">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold mr-1">{userData.displayName}</h1>
                {userData.verified && (
                  <Badge className="bg-crypto-blue text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{userData.username}</p>
            </div>
            
            <div className="flex space-x-2">
              {userData.username !== currentUser.username && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    size="sm" 
                    className={cn(
                      "rounded-full relative overflow-hidden",
                      likeAnimation && "after:content-[''] after:absolute after:inset-0 after:bg-crypto-blue after:animate-ping after:opacity-30"
                    )}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <Checkbox className="h-3 w-3 mr-1" checked />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* User Bio and Details */}
          <div className="mt-4">
            <p className="text-balance">{userData.bio}</p>
            
            <div className="mt-3 flex flex-wrap gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center mr-4">
                <LinkIcon className="h-4 w-4 mr-1" />
                <span className="font-mono">{userData.walletAddress.substring(0, 6)}...{userData.walletAddress.substring(userData.walletAddress.length - 4)}</span>
                <Button variant="ghost" size="sm" className="h-5 px-1 text-xs text-crypto-blue">Copy</Button>
              </div>
              
              <div className="flex items-center mr-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Joined {new Date(userData.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              
              <div className="flex items-center mr-4">
                <ExternalLink className="h-4 w-4 mr-1" />
                <a href="#" className="text-crypto-blue hover:underline">ens.eth</a>
              </div>
              
              <div className="flex items-center">
                <Twitter className="h-4 w-4 mr-1" />
                <a href="#" className="text-crypto-blue hover:underline">@{userData.username}</a>
              </div>
            </div>
            
            <div className="mt-3 flex space-x-5">
              <Link to="#" className="hover:underline hover:text-crypto-blue transition-colors">
                <span className="font-semibold">{userData.following.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </Link>
              <Link to="#" className="hover:underline hover:text-crypto-blue transition-colors">
                <span className="font-semibold">{userData.followers.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </Link>
            </div>
          </div>
          
          {/* Settings Panel (Collapsible) */}
          <Collapsible 
            open={showSettings} 
            onOpenChange={setShowSettings}
            className="mt-4"
          >
            <CollapsibleContent className="animate-slide-in">
              <Card className="backdrop-blur-md bg-secondary/50 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Display Settings</CardTitle>
                  <CardDescription>Customize how you see this profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show retweets</label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show replies</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show NFT posts</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Mute this account</label>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {/* Tab Navigation with Animated Underline */}
        <div className="mt-6 animate-fade-in animate-on-load" style={{ animationDelay: '100ms' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-transparent">
              <TabsTrigger value="tweets" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Tweets
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Replies
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Assets
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Transactions
              </TabsTrigger>
            </TabsList>
            
            {/* Toggle for view mode */}
            <div className="mt-4 flex justify-end">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
                <ToggleGroupItem value="list" size="sm" className="rounded-l-md rounded-r-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" size="sm" className="rounded-r-md rounded-l-none">
                  <Grid3X3 className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <TabsContent value="tweets" className="mt-6">
              {userTweets.length > 0 ? (
                <div className={cn(
                  "transition-all duration-300",
                  viewMode === "grid" ? "grid gap-4 grid-cols-1 md:grid-cols-2" : "space-y-4"
                )}>
                  {userTweets.map((tweet, index) => (
                    <div 
                      key={tweet.id}
                      className={cn(
                        "transform transition-all duration-300",
                        highlightedTweet === tweet.id && "scale-[1.02]",
                        viewMode === "list" && "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onMouseEnter={() => handleTweetHover(tweet.id)}
                      onMouseLeave={() => setHighlightedTweet(null)}
                    >
                      <TweetCard
                        tweet={tweet}
                        className={cn(
                          "h-full",
                          highlightedTweet === tweet.id && "shadow-md border-crypto-blue/30"
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground animate-fade-in">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No tweets yet</p>
                  {userData.username === currentUser.username && (
                    <Button className="mt-4" variant="outline">
                      Create your first tweet
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="replies" className="mt-6">
              <AnimatedCard delay={200} className="p-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">No replies yet</h3>
                <p className="text-muted-foreground">When {userData.username === currentUser.username ? 'you reply' : 'this user replies'} to posts, they'll appear here.</p>
              </AnimatedCard>
            </TabsContent>
            
            <TabsContent value="assets" className="mt-6">
              {profileDetails && profileDetails.tokens ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {profileDetails.tokens.map((token, index) => (
                    <AnimatedCard 
                      key={token.symbol} 
                      className="p-4 hover-scale"
                      delay={index * 100}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                          <img src={token.logo} alt={token.token} className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{token.token}</h3>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              token.change24h > 0 ? "bg-crypto-green/10 text-crypto-green" : "bg-crypto-red/10 text-crypto-red"
                            )}>
                              {token.change24h > 0 ? "+" : ""}{token.change24h}%
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-muted-foreground">{token.amount} {token.symbol}</span>
                            <span className="font-medium">${token.valueUSD.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              ) : (
                <AnimatedCard delay={200} className="p-8 text-center">
                  <Gift className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-1">No assets found</h3>
                  <p className="text-muted-foreground">
                    {userData.username === currentUser.username 
                      ? "Connect your wallet to view your assets" 
                      : "This user hasn't connected any assets"}
                  </p>
                  {userData.username === currentUser.username && (
                    <Button className="mt-4">Connect Wallet</Button>
                  )}
                </AnimatedCard>
              )}
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              {profileDetails && profileDetails.transactions ? (
                <AnimatedCard className="divide-y divide-border">
                  {profileDetails.transactions.map((tx, index) => (
                    <div 
                      key={tx.id}
                      className="p-4 hover:bg-secondary/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mr-3",
                          tx.type === 'buy' ? "bg-crypto-green/10" : 
                          tx.type === 'sell' ? "bg-crypto-red/10" : 
                          "bg-crypto-blue/10"
                        )}>
                          {tx.type === 'buy' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-crypto-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M19 12l-7 7-7-7"/>
                            </svg>
                          )}
                          {tx.type === 'sell' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-crypto-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          )}
                          {tx.type === 'swap' && (
                            <Repeat2 className="h-5 w-5 text-crypto-blue" />
                          )}
                          {tx.type === 'transfer' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-crypto-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 6l-10 7L2 6"/>
                              <path d="M2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium capitalize">{tx.type} {tx.token}</h3>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {tx.type === 'sell' ? '-' : tx.type === 'buy' ? '+' : ''}
                                {tx.amount} {tx.tokenSymbol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Fee: {tx.fee} {tx.tokenSymbol}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <span className="text-xs mr-2 px-1.5 py-0.5 bg-secondary rounded">
                              {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 8)}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </AnimatedCard>
              ) : (
                <AnimatedCard delay={200} className="p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <h3 className="text-lg font-medium mb-1">No transactions</h3>
                  <p className="text-muted-foreground">
                    {userData.username === currentUser.username 
                      ? "Your transaction history will appear here" 
                      : "This user's transaction history is private"}
                  </p>
                </AnimatedCard>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Connect with Similar Users */}
        {userData.username !== currentUser.username && (
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Similar Users</CardTitle>
                <CardDescription>People who interact with @{userData.username}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {suggestedUsers.slice(0, 3).map((user, index) => (
                    <Link 
                      key={user.id} 
                      to={`/profile/${user.username}`}
                      className="flex flex-col items-center p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 100 + 400}ms` }}
                    >
                      <div className="relative">
                        <img 
                          src={user.avatarUrl} 
                          alt={user.displayName} 
                          className="h-16 w-16 rounded-full border-2 border-background object-cover"
                        />
                        {user.verified && (
                          <div className="absolute bottom-0 right-0 h-5 w-5 bg-crypto-blue rounded-full flex items-center justify-center border-2 border-background">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="mt-2 font-medium text-center">{user.displayName}</h4>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Feedback Button */}
        <div className="fixed bottom-24 md:bottom-8 right-8 z-10">
          <Button
            className="rounded-full shadow-lg bg-crypto-blue hover:bg-crypto-blue/90 p-3 h-auto animate-pulse-subtle"
            size="icon"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
