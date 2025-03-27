import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Plus, TrendingUp, Sparkles, User, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ComposeDialog from '@/components/feed/ComposeDialog';
import EnhancedTweetCard from '@/components/feed/EnhancedTweetCard';
import ProfileCard from '@/components/profile/ProfileCard';

import { useUser } from '@/hooks/useUser';
import { tweetService } from '@/api/tweetService';
import { userService } from '@/api/userService';
import { useRealtime } from '@/hooks/useRealtime';

const Home = () => {
  const [activeFeed, setActiveFeed] = useState('latest');
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstLoadRef = useRef(true);
  const queryClient = useQueryClient();
  
  const { currentUser } = useUser();
  const isLoggedIn = !!localStorage.getItem('jwt_token');
  
  useRealtime({
    table: 'tweets',
    queryKeys: [['tweets']]
  });
  
  useEffect(() => {
    localStorage.removeItem('local_tweets');
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);
  
  const { 
    data: tweets = [], 
    isLoading: isLoadingTweets, 
    refetch 
  } = useQuery({
    queryKey: ['tweets', activeFeed],
    queryFn: async () => {
      console.log(`Fetching ${activeFeed} feed...`);
      if (activeFeed === 'trending') {
        return tweetService.getExploreFeed();
      } else if (activeFeed === 'following' && isLoggedIn) {
        return tweetService.getFeed();
      } else {
        return tweetService.getExploreFeed();
      }
    },
    staleTime: 15000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  });
  
  const { 
    data: suggestedUsers = [],
    isLoading: isLoadingSuggested
  } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => userService.getSuggestedUsers(),
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000
  });
  
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      refetch();
    }
  }, [refetch]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Uppdaterar flödet...");
    
    try {
      await refetch();
      toast.success("Flödet uppdaterat");
    } catch (error) {
      console.error('Error refreshing feed:', error);
      toast.error("Kunde inte uppdatera flödet");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const renderUserProfile = () => {
    if (isLoggedIn && currentUser) {
      return (
        <div className="mb-6 bg-background border border-border rounded-lg overflow-hidden">
          <ProfileCard profile={currentUser} />
        </div>
      );
    }
    return null;
  };
  
  const renderSuggestedUsers = () => {
    if (!isLoggedIn || isLoadingSuggested || suggestedUsers.length === 0) {
      return null;
    }
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Förslag för dig</CardTitle>
          <CardDescription>Användare du kanske vill följa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {suggestedUsers.slice(0, 3).map((user) => (
            <Link 
              key={user.id} 
              to={`/profile/${user.username}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} 
                  alt={user.displayName} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full">Följ</Button>
            </Link>
          ))}
          <Button variant="ghost" className="w-full text-sm mt-2" size="sm">
            Visa mer
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  const renderTrendingTopics = () => {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="w-5 h-5" />
            Trendande ämnen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {[
            { tag: '#Bitcoin', tweets: 5823, description: 'Kryptovaluta' },
            { tag: '#Ethereum', tweets: 3218, description: 'Kryptovaluta' },
            { tag: '#NFTs', tweets: 2541, description: 'Digitala tillgångar' },
          ].map((topic) => (
            <div key={topic.tag} className="p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{topic.tag}</p>
                  <p className="text-xs text-muted-foreground">{topic.description}</p>
                </div>
                <p className="text-xs text-muted-foreground">{topic.tweets.toLocaleString()} tweets</p>
              </div>
            </div>
          ))}
          <Button variant="ghost" className="w-full text-sm" size="sm">
            Visa mer
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  const normalizeAndRenderTweet = (tweet: any, index: number) => {
    if (!tweet) return null;
    
    if (!tweet.user && (!tweet.userId || typeof tweet.userId !== 'object')) {
      console.warn('Tweet without user object:', tweet);
      return null;
    }
    
    return (
      <EnhancedTweetCard
        key={tweet.id || tweet._id || `tweet-${Math.random().toString(36).substring(2, 9)}`}
        tweet={tweet}
        animated={true}
        animationDelay={index * 100}
      />
    );
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="pt-20 pb-20 md:pb-6 md:pl-20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-16 z-10 bg-background border-b border-border pb-2">
                <h1 className="text-xl font-bold py-4">Hem</h1>
                
                <Tabs value={activeFeed} onValueChange={setActiveFeed} className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="latest" className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Senaste
                    </TabsTrigger>
                    <TabsTrigger 
                      value="following" 
                      className="flex items-center gap-1"
                      disabled={!isLoggedIn}
                    >
                      <User className="w-4 h-4" />
                      Följer
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {isLoggedIn && (
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <img 
                      src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || 'user'}`} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full"
                    />
                    <Button 
                      variant="outline"
                      className="text-muted-foreground text-left justify-start py-6 w-full rounded-full hover:bg-muted/50"
                      onClick={() => setComposeDialogOpen(true)}
                    >
                      Vad händer?
                    </Button>
                    <ComposeDialog 
                      open={composeDialogOpen} 
                      onOpenChange={setComposeDialogOpen}
                    />
                  </div>
                  
                  <div className="flex mt-3 justify-end">
                    <Button 
                      className="rounded-full"
                      onClick={() => setComposeDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Skapa inlägg
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 mt-2">
                {!isLoggedIn && activeFeed === 'following' ? (
                  <Card className="p-6 text-center">
                    <CardTitle className="mb-2">Följer-flöde</CardTitle>
                    <CardDescription className="mb-4">
                      Logga in för att se tweets från personer du följer
                    </CardDescription>
                    <Button asChild>
                      <Link to="/auth">Logga in</Link>
                    </Button>
                  </Card>
                ) : isLoadingTweets && tweets.length === 0 ? (
                  <div className="text-center py-10 bg-background border border-border rounded-lg">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p>Laddar tweets...</p>
                  </div>
                ) : tweets.length > 0 ? (
                  tweets.map((tweet: any, index: number) => normalizeAndRenderTweet(tweet, index))
                ) : (
                  <div className="bg-background border border-border rounded-lg p-6 text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Inga tweets att visa</p>
                    <Button 
                      variant="outline" 
                      onClick={handleRefresh}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Uppdatera
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="fixed bottom-20 right-4 md:hidden">
                <Button 
                  size="icon"
                  className="rounded-full h-12 w-12 shadow-lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:flex lg:col-span-2 lg:flex-col space-y-4">
              {renderUserProfile()}
              
              <div className="sticky top-20">
                {renderSuggestedUsers()}
                
                {renderTrendingTopics()}
                
                {!isLoggedIn && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Välkommen till F3ociety</CardTitle>
                      <CardDescription>
                        En plattform för krypto-entusiaster att dela nyheter och insikter.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button className="w-full" asChild>
                          <Link to="/auth">Kom igång</Link>
                        </Button>
                        <Button variant="outline" className="w-full">
                          Läs mer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="text-xs text-muted-foreground mt-6 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <a href="#" className="hover:underline">Integritet</a>
                    <a href="#" className="hover:underline">Användarvillkor</a>
                    <a href="#" className="hover:underline">Cookie Policy</a>
                  </div>
                  <p>© 2023 F3ociety</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
