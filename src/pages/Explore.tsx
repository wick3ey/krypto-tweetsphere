
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Compass, Filter, Search, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AnimatedCard from '@/components/common/AnimatedCard';
import { useQuery } from '@tanstack/react-query';
import { exploreService } from '@/api/exploreService';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { tag } = useParams<{ tag: string }>();
  
  // Fetch trending hashtags
  const { data: trendingData = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => exploreService.getTrending(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch suggested users
  const { data: suggestedUsers = [], isLoading: isLoadingSuggestedUsers } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => exploreService.getSuggestedUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch communities
  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => exploreService.getCommunities(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch tweets for specific hashtag if provided
  const { data: hashtagTweets = [], isLoading: isLoadingHashtagTweets } = useQuery({
    queryKey: ['hashtagTweets', tag],
    queryFn: () => exploreService.getHashtagTweets(tag || ''),
    enabled: !!tag,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
  
  // Set active tab based on params
  const [activeTab, setActiveTab] = useState('trending');
  
  useEffect(() => {
    // If tag is present, switch to trending tab since that shows hashtag content
    if (tag) {
      setActiveTab('trending');
    }
  }, [tag]);
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <main className="container max-w-4xl pt-20 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Explore</h1>
          <p className="text-muted-foreground">Discover the latest trends in crypto</p>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search topics, hashtags, or accounts" 
            className="pl-12 pr-12 py-6 bg-secondary rounded-full text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 glass-card">
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Compass className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="people">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              People
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trending" className="mt-6">
            {tag && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">#{tag}</h2>
                  <Button variant="outline" size="sm" as={Link} to="/explore">
                    Back to Explore
                  </Button>
                </div>
                
                {isLoadingHashtagTweets ? (
                  <div className="space-y-4 mt-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hashtagTweets.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    {hashtagTweets.map((tweet: any) => (
                      <AnimatedCard key={tweet.id} className="p-4">
                        <div className="flex gap-3">
                          <img src={tweet.user.avatarUrl} alt={tweet.user.displayName} className="h-10 w-10 rounded-full" />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{tweet.user.displayName}</span>
                              <span className="text-muted-foreground">@{tweet.user.username}</span>
                            </div>
                            <p className="mt-1">{tweet.content}</p>
                            <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                              <span>{tweet.likes} likes</span>
                              <span>{tweet.replies} replies</span>
                            </div>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground mt-8">No tweets found for #{tag}</p>
                )}
              </div>
            )}
            
            {!tag && (
              <div className="grid gap-6 md:grid-cols-2">
                <AnimatedCard className="p-4 overflow-hidden">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-crypto-blue" />
                    <h3 className="font-semibold">Trending Topics</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {isLoadingTrending ? (
                      Array(5).fill(0).map((_, i) => (
                        <div 
                          key={i} 
                          className="block p-3 rounded-lg animate-pulse"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="h-5 bg-muted rounded w-20"></div>
                              <div className="h-4 bg-muted rounded w-40"></div>
                            </div>
                            <div className="h-6 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      trendingData.topics?.map((item: any, index: number) => (
                        <Link 
                          key={item.tag} 
                          to={`/hashtag/${item.tag}`}
                          className="block hover:bg-secondary/50 p-3 rounded-lg transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">#{item.tag}</p>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <span className="bg-secondary px-2 py-1 rounded-full text-xs">
                              {item.tweets} tweets
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </AnimatedCard>
                
                <div className="space-y-6">
                  <AnimatedCard className="p-4" delay={100}>
                    <h3 className="font-semibold mb-4">Trending Coins</h3>
                    
                    <div className="space-y-3">
                      {isLoadingTrending ? (
                        Array(4).fill(0).map((_, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between p-2 rounded-lg animate-pulse"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-muted"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded w-20"></div>
                                <div className="h-3 bg-muted rounded w-12"></div>
                              </div>
                            </div>
                            <div className="space-y-2 text-right">
                              <div className="h-4 bg-muted rounded w-16"></div>
                              <div className="h-3 bg-muted rounded w-10"></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        trendingData.coins?.map((coin: any, index: number) => (
                          <div 
                            key={coin.symbol} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50 + 200}ms` }}
                          >
                            <div className="flex items-center space-x-3">
                              <img src={coin.logo} alt={coin.name} className="h-8 w-8" />
                              <div>
                                <p className="font-medium">{coin.name}</p>
                                <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono">{coin.price}</p>
                              <p className={cn(
                                "text-xs",
                                coin.change.startsWith("+") ? "text-crypto-green" : "text-crypto-red"
                              )}>
                                {coin.change}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AnimatedCard>
                  
                  <AnimatedCard className="p-4" delay={200}>
                    <h3 className="font-semibold mb-4">Hot Events</h3>
                    
                    <div className="space-y-3">
                      {isLoadingTrending ? (
                        Array(3).fill(0).map((_, i) => (
                          <div 
                            key={i} 
                            className="flex items-center space-x-3 p-2 rounded-lg animate-pulse"
                          >
                            <div className="h-12 w-12 rounded-lg bg-muted"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-muted rounded w-32"></div>
                              <div className="flex gap-2">
                                <div className="h-4 bg-muted rounded w-16"></div>
                                <div className="h-4 bg-muted rounded w-24"></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        trendingData.events?.map((event: any, index: number) => (
                          <div 
                            key={event.name} 
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50 + 300}ms` }}
                          >
                            <img src={event.image} alt={event.name} className="h-12 w-12 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs bg-crypto-blue/10 text-crypto-blue px-2 py-0.5 rounded-full">
                                  {event.type}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">{event.date}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AnimatedCard>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {isLoadingCommunities ? (
                Array(6).fill(0).map((_, i) => (
                  <AnimatedCard 
                    key={i} 
                    className="overflow-hidden"
                    delay={i * 100}
                  >
                    <div className="h-36 bg-muted animate-pulse"></div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-6 bg-muted rounded w-12"></div>
                    </div>
                  </AnimatedCard>
                ))
              ) : (
                communities.topics?.map((topic: any, index: number) => (
                  <AnimatedCard 
                    key={topic.title} 
                    className="overflow-hidden hover-scale"
                    delay={index * 100}
                  >
                    <div className="relative h-36">
                      <img 
                        src={topic.image} 
                        alt={topic.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-block px-2 py-1 bg-crypto-blue text-white text-xs rounded-full">
                          {topic.category}
                        </span>
                        <h3 className="text-white font-medium mt-1">{topic.title}</h3>
                      </div>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{topic.articles} articles</span>
                      <Button variant="ghost" size="sm" className="text-crypto-blue">
                        View
                      </Button>
                    </div>
                  </AnimatedCard>
                ))
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Featured Projects</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                {isLoadingCommunities ? (
                  Array(2).fill(0).map((_, i) => (
                    <AnimatedCard 
                      key={i} 
                      className="p-4 animate-pulse"
                      delay={600 + i * 100}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between">
                            <div className="h-5 bg-muted rounded w-32"></div>
                            <div className="h-5 bg-muted rounded w-16"></div>
                          </div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          
                          <div className="mt-3 flex space-x-4">
                            <div className="h-12 w-20 bg-muted rounded"></div>
                            <div className="h-12 w-20 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))
                ) : (
                  communities.projects?.map((project: any, index: number) => (
                    <AnimatedCard 
                      key={project.name} 
                      className="p-4"
                      delay={600 + index * 100}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-crypto-blue/10">
                          <img src={project.logo} alt={project.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{project.name}</h4>
                            <span className="bg-secondary px-2 py-0.5 rounded-full text-xs">
                              {project.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          
                          <div className="mt-3 flex space-x-4">
                            {Object.entries(project.stats).map(([key, value]) => (
                              <div key={key} className="bg-secondary/50 px-3 py-1 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase">{key}</span>
                                <p className="font-medium">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="people" className="mt-6">
            <div className="space-y-6">
              <AnimatedCard className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">People to Follow</h3>
                </div>
                
                <div className="divide-y divide-border">
                  {isLoadingSuggestedUsers ? (
                    Array(5).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className="p-4 animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-muted"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                              <div className="h-3 bg-muted rounded w-32"></div>
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    suggestedUsers.map((user: any, index: number) => (
                      <div 
                        key={user.id} 
                        className="p-4 hover:bg-secondary/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <Link to={`/profile/${user.username}`} className="flex items-center space-x-3">
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName}
                              className="h-12 w-12 rounded-full object-cover border border-border"
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
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                            </div>
                          </Link>
                          <Button size="sm" className="rounded-full">Follow</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-4" delay={300}>
                <h3 className="font-semibold mb-4">Communities</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {isLoadingCommunities ? (
                    Array(4).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border animate-pulse"
                      >
                        <div className="h-12 w-12 rounded-lg bg-muted"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    communities.groups?.map((community: any, index: number) => (
                      <div 
                        key={community.name} 
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50 + 400}ms` }}
                      >
                        <img 
                          src={community.image} 
                          alt={community.name} 
                          className="h-12 w-12 rounded-lg"
                        />
                        <div>
                          <p className="font-medium">{community.name}</p>
                          <p className="text-xs text-muted-foreground">{community.members} members</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </AnimatedCard>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Explore;
