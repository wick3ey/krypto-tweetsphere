
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import TweetCard from '@/components/feed/TweetCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import { mockTweets, suggestedUsers } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [tweets, setTweets] = useState(mockTweets);
  const [tweetContent, setTweetContent] = useState('');
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container max-w-4xl pt-20 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <AnimatedCard className="p-4">
              <div className="flex space-x-3">
                <img
                  src="https://api.dicebear.com/7.x/identicon/svg?seed=satoshi"
                  alt="Your profile"
                  className="h-10 w-10 rounded-full object-cover border border-border"
                />
                <div className="flex-1">
                  <Input
                    placeholder="What's happening in crypto?"
                    className="border-none text-base shadow-none focus-visible:ring-0 p-0 h-auto"
                    value={tweetContent}
                    onChange={(e) => setTweetContent(e.target.value)}
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-crypto-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-crypto-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </Button>
                    </div>
                    <Button size="sm" className="rounded-full" disabled={!tweetContent.trim()}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Tweet
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
            
            <div className="space-y-3">
              {tweets.map((tweet, index) => (
                <TweetCard 
                  key={tweet.id} 
                  tweet={tweet} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))}
            </div>
          </div>
          
          <div className="hidden md:block space-y-6">
            <AnimatedCard className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-crypto-blue" />
                <h3 className="font-semibold">Trending in Crypto</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { tag: "Bitcoin", tweets: "120K" },
                  { tag: "Ethereum", tweets: "85K" },
                  { tag: "NFT", tweets: "42K" },
                  { tag: "DeFi", tweets: "36K" },
                  { tag: "Web3", tweets: "24K" }
                ].map((item) => (
                  <div key={item.tag} className="hover:bg-secondary/50 p-2 rounded-md transition-colors">
                    <Link to={`/hashtag/${item.tag}`} className="block">
                      <p className="font-medium">#{item.tag}</p>
                      <p className="text-xs text-muted-foreground">{item.tweets} tweets</p>
                    </Link>
                  </div>
                ))}
              </div>
            </AnimatedCard>
            
            <AnimatedCard className="p-4" delay={150}>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-crypto-blue" />
                <h3 className="font-semibold">Who to follow</h3>
              </div>
              
              <div className="space-y-4">
                {suggestedUsers.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center justify-between hover:bg-secondary/50 p-2 rounded-md transition-colors">
                    <Link to={`/profile/${user.username}`} className="flex items-center space-x-2">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{user.displayName}</p>
                          {user.verified && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-crypto-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </Link>
                    <Button variant="outline" size="sm" className="rounded-full text-xs">Follow</Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-crypto-blue">Show more</Button>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
