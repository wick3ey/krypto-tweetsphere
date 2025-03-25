
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ProfileCard from '@/components/profile/ProfileCard';
import TweetCard from '@/components/feed/TweetCard';
import PnLChart from '@/components/dashboard/PnLChart';
import AnimatedCard from '@/components/common/AnimatedCard';
import { mockTweets, userProfile } from '@/lib/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Clock, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

const Profile = () => {
  const userTweets = mockTweets.filter(tweet => tweet.user.id === userProfile.id);
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container max-w-4xl pt-20 px-4">
        <div className="space-y-6">
          <ProfileCard profile={userProfile} />
          
          <Tabs defaultValue="tweets" className="w-full">
            <TabsList className="grid grid-cols-4 glass-card">
              <TabsTrigger value="tweets">Tweets</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tweets" className="mt-6 space-y-4">
              {userTweets.length > 0 ? (
                userTweets.map((tweet, index) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))
              ) : (
                <AnimatedCard className="p-6 text-center">
                  <p className="text-muted-foreground">No tweets yet</p>
                </AnimatedCard>
              )}
            </TabsContent>
            
            <TabsContent value="portfolio" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <AnimatedCard className="p-4">
                  <h3 className="text-lg font-medium mb-4">Total Balance</h3>
                  <p className="text-3xl font-mono font-semibold">${userProfile.totalBalance.toLocaleString()}</p>
                  
                  <div className="mt-6 space-y-4">
                    {userProfile.tokens.map((token) => (
                      <div key={token.symbol} className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3">
                          <img src={token.logo} alt={token.symbol} className="h-8 w-8" />
                          <div>
                            <p className="font-medium">{token.token}</p>
                            <p className="text-xs text-muted-foreground">{token.amount} {token.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">${token.valueUSD.toLocaleString()}</p>
                          <p className={cn(
                            "text-xs",
                            token.change24h >= 0 ? "text-crypto-green" : "text-crypto-red"
                          )}>
                            {token.change24h >= 0 ? "+" : ""}{token.change24h}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedCard>
                
                <PnLChart data={userProfile.pnlData} />
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              <AnimatedCard className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-medium">Recent Transactions</h3>
                </div>
                
                <div className="divide-y divide-border">
                  {userProfile.transactions.map((tx) => (
                    <div key={tx.id} className="p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            tx.type === 'buy' ? "bg-crypto-green/10 text-crypto-green" : 
                            tx.type === 'sell' ? "bg-crypto-red/10 text-crypto-red" : 
                            "bg-crypto-blue/10 text-crypto-blue"
                          )}>
                            {tx.type === 'buy' && <ArrowDown className="h-5 w-5" />}
                            {tx.type === 'sell' && <ArrowUp className="h-5 w-5" />}
                            {tx.type === 'swap' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 10H3" />
                                <path d="m21 6-4 4 4 4" />
                                <path d="M7 14h14" />
                                <path d="m3 18 4-4-4-4" />
                              </svg>
                            )}
                            {tx.type === 'transfer' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 19V5" />
                                <path d="m5 12 7-7 7 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium capitalize">{tx.type}</p>
                              <img src={tx.tokenLogo} alt={tx.tokenSymbol} className="h-4 w-4 ml-2" />
                              <p className="ml-1">{tx.tokenSymbol}</p>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{new Date(tx.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{tx.type === 'sell' ? '-' : '+'}{tx.amount} {tx.tokenSymbol}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Hash: {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedCard>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <AnimatedCard className="p-4 flex flex-col items-center justify-center text-center">
                  <Layout className="h-12 w-12 text-crypto-blue mb-4" />
                  <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mt-2">Advanced analytics coming soon</p>
                </AnimatedCard>
                
                <div className="space-y-6">
                  <AnimatedCard className="p-4">
                    <h3 className="text-lg font-medium mb-2">Trading Activity</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-muted-foreground text-sm">Total Trades</p>
                        <p className="text-2xl font-mono mt-1">32</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-muted-foreground text-sm">Win Rate</p>
                        <p className="text-2xl font-mono mt-1">68%</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-muted-foreground text-sm">Avg. Return</p>
                        <p className="text-2xl font-mono mt-1">+12.4%</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-muted-foreground text-sm">Best Trade</p>
                        <p className="text-2xl font-mono mt-1">+47.8%</p>
                      </div>
                    </div>
                  </AnimatedCard>
                  
                  <AnimatedCard className="p-4" delay={100}>
                    <h3 className="text-lg font-medium mb-2">Portfolio Allocation</h3>
                    <div className="mt-4 flex justify-around">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full border-4 border-crypto-blue/70"></div>
                        <p className="text-xs mt-1">BTC</p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full border-4 border-crypto-blue/70 border-l-crypto-green/70 border-r-crypto-green/70"></div>
                        <p className="text-xs mt-1">ETH</p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full border-4 border-crypto-green/70 border-b-crypto-blue/70"></div>
                        <p className="text-xs mt-1">USDC</p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full border-4 border-crypto-blue/30 border-t-crypto-green/70 border-b-crypto-red/70"></div>
                        <p className="text-xs mt-1">Others</p>
                      </div>
                    </div>
                  </AnimatedCard>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
