import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import EnhancedTweetCard from '@/components/feed/EnhancedTweetCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import TokenTicker from '@/components/crypto/TokenTicker';
import TrendingTopics from '@/components/crypto/TrendingTopics';
import CryptoNews from '@/components/crypto/CryptoNews';
import MarketStats from '@/components/crypto/MarketStats';
import NFTGallery from '@/components/crypto/NFTGallery';
import { mockTweets, suggestedUsers } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Sparkles, Zap, Lightbulb, Filter, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Index = () => {
  const [tweets, setTweets] = useState(mockTweets);
  const [tweetContent, setTweetContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeed, setActiveFeed] = useState('trending'); // trending, latest, following
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <TokenTicker />
      
      <main className="container max-w-7xl pt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatedCard className="p-4">
              <div className="flex space-x-3">
                <img
                  src="https://api.dicebear.com/7.x/identicon/svg?seed=satoshi"
                  alt="Your profile"
                  className="h-10 w-10 rounded-full object-cover border border-border"
                />
                <div className="flex-1">
                  <Input
                    placeholder="What's happening in the cryptoverse?"
                    className="border-none crypto-input text-base shadow-none focus-visible:ring-0 p-0 h-auto"
                    value={tweetContent}
                    onChange={(e) => setTweetContent(e.target.value)}
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="rounded-full text-crypto-blue">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full text-crypto-blue">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full text-crypto-blue">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                          <line x1="9" x2="9.01" y1="9" y2="9" />
                          <line x1="15" x2="15.01" y1="9" y2="9" />
                        </svg>
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-full" 
                      disabled={!tweetContent.trim()}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Tweet
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant={activeFeed === 'trending' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1"
                  onClick={() => setActiveFeed('trending')}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Trending
                </Button>
                <Button 
                  variant={activeFeed === 'latest' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1"
                  onClick={() => setActiveFeed('latest')}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Latest
                </Button>
                <Button 
                  variant={activeFeed === 'following' ? 'default' : 'outline'} 
                  size="sm" 
                  className="rounded-full flex items-center gap-1"
                  onClick={() => setActiveFeed('following')}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Following
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full flex items-center gap-1"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <div 
                    key={index} 
                    className="crypto-card p-4 animate-pulse space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="rounded-full bg-muted/50 h-10 w-10"></div>
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
                tweets.map((tweet, index) => (
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
                <h3 className="font-semibold">Who to follow</h3>
              </div>
              
              <div className="space-y-3">
                {suggestedUsers.slice(0, 3).map((user) => (
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
                    <Button variant="outline" size="sm" className="rounded-full text-xs group-hover:bg-primary group-hover:text-white">
                      Follow
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-xs text-crypto-blue">
                  Show more
                </Button>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
