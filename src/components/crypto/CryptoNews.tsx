
import { useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
  category: string;
  imageUrl?: string;
};

const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Ethereum Layer 2 Solutions Reach All-Time High in Transaction Volume',
    source: 'CryptoNews',
    url: '#',
    timestamp: '2023-11-15T10:30:00Z',
    category: 'Ethereum',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=ethereum'
  },
  {
    id: '2',
    title: 'DeFi Protocol Launches New Liquidity Mining Program',
    source: 'BlockchainInsider',
    url: '#',
    timestamp: '2023-11-15T08:45:00Z',
    category: 'DeFi',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=defi'
  },
  {
    id: '3',
    title: 'Major Exchange Adds Support for Zero-Knowledge Rollups',
    source: 'CoinDesk',
    url: '#',
    timestamp: '2023-11-14T15:20:00Z',
    category: 'Exchange',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=exchange'
  },
  {
    id: '4',
    title: 'NFT Marketplace Reduces Fees to Attract More Artists',
    source: 'NFTWorld',
    url: '#',
    timestamp: '2023-11-14T12:10:00Z',
    category: 'NFT',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=nft'
  },
  {
    id: '5',
    title: 'New DAO Governance Model Proposed to Enhance Decentralization',
    source: 'DAOTimes',
    url: '#',
    timestamp: '2023-11-13T22:15:00Z',
    category: 'DAO',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=dao'
  }
];

const CryptoNews = () => {
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  
  const toggleExpand = (id: string) => {
    setExpandedNews(expandedNews === id ? null : id);
  };
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ethereum': return 'bg-[#627EEA]/20 text-[#627EEA]';
      case 'defi': return 'bg-crypto-purple/20 text-crypto-purple';
      case 'nft': return 'bg-crypto-green/20 text-crypto-green';
      case 'dao': return 'bg-crypto-blue/20 text-crypto-blue';
      case 'exchange': return 'bg-crypto-yellow/20 text-crypto-yellow';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };
  
  return (
    <div className="crypto-card p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Newspaper className="h-5 w-5 text-crypto-blue" />
        <h3 className="font-semibold text-lg">Crypto News</h3>
      </div>
      
      <div className="space-y-4">
        {newsItems.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "rounded-lg overflow-hidden border border-border/50 hover:border-border transition-all duration-300",
              "hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
            )}
            onClick={() => toggleExpand(item.id)}
          >
            <div className="flex overflow-hidden">
              {item.imageUrl && (
                <div className="w-20 h-20 shrink-0 bg-muted">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-3 w-full">
                <div className="flex justify-between items-start">
                  <h4 className={cn(
                    "font-medium text-sm",
                    expandedNews === item.id ? "" : "line-clamp-2"
                  )}>
                    {item.title}
                  </h4>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <Badge className={cn("text-xs", getCategoryColor(item.category))}>
                    {item.category}
                  </Badge>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
                
                {expandedNews === item.id && (
                  <div className="mt-2 flex justify-end">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs flex items-center text-crypto-blue hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read full article <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoNews;
