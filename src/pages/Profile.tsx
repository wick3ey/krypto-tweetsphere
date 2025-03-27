import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Calendar, ChevronDown, Edit, ExternalLink, 
  Gift, Grid3X3, Heart, Link as LinkIcon, 
  MessageSquare, Repeat2, Settings, Share, Shield, 
  Twitter, UserPlus, Loader2 
} from 'lucide-react';

import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import TweetCard from '@/components/feed/TweetCard';
import ProfileCard from '@/components/profile/ProfileCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { tweetService } from '@/api/tweetService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tweets");
  const [viewMode, setViewMode] = useState("grid");
  const [showSettings, setShowSettings] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [highlightedTweet, setHighlightedTweet] = useState<string | null>(null);
  
  const { currentUser, isLoadingCurrentUser, followUser, unfollowUser } = useUser();
  
  const identifier = username || currentUser?.username;
  
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['userProfile', identifier],
    queryFn: () => identifier ? userService.getUserProfile(identifier) : null,
    enabled: !!identifier,
    retry: 1
  });
  
  const isOwnProfile = currentUser?.id === userProfile?.id;
  const isFollowing = currentUser?.following?.includes?.(userProfile?.id);
  
  const { 
    data: userTweets = [], 
    isLoading: isLoadingTweets,
    refetch: refetchTweets
  } = useQuery({
    queryKey: ['userTweets', userProfile?.id, activeTab],
    queryFn: () => userService.getUserTweets(
      userProfile?.id,
      { type: activeTab === "replies" ? "replies" : 
              activeTab === "media" ? "media" : "tweets" }
    ),
    enabled: !!userProfile?.id,
    staleTime: 60 * 1000
  });
  
  const { 
    data: suggestedUsers = [],
    isLoading: isLoadingSuggested
  } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => userService.searchUsers(''),
    enabled: !isOwnProfile && !!userProfile,
    staleTime: 5 * 60 * 1000
  });
  
  useEffect(() => {
    setActiveTab("tweets");
    setViewMode("grid");
    setShowSettings(false);
  }, [username]);
  
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-on-load');
    elements.forEach((el, index) => {
      if (el instanceof HTMLElement) {
        el.style.animationDelay = `${index * 100}ms`;
      }
    });
  }, [activeTab]);
  
  const handleFollowToggle = useCallback(() => {
    if (!currentUser) {
      toast.error("Du måste vara inloggad för att följa användare");
      return;
    }
    
    if (isFollowing) {
      unfollowUser(userProfile.id);
    } else {
      followUser(userProfile.id);
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1000);
    }
  }, [isFollowing, userProfile?.id, currentUser, followUser, unfollowUser]);
  
  const handleTweetHover = useCallback((id: string) => {
    setHighlightedTweet(id);
  }, []);
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
  if (isLoadingProfile || isLoadingCurrentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-crypto-blue" />
          <h2 className="text-2xl font-bold">Laddar profil</h2>
          <p className="text-muted-foreground">Vänta medan vi hämtar profilinformation...</p>
        </div>
      </div>
    );
  }
  
  if (profileError || !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold">Profil hittades inte</h2>
          <p className="text-muted-foreground">Den begärda profilen kunde inte hittas.</p>
          <Button className="mt-4" asChild>
            <Link to="/">Till startsidan</Link>
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
        <div className="relative h-48 md:h-64 mb-16 overflow-hidden rounded-xl">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30 transform hover:scale-105 transition-transform duration-500"
            style={{
              backgroundImage: `url(https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile.username}-banner)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          
          <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-full border-4 border-background overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img
              src={userProfile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile.username}`}
              alt={userProfile.displayName}
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
            {isOwnProfile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40"
                onClick={() => navigate('/setup-profile')}
              >
                <Edit className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="mb-6 animate-fade-in animate-on-load">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold mr-1">{userProfile.displayName}</h1>
                {userProfile.verified && (
                  <Badge className="bg-crypto-blue text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Verifierad
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{userProfile.username}</p>
            </div>
            
            <div className="flex space-x-2">
              {!isOwnProfile && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => navigate(`/messages/${userProfile.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Meddelande
                  </Button>
                  
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    size="sm" 
                    className={cn(
                      "rounded-full relative overflow-hidden",
                      likeAnimation && "after:content-[''] after:absolute after:inset-0 after:bg-crypto-blue after:animate-ping after:opacity-30"
                    )}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? (
                      <>
                        <Checkbox className="h-3 w-3 mr-1" checked />
                        Följer
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Följ
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
          
          <div className="mt-4">
            <p className="text-balance">{userProfile.bio}</p>
            
            <div className="mt-3 flex flex-wrap gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center mr-4">
                <LinkIcon className="h-4 w-4 mr-1" />
                <span className="font-mono">{userProfile.walletAddress.substring(0, 6)}...{userProfile.walletAddress.substring(userProfile.walletAddress.length - 4)}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 px-1 text-xs text-crypto-blue"
                  onClick={() => {
                    navigator.clipboard.writeText(userProfile.walletAddress);
                    toast.success("Wallet-adress kopierad");
                  }}
                >
                  Kopiera
                </Button>
              </div>
              
              <div className="flex items-center mr-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Gick med {new Date(userProfile.joinedDate).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}</span>
              </div>
              
              {userProfile.website && (
                <div className="flex items-center mr-4">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="text-crypto-blue hover:underline">{userProfile.website}</a>
                </div>
              )}
              
              {userProfile.twitterHandle && (
                <div className="flex items-center">
                  <Twitter className="h-4 w-4 mr-1" />
                  <a href={`https://twitter.com/${userProfile.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="text-crypto-blue hover:underline">@{userProfile.twitterHandle}</a>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex space-x-5">
              <Link to="#" className="hover:underline hover:text-crypto-blue transition-colors">
                <span className="font-semibold">{Array.isArray(userProfile.following) ? userProfile.following.length : userProfile.following || 0}</span>
                <span className="text-muted-foreground ml-1">Följer</span>
              </Link>
              <Link to="#" className="hover:underline hover:text-crypto-blue transition-colors">
                <span className="font-semibold">{Array.isArray(userProfile.followers) ? userProfile.followers.length : userProfile.followers || 0}</span>
                <span className="text-muted-foreground ml-1">Följare</span>
              </Link>
            </div>
          </div>
          
          <Collapsible 
            open={showSettings} 
            onOpenChange={setShowSettings}
            className="mt-4"
          >
            <CollapsibleContent className="animate-slide-in">
              <Card className="backdrop-blur-md bg-secondary/50 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Visningsinställningar</CardTitle>
                  <CardDescription>Anpassa hur du ser denna profil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Visa retweets</label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Visa svar</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Visa NFT-inlägg</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Tysta detta konto</label>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="mt-6 animate-fade-in animate-on-load" style={{ animationDelay: '100ms' }}>
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className="w-full bg-transparent">
              <TabsTrigger value="tweets" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Tweets
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Svar
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Tillgångar
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-crypto-blue rounded-none">
                Transaktioner
              </TabsTrigger>
            </TabsList>
            
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
              {isLoadingTweets ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="p-4 border border-border rounded-xl animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-muted/60"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted/60 rounded w-1/4"></div>
                          <div className="h-3 bg-muted/60 rounded w-1/3"></div>
                          <div className="h-4 bg-muted/60 rounded w-full"></div>
                          <div className="h-4 bg-muted/60 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTweets && userTweets.length > 0 ? (
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
                  <p>Inga tweets ännu</p>
                  {isOwnProfile && (
                    <Button className="mt-4" variant="outline">
                      Skapa din första tweet
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="replies" className="mt-6">
              <AnimatedCard delay={200} className="p-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">Inga svar ännu</h3>
                <p className="text-muted-foreground">När {isOwnProfile ? 'du svarar' : 'denna användare svarar'} på inlägg visas de här.</p>
              </AnimatedCard>
            </TabsContent>
            
            <TabsContent value="assets" className="mt-6 min-h-[200px]">
              <AnimatedCard delay={200} className="p-8 text-center">
                <Gift className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">Inga tillgångar hittades</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Anslut din wallet för att visa dina tillgångar" 
                    : "Denna användare har inte anslutit några tillgångar"}
                </p>
                {isOwnProfile && !currentUser?.hasConnectedWallet && (
                  <Button className="mt-4">Anslut Wallet</Button>
                )}
              </AnimatedCard>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6 min-h-[200px]">
              <AnimatedCard delay={200} className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <h3 className="text-lg font-medium mb-1">Inga transaktioner</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Din transaktionshistorik visas här" 
                    : "Denna användares transaktionshistorik är privat"}
                </p>
              </AnimatedCard>
            </TabsContent>
          </Tabs>
        </div>
        
        {!isOwnProfile && (
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Liknande Användare</CardTitle>
                <CardDescription>Personer som interagerar med @{userProfile.username}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSuggested ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-muted/60 mb-2"></div>
                        <div className="h-4 bg-muted/60 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-muted/60 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {suggestedUsers.slice(0, 3).map((user, index) => (
                      <Link 
                        key={user.id} 
                        to={`/profile/${user.username}`}
                        className="flex flex-col items-center p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 100 + 400}ms` }}
                      >
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-2 border-background">
                            <AvatarImage 
                              src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} 
                              alt={user.displayName} 
                            />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
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
                ) : (
                  <p className="text-center text-muted-foreground">Inga förslag tillgängliga</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
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
