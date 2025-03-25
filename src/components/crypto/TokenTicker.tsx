
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenTickerProps {
  className?: string;
  speed?: 'slow' | 'medium' | 'fast';
}

const tokenData = [
  { symbol: 'BTC', name: 'Bitcoin', price: 58642.23, change: 2.3 },
  { symbol: 'ETH', name: 'Ethereum', price: 2943.16, change: 1.7 },
  { symbol: 'BNB', name: 'Binance Coin', price: 412.94, change: -0.8 },
  { symbol: 'SOL', name: 'Solana', price: 103.22, change: 4.2 },
  { symbol: 'ADA', name: 'Cardano', price: 0.53, change: -1.2 },
  { symbol: 'XRP', name: 'Ripple', price: 0.58, change: 0.3 },
  { symbol: 'DOT', name: 'Polkadot', price: 6.87, change: 2.1 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.13, change: 5.2 },
  { symbol: 'AVAX', name: 'Avalanche', price: 36.42, change: -2.4 },
  { symbol: 'SHIB', name: 'Shiba Inu', price: 0.00002784, change: 3.7 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.64, change: 0.9 },
  { symbol: 'LINK', name: 'Chainlink', price: 14.27, change: 2.6 },
  { symbol: 'UNI', name: 'Uniswap', price: 7.92, change: -1.4 },
  { symbol: 'ATOM', name: 'Cosmos', price: 8.21, change: 1.1 },
  { symbol: 'FTM', name: 'Fantom', price: 0.57, change: 3.3 },
];

const TokenTicker = ({ className, speed = 'medium' }: TokenTickerProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow': return '60s';
      case 'fast': return '20s';
      case 'medium':
      default: return '40s';
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition(prev => (prev + 1) % tokenData.length);
    }, speed === 'slow' ? 5000 : speed === 'medium' ? 3000 : 2000);
    
    return () => clearInterval(interval);
  }, [speed]);
  
  return (
    <div className={cn(
      "bg-background/90 backdrop-blur-lg border-b border-border/50 overflow-hidden sticky top-16 z-40 flex py-2 h-12",
      className
    )}>
      <div className="flex items-center px-3 font-semibold text-xs md:text-sm text-crypto-blue">
        <span className="hidden md:inline">CRYPTO</span>
        <span className="md:hidden">$</span>
      </div>
      
      <div className="flex items-center overflow-hidden flex-1 relative">
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10"></div>
        
        <div 
          className="flex animate-none space-x-6 whitespace-nowrap px-4"
          style={{
            transition: "transform 0.5s ease-in-out",
            transform: `translateX(-${scrollPosition * 150}px)`,
          }}
        >
          {tokenData.map((token, index) => (
            <div 
              key={`${token.symbol}-${index}`} 
              className="flex items-center space-x-2 text-sm"
            >
              <span className="font-medium">{token.symbol}</span>
              <span className="hidden md:inline text-muted-foreground text-xs">{token.name}</span>
              <div className="flex items-center">
                <span className="font-medium">
                  {token.symbol === 'SHIB' 
                    ? token.price.toFixed(8) 
                    : token.price < 1 
                      ? token.price.toFixed(4) 
                      : token.price.toFixed(2)}
                </span>
                <div className={cn(
                  "flex items-center ml-1",
                  token.change >= 0 ? "text-crypto-green" : "text-crypto-red"
                )}>
                  {token.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span className="text-xs">{Math.abs(token.change).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenTicker;
