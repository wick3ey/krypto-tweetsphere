
import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const MarketStats = () => {
  const [stats, setStats] = useState({
    marketCap: 2.73,
    volume24h: 64.5,
    dominanceBTC: 51.2,
    dominanceETH: 18.7,
    fearGreedIndex: 65,
    activeCryptocurrencies: 21572,
    activeExchanges: 584,
  });
  
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        marketCap: +(prev.marketCap * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2),
        volume24h: +(prev.volume24h * (1 + (Math.random() * 0.01 - 0.005))).toFixed(1),
        dominanceBTC: +(prev.dominanceBTC + (Math.random() * 0.2 - 0.1)).toFixed(1),
        dominanceETH: +(prev.dominanceETH + (Math.random() * 0.2 - 0.1)).toFixed(1),
        fearGreedIndex: Math.min(100, Math.max(0, Math.floor(prev.fearGreedIndex + (Math.random() * 4 - 2)))),
      }));
      
      // Trigger the pulse animation
      setPulsing(true);
      setTimeout(() => setPulsing(false), 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getFearGreedColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    if (value >= 20) return 'text-orange-400';
    return 'text-red-500';
  };
  
  const formatNumber = (num: number, suffix: string = '') => {
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(2)}T${suffix}`;
    }
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B${suffix}`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M${suffix}`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K${suffix}`;
    }
    return `${num}${suffix}`;
  };
  
  return (
    <div className="crypto-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-crypto-blue" />
        <h3 className="font-semibold text-lg">Market Stats</h3>
        <Badge 
          variant="outline" 
          className={cn(
            "ml-auto text-xs border border-crypto-blue/20 text-crypto-blue",
            pulsing && "bg-crypto-blue/10"
          )}
        >
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crypto-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-crypto-blue"></span>
          </span>
          Live
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4 mr-1" />
              Total Market Cap
            </div>
            <div className="text-xl font-mono font-medium">
              ${formatNumber(stats.marketCap * 1000000000000)}
            </div>
          </div>
          
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="h-4 w-4 mr-1" />
              24h Volume
            </div>
            <div className="text-xl font-mono font-medium">
              ${formatNumber(stats.volume24h * 1000000000)}
            </div>
          </div>
          
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Active Cryptocurrencies
            </div>
            <div className="text-xl font-mono font-medium">
              {stats.activeCryptocurrencies.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              BTC Dominance
            </div>
            <div className="text-xl font-mono font-medium">
              {stats.dominanceBTC}%
            </div>
          </div>
          
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              ETH Dominance
            </div>
            <div className="text-xl font-mono font-medium">
              {stats.dominanceETH}%
            </div>
          </div>
          
          <div className={cn(
            "transition-all duration-300",
            pulsing && "scale-105"
          )}>
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="h-4 w-4 mr-1" />
              Fear & Greed Index
            </div>
            <div className={cn(
              "text-xl font-mono font-medium flex items-center",
              getFearGreedColor(stats.fearGreedIndex)
            )}>
              {stats.fearGreedIndex}
              <span className="text-xs ml-2">
                {stats.fearGreedIndex >= 80 ? 'Extreme Greed' :
                  stats.fearGreedIndex >= 60 ? 'Greed' :
                  stats.fearGreedIndex >= 40 ? 'Neutral' :
                  stats.fearGreedIndex >= 20 ? 'Fear' :
                  'Extreme Fear'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStats;
