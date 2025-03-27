import { useQuery } from '@tanstack/react-query';
import PnLChart from '@/components/dashboard/PnLChart';
import AnimatedCard from '@/components/common/AnimatedCard';
import { ArrowDown, ArrowUp, BarChart, HelpCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cryptoService } from '@/api/cryptoService';
import { Transaction } from '@/lib/types';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [pnlPeriod, setPnlPeriod] = useState('7d');
  const [isRendered, setIsRendered] = useState(false);
  
  useEffect(() => {
    setIsRendered(true);
  }, []);
  
  const { data: tokens = [], isLoading: isLoadingTokens, refetch: refetchTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => cryptoService.getTokenBalances(),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
  
  const { data: pnlData = [], isLoading: isLoadingPnL, refetch: refetchPnL } = useQuery({
    queryKey: ['pnl', pnlPeriod],
    queryFn: () => cryptoService.getPnL(pnlPeriod),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
  
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => cryptoService.getTransactions(),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
  
  const { data: supportedTokens = [], isLoading: isLoadingSupportedTokens } = useQuery({
    queryKey: ['supportedTokens'],
    queryFn: () => cryptoService.getSupportedTokens(),
    staleTime: 5 * 60000, // 5 minutes
    retry: 3,
  });
  
  const totalBalance = tokens && tokens.length > 0 ? tokens.reduce((sum, token) => sum + (token.valueUSD || 0), 0) : 0;
  
  const portfolioChange = pnlData && pnlData.length > 0 
    ? pnlData[pnlData.length - 1]?.change || 0 
    : 0;
    
  const portfolioChangePercent = pnlData && pnlData.length > 0 
    ? pnlData[pnlData.length - 1]?.changePercent || 0 
    : 0;
    
  const isPositive = portfolioChange >= 0;
  
  const topPerformer = tokens && tokens.length > 0 
    ? tokens.reduce((prev, current) => 
        ((prev?.change24h || 0) > (current?.change24h || 0)) ? prev : current
      ) 
    : null;
  
  const handleRefresh = () => {
    toast.success("Updating...", {
      description: "Fetching latest data for your dashboard",
    });
    
    refetchTokens();
    refetchPnL();
    refetchTransactions();
  };
  
  if (!isRendered) {
    return (
      <main className="container pt-20 px-4 min-h-screen">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin h-8 w-8 border-4 border-t-crypto-blue border-crypto-blue/20 rounded-full"></div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container pt-20 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full"
          onClick={handleRefresh}
          disabled={isLoadingTokens || isLoadingPnL || isLoadingTransactions}
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatedCard className="p-4" delay={0}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-muted-foreground">Total Balance</h3>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoadingTokens ? (
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">${totalBalance.toLocaleString()}</span>
              <span className={cn(
                "text-sm",
                isPositive ? "text-crypto-green" : "text-crypto-red"
              )}>
                {isPositive ? "+" : ""}{portfolioChange.toLocaleString()} ({isPositive ? "+" : ""}{portfolioChangePercent}%)
              </span>
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard className="p-4" delay={100}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-muted-foreground">Assets</h3>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoadingTokens ? (
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">{tokens.length}</span>
              <span className="text-sm text-muted-foreground">Tokens</span>
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard className="p-4" delay={200}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-muted-foreground">Top Performer</h3>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoadingTokens ? (
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
          ) : topPerformer ? (
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">{topPerformer.symbol}</span>
              <span className="text-sm text-crypto-green">+{topPerformer.change24h}%</span>
            </div>
          ) : (
            <div className="text-muted-foreground">No data available</div>
          )}
        </AnimatedCard>
      </div>
      
      <div className="grid gap-6 mt-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {isLoadingPnL ? (
            <div className="w-full h-[400px] bg-muted/50 rounded animate-pulse"></div>
          ) : (
            <PnLChart data={pnlData} className="h-[400px]" />
          )}
        </div>
        
        <AnimatedCard className="p-4 overflow-hidden" delay={300}>
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex flex-col items-center justify-center h-24 rounded-xl hover:bg-crypto-blue hover:text-white transition-colors">
              <ArrowDown className="h-6 w-6 mb-1" />
              <span>Buy</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center justify-center h-24 rounded-xl hover:bg-crypto-red hover:text-white transition-colors">
              <ArrowUp className="h-6 w-6 mb-1" />
              <span>Sell</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center justify-center h-24 rounded-xl hover:bg-crypto-blue hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 10H3" />
                <path d="m21 6-4 4 4 4" />
                <path d="M7 14h14" />
                <path d="m3 18 4-4-4-4" />
              </svg>
              <span>Swap</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center justify-center h-24 rounded-xl hover:bg-crypto-blue hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
              <span>Send</span>
            </Button>
          </div>
          
          <h3 className="text-lg font-medium mt-6 mb-4">Market Overview</h3>
          <div className="flex flex-col space-y-2 overflow-hidden">
            {isLoadingSupportedTokens ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-muted/50"></div>
                    <div className="h-4 w-10 bg-muted/50 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-16 bg-muted/50 rounded"></div>
                    <div className="h-4 w-12 bg-muted/50 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              supportedTokens && supportedTokens.length > 0 ? supportedTokens.slice(0, 4).map((token) => (
                <div key={token.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <img src={token.logo} alt={token.symbol} className="h-6 w-6" />
                    <span>{token.symbol}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono">${token.price?.toLocaleString() || '0.00'}</span>
                    <span className={cn(
                      "ml-2 text-sm",
                      (token.priceChange24h || 0) >= 0 ? "text-crypto-green" : "text-crypto-red"
                    )}>
                      {(token.priceChange24h || 0) >= 0 ? "+" : ""}{token.priceChange24h || 0}%
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-muted-foreground p-2">No token data available</div>
              )
            )}
            <Button variant="ghost" className="text-crypto-blue">View all markets</Button>
          </div>
        </AnimatedCard>
      </div>
      
      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <AnimatedCard className="p-4" delay={400}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Trading History</h3>
            <Button variant="ghost" size="sm" className="text-crypto-blue">View all</Button>
          </div>
          
          {isLoadingTransactions ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3">
                  <div className="h-6 w-16 bg-muted/50 rounded"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 rounded-full bg-muted/50"></div>
                    <div className="h-4 w-12 bg-muted/50 rounded"></div>
                  </div>
                  <div className="h-4 w-24 bg-muted/50 rounded"></div>
                  <div className="h-4 w-20 bg-muted/50 rounded"></div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted-foreground text-sm">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.slice(0, 5).map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="py-3">
                      <span className={cn(
                        "inline-block px-2 py-1 rounded-full text-xs",
                        tx.type === 'buy' ? "bg-crypto-green/10 text-crypto-green" : 
                        tx.type === 'sell' ? "bg-crypto-red/10 text-crypto-red" : 
                        "bg-crypto-blue/10 text-crypto-blue"
                      )}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        {tx.tokenLogo && <img src={tx.tokenLogo} alt={tx.token} className="h-5 w-5" />}
                        <span>{tx.tokenSymbol}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono">{tx.amount} {tx.tokenSymbol}</td>
                    <td className="py-3 text-muted-foreground text-sm">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No transaction history available
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard className="p-4" delay={500}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Analytics</h3>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Portfolio Diversity</p>
                <p className="text-sm">Good</p>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-full w-[70%] bg-crypto-blue rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-sm">Medium</p>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-full w-[50%] bg-crypto-blue rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Profit Potential</p>
                <p className="text-sm">High</p>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-full w-[85%] bg-crypto-blue rounded-full"></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Liquidity</p>
                <p className="text-sm">Excellent</p>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div className="h-full w-[90%] bg-crypto-blue rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-crypto-blue/10 p-2 rounded-full text-crypto-blue">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Portfolio Insight</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your portfolio has a good balance between established assets and growth potential. Consider rebalancing to increase exposure to DeFi tokens.
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
};

export default Dashboard;
