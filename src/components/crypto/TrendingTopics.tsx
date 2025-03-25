
import { useState } from 'react';
import { TrendingUp, Zap, BarChart, Globe, Users, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TrendingTopic = {
  id: string;
  title: string;
  count: number;
  category: 'token' | 'defi' | 'nft' | 'web3' | 'community' | 'news';
  isHot?: boolean;
};

const trendingTopics: TrendingTopic[] = [
  { id: '1', title: 'Ethereum Merge', count: 54321, category: 'token', isHot: true },
  { id: '2', title: 'NFT Winter', count: 32876, category: 'nft' },
  { id: '3', title: 'DeFi Yield', count: 28543, category: 'defi' },
  { id: '4', title: 'Governance Proposals', count: 26432, category: 'community' },
  { id: '5', title: 'zkEVM', count: 21098, category: 'web3', isHot: true },
  { id: '6', title: 'Layer 2 Scaling', count: 19765, category: 'web3' },
  { id: '7', title: 'SEC Crypto', count: 18321, category: 'news' },
  { id: '8', title: 'MetaMask', count: 15678, category: 'web3' },
  { id: '9', title: 'Solana Mobile', count: 14532, category: 'token' },
  { id: '10', title: 'DAO Treasury', count: 13654, category: 'defi' },
];

const TrendingTopics = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const filteredTopics = activeCategory 
    ? trendingTopics.filter(topic => topic.category === activeCategory)
    : trendingTopics;

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'token': return <BarChart className="h-4 w-4 text-crypto-blue" />;
      case 'defi': return <Zap className="h-4 w-4 text-crypto-yellow" />;
      case 'nft': return <Globe className="h-4 w-4 text-crypto-purple" />;
      case 'web3': return <Users className="h-4 w-4 text-crypto-green" />;
      case 'community': return <Users className="h-4 w-4 text-crypto-blue" />;
      case 'news': return <MessageSquare className="h-4 w-4 text-crypto-red" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="crypto-card p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-crypto-blue" />
          <h3 className="font-semibold text-lg">Trending Topics</h3>
        </div>
        
        <Badge variant="outline" className="animate-pulse-slow border-crypto-blue/30 text-crypto-blue">
          <Zap className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeCategory === null ? "default" : "outline"}
          size="sm"
          className="rounded-full text-xs"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {['token', 'defi', 'nft', 'web3', 'community', 'news'].map(category => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            className="rounded-full text-xs"
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>
      
      <div className="space-y-3 mt-3">
        {filteredTopics.map(topic => (
          <div 
            key={topic.id} 
            className={cn(
              "trending-item group",
              topic.isHot && "border-l-2 border-crypto-red pl-2"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {getCategoryIcon(topic.category)}
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    #{topic.title}
                    {topic.isHot && (
                      <span className="ml-2 text-crypto-red text-xs">
                        🔥 Hot
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(topic.count)} tweets
                  </p>
                </div>
              </div>
              
              <Badge 
                variant="outline" 
                className="text-[10px] capitalize bg-secondary/30"
              >
                {topic.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <Button variant="ghost" className="w-full text-xs text-crypto-blue mt-2">
        Show more
      </Button>
    </div>
  );
};

export default TrendingTopics;
