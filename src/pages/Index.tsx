
import { useState, useEffect } from 'react';
import EnhancedTweetCard from '@/components/feed/EnhancedTweetCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import TokenTicker from '@/components/crypto/TokenTicker';
import TrendingTopics from '@/components/crypto/TrendingTopics';
import CryptoNews from '@/components/crypto/CryptoNews';
import MarketStats from '@/components/crypto/MarketStats';
import NFTGallery from '@/components/crypto/NFTGallery';
import { Sparkles, Zap, Lightbulb, Filter, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";
import { Tweet, User } from '@/lib/types';
import ComposeDialog from '@/components/feed/ComposeDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { tweetService } from '@/api/tweetService';
import { authService } from '@/api/authService';
import { exploreService } from '@/api/exploreService';
import { userService } from '@/api/userService'; // Added missing import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const [activeFeed, setActiveFeed] = useState('trending'); // trending, latest, following
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Fetch tweets based on active feed
  const { data: tweets = [], isLoading: isLoadingTweets } = useQuery({
    queryKey: ['tweets', activeFeed],
    queryFn: async () => {
      if (activeFeed === 'trending') {
        return tweetService.getExploreFeed();
      } else if (activeFeed === 'following') {
        return tweetService.getFeed();
      } else {
        // Latest feed
        return tweetService.getExploreFeed(); // You may need to add sort=latest param
      }
    },
    staleTime: 60000, // 1 minute
  });
  
  // Fetch suggested users
  const { data: suggestedUsers = [], isLoading: isLoadingSuggestedUsers } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => exploreService.getSuggestedUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Tweet creation mutation
  const createTweetMutation = useMutation({
    mutationFn: (content: string) => tweetService.createTweet(content),
    onSuccess: () => {
      // Invalidate tweets query to refetch
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      
      toast({
        title: "Tweet publicerad!",
        description: "Din tweet har publicerats.",
      });
    },
    onError: (error) => {
      console.error("Error creating tweet:", error);
      toast({
        title: "Error",
        description: "Could not create tweet. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleTweet = (tweetContent: string) => {
    if (!tweetContent.trim()) return;
    
    // Submit the tweet using the mutation
    createTweetMutation.mutate(tweetContent);
  };
  
  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: (userId: string) => {
      return userService.followUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      toast({
        title: "Success",
        description: "You are now following this user.",
      });
    },
  });
  
  const handleFollowUser = (userId: string) => {
    followUserMutation.mutate(userId);
  };
  
  return (
    <>
      <TokenTicker speed="slow" />
      
      <main className="container max-w-7xl pt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop and Mobile Compose Tweet */}
            <ComposeDialog onSubmit={handleTweet} />
            
            <div className="flex items-center justify-between overflow-x-auto">
              <div className="flex gap-2 pb-2 scrollbar-none w-fit">
                <Button 
                  variant={activeFeed === 'trending' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1 whitespace-nowrap"
                  onClick={() => setActiveFeed('trending')}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Trending
                </Button>
                <Button 
                  variant={activeFeed === 'latest' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1 whitespace-nowrap"
                  onClick={() => setActiveFeed('latest')}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Senaste
                </Button>
                <Button 
                  variant={activeFeed === 'following' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1 whitespace-nowrap"
                  onClick={() => setActiveFeed('following')}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Följer
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full flex items-center gap-1 shrink-0"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </div>
            
            <div className="space-y-4">
              {isLoadingTweets ? (
                Array(5).fill(0).map((_, index) => (
                  <div 
                    key={index} 
                    className="crypto-card p-4 animate-pulse space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="rounded-full bg-muted/50 h-10 w-10 shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="flex justify-between">
                          <div className="h-4 bg-muted/50 rounded w-1/3"></div>
                          <div className="h-4 bg-muted/50 rounded w-1/5"></div>
                        </div>
                        <div className="h-4 bg-muted/50 rounded w-full"></div>
                        <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                        <div className="flex justify-between pt-2">
                          <div className="h-6 bg-muted/50 rounded w-1/6"></div>
                          <div className="h-6 bg-muted/50 rounded w-1/6"></div>
                          <div className="h-6 bg-muted/50 rounded w-1/6"></div>
                          <div className="h-6 bg-muted/50 rounded w-1/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                tweets.map((tweet: Tweet) => (
                  tweet && tweet.user ? (
                    <EnhancedTweetCard
                      key={tweet.id}
                      tweet={tweet}
                      animated={true}
                    />
                  ) : null
                ))
              )}
            </div>
          </div>
          
          <div className="hidden lg:flex lg:flex-col space-y-6">
            <MarketStats />
            
            <TrendingTopics />
            
            <CryptoNews />
            
            <NFTGallery />
            
            <AnimatedCard className="p-4" delay={250}>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-crypto-blue" />
                <h3 className="font-semibold">Vem att följa</h3>
              </div>
              
              <div className="space-y-3">
                {isLoadingSuggestedUsers ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-2 animate-pulse">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-muted/50"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-24"></div>
                          <div className="h-3 bg-muted/50 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-muted/50 rounded w-16"></div>
                    </div>
                  ))
                ) : (
                  suggestedUsers.slice(0, 3).map((user: User) => (
                    <div key={user.id} className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-colors",
                      "hover:bg-secondary/50 group"
                    )}>
                      <Link to={`/profile/${user.username}`} className="flex items-center space-x-2">
                        <div className="relative">
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className={cn(
                              "h-10 w-10 rounded-full object-cover border border-border/50",
                              "transition-transform duration-300 group-hover:scale-110"
                            )}
                          />
                          {user.verified && (
                            <Badge className="absolute -bottom-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-crypto-blue text-white">
                              <Shield className="h-2.5 w-2.5" />
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center font-medium text-sm">
                            {user.displayName}
                            {user.verified && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-crypto-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full text-xs group-hover:bg-primary group-hover:text-white"
                        onClick={() => handleFollowUser(user.id)}
                      >
                        Följ
                      </Button>
                    </div>
                  ))
                )}
                <Button variant="ghost" className="w-full text-xs text-crypto-blue">
                  Visa mer
                </Button>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
