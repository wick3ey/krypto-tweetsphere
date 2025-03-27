
import { useState } from 'react';
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

const Index = () => {
  const [activeFeed, setActiveFeed] = useState('trending'); // trending, latest, following
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('jwt_token');
  
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
        return tweetService.getExploreFeed();
      }
    },
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Tweet creation mutation
  const createTweetMutation = useMutation({
    mutationFn: (content: string) => tweetService.createTweet(content),
    onSuccess: () => {
      // Invalidate tweets query to refetch
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
    onError: (error: any) => {
      console.error("Error creating tweet:", error);
    },
  });
  
  const handleTweet = async (tweetContent: string): Promise<void> => {
    if (!tweetContent.trim()) return Promise.reject(new Error("Tweet content is empty"));
    
    if (!isLoggedIn) {
      toast.error("Authentication required", {
        description: "Please connect your wallet to post tweets"
      });
      return Promise.reject(new Error("Not authenticated"));
    }
    
    // Return the promise from the mutation
    return createTweetMutation.mutateAsync(tweetContent);
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
  
  return (
    <div className="container max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Compose Tweet */}
          <div className="bg-background border border-border rounded-lg p-4">
            <ComposeDialog onSubmit={handleTweet} />
          </div>
          
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
          </div>
          
          {/* Tweets List */}
          <div className="space-y-4">
            {isLoadingTweets ? (
              <div className="text-center py-10">
                <p>Laddar tweets...</p>
              </div>
            ) : (
              Array.isArray(tweets) && tweets.length > 0 ? (
                tweets.map((tweet: Tweet) => (
                  tweet && tweet.user ? (
                    <EnhancedTweetCard
                      key={tweet.id}
                      tweet={tweet}
                      animated={false}
                    />
                  ) : null
                ))
              ) : (
                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-4">Inga tweets att visa</p>
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['tweets', activeFeed] })}
                  >
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
