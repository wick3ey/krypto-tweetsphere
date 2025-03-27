import { useState, useEffect, useCallback, useRef } from 'react';
import EnhancedTweetCard from '@/components/feed/EnhancedTweetCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { Tweet } from '@/lib/types';
import ComposeDialog from '@/components/feed/ComposeDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { tweetService } from '@/api/tweetService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import ProfileCard from '@/components/profile/ProfileCard';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  // Changed default feed from 'trending' to 'latest'
  const [activeFeed, setActiveFeed] = useState('latest'); 
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstLoadRef = useRef(true);
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('jwt_token');
  
  // Store current user in localStorage for offline use
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_user', JSON.stringify(currentUser));
      console.log('Current user stored in localStorage:', currentUser);
    }
  }, [currentUser]);
  
  // Try to sync local tweets with server on initial load
  useEffect(() => {
    if (isLoggedIn) {
      tweetService.syncLocalTweets().then(result => {
        if (result.synced > 0) {
          console.log(`Synced ${result.synced} tweets with server`);
        }
      });
    }
  }, [isLoggedIn]);
  
  // Get local tweets for initialization and fallback
  const getLocalTweets = useCallback(() => {
    try {
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      console.log('Local tweets from storage:', localTweets);
      return localTweets;
    } catch (e) {
      console.error('Error parsing local tweets:', e);
      return [];
    }
  }, []);
  
  // Fetch tweets based on active feed
  const { data: apiTweets = [], isLoading: isLoadingTweets, refetch } = useQuery({
    queryKey: ['tweets', activeFeed],
    queryFn: async () => {
      console.log(`Fetching ${activeFeed} feed...`);
      if (activeFeed === 'trending') {
        return tweetService.getExploreFeed();
      } else if (activeFeed === 'following' && isLoggedIn) {
        return tweetService.getFeed();
      } else if (activeFeed === 'latest') {
        return tweetService.getExploreFeed();
      } else {
        // Default to explore feed
        return tweetService.getExploreFeed();
      }
    },
    // Reduced stale time to update more frequently
    staleTime: 15000, // 15 seconds
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    // Initialize with local tweets while waiting for API
    placeholderData: getLocalTweets, 
  });
  
  // Force refetch on first load
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      refetch();
    }
  }, [refetch]);
  
  // Make sure we have tweets, either from API or local storage
  const tweets = apiTweets && apiTweets.length > 0 ? apiTweets : getLocalTweets();
  console.log('Combined tweets to display:', tweets);
  
  // Tweet creation mutation
  const createTweetMutation = useMutation({
    mutationFn: (content: string) => tweetService.createTweet(content),
    onSuccess: (newTweet) => {
      console.log("Tweet created successfully:", newTweet);
      
      // Update the tweets list immediately without waiting for a refetch
      if (newTweet) {
        queryClient.setQueryData(['tweets', activeFeed], (oldData: any) => {
          const oldTweets = Array.isArray(oldData) ? oldData : [];
          console.log('Adding new tweet to existing tweets:', newTweet);
          return [newTweet, ...oldTweets];
        });
      }
      
      // Then invalidate the query to trigger a background refresh
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      
      // Also refetch to ensure we get the latest data
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error: any) => {
      console.error("Error creating tweet:", error);
      toast.error("Error creating tweet", {
        description: error.message || "Could not create tweet. Please try again."
      });
    },
  });
  
  const handleTweet = async (tweetContent: string): Promise<void> => {
    if (!tweetContent.trim()) return Promise.reject(new Error("Tweet content is empty"));
    
    console.log("Index: Submitting tweet:", tweetContent);
    // Return the promise from the mutation
    return createTweetMutation.mutateAsync(tweetContent);
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing tweets...");
    try {
      await refetch();
      toast.success("Tweets refreshed");
    } catch (error) {
      console.error('Error refreshing tweets:', error);
      toast.error("Failed to refresh tweets");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Render user profile if logged in
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

  // Normalize tweet data before rendering
  const normalizeAndRenderTweet = (tweet: any) => {
    if (!tweet) return null;
    
    // Skip tweets that don't have the required structure
    if (!tweet.user && (!tweet.userId || typeof tweet.userId !== 'object')) {
      console.warn('Tweet without user object:', tweet);
      return null;
    }
    
    return (
      <EnhancedTweetCard
        key={tweet.id || tweet._id || `tweet-${Math.random().toString(36).substring(2, 9)}`}
        tweet={tweet}
        animated={false}
      />
    );
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Compose Tweet (only show if logged in) */}
          {isLoggedIn && (
            <div className="bg-background border border-border rounded-lg p-4">
              <ComposeDialog onSubmit={handleTweet} />
            </div>
          )}
          
          {/* Feed Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 bg-background border border-border rounded-lg p-2">
            <Button 
              variant={activeFeed === 'trending' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveFeed('trending')}
            >
              Trending
            </Button>
            <Button 
              variant={activeFeed === 'latest' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveFeed('latest')}
            >
              Senaste
            </Button>
            <Button 
              variant={activeFeed === 'following' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveFeed('following')}
              disabled={!isLoggedIn}
            >
              Följer
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto flex items-center gap-1"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>
          
          {/* Tweets List */}
          <div className="space-y-4">
            {isLoadingTweets && tweets.length === 0 ? (
              <div className="text-center py-10 bg-background border border-border rounded-lg">
                <p>Laddar tweets...</p>
              </div>
            ) : (
              tweets.length > 0 ? (
                tweets.map((tweet: any) => normalizeAndRenderTweet(tweet))
              ) : (
                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-4">Inga tweets att visa</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Uppdatera
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col space-y-4">
          {/* User Profile */}
          {renderUserProfile()}
          
          {/* Simplified Sidebar Content */}
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Välkommen till F3ociety</h3>
            <p className="text-sm text-muted-foreground mb-4">
              En plattform för krypto-entusiaster att dela nyheter och insikter.
            </p>
            {!isLoggedIn && (
              <Link to="/setup-profile">
                <Button className="w-full">Kom igång</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
