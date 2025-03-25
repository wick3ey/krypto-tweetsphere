
import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type TokenData = {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
};

const mockTokens: TokenData[] = [
  { name: 'Bitcoin', symbol: 'BTC', price: 68254.35, change24h: 2.5 },
  { name: 'Ethereum', symbol: 'ETH', price: 3421.76, change24h: 1.3 },
  { name: 'Solana', symbol: 'SOL', price: 143.87, change24h: 5.1 },
  { name: 'Cardano', symbol: 'ADA', price: 0.56, change24h: -1.2 },
  { name: 'Polkadot', symbol: 'DOT', price: 7.84, change24h: 3.2 },
  { name: 'Avalanche', symbol: 'AVAX', price: 35.62, change24h: 4.7 },
  { name: 'Chainlink', symbol: 'LINK', price: 14.53, change24h: 2.8 },
  { name: 'Uniswap', symbol: 'UNI', price: 10.24, change24h: -0.5 },
  { name: 'Polygon', symbol: 'MATIC', price: 0.89, change24h: 1.7 },
  { name: 'Arbitrum', symbol: 'ARB', price: 1.23, change24h: 6.5 },
  { name: 'Dogecoin', symbol: 'DOGE', price: 0.13, change24h: -2.1 },
  { name: 'Shiba Inu', symbol: 'SHIB', price: 0.000022, change24h: 3.8 },
  { name: 'Binance Coin', symbol: 'BNB', price: 572.38, change24h: 0.9 },
  { name: 'XRP', symbol: 'XRP', price: 0.58, change24h: -0.7 },
  { name: 'Litecoin', symbol: 'LTC', price: 78.91, change24h: 1.5 },
  { name: 'Cosmos', symbol: 'ATOM', price: 8.72, change24h: 2.3 },
  { name: 'Near Protocol', symbol: 'NEAR', price: 5.63, change24h: 4.2 },
  { name: 'Algorand', symbol: 'ALGO', price: 0.18, change24h: -1.8 },
  { name: 'Optimism', symbol: 'OP', price: 2.84, change24h: 7.1 },
  { name: 'Fantom', symbol: 'FTM', price: 0.53, change24h: 3.4 },
];

const TokenTicker = () => {
  const [tokens, setTokens] = useState(mockTokens);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prevTokens => 
        prevTokens.map(token => ({
          ...token,
          price: Math.max(0.000001, token.price * (1 + (Math.random() * 0.01 - 0.005))),
          change24h: token.change24h + (Math.random() * 0.4 - 0.2),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="token-ticker border-y border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="token-ticker-content">
        {tokens.map((token, index) => (
          <span
            key={token.symbol}
            className={cn(
              "inline-flex items-center mx-3",
              "animate-pulse-slow",
              { "animate-delay-100": index % 3 === 0 },
              { "animate-delay-200": index % 3 === 1 }
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="font-semibold text-foreground">{token.symbol}</span>
            <span className="mx-1 text-muted-foreground">$</span>
            <span className="font-mono">{token.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            <span 
              className={cn(
                "ml-1 flex items-center",
                token.change24h >= 0 ? "text-crypto-green" : "text-crypto-red"
              )}
            >
              {token.change24h >= 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(token.change24h).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TokenTicker;
