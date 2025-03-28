
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import PnLChart from '@/components/dashboard/PnLChart';
import AnimatedCard from '@/components/common/AnimatedCard';
import { userProfile } from '@/lib/mockData';
import { ArrowDown, ArrowUp, BarChart, HelpCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const portfolioChange = userProfile.pnlData[userProfile.pnlData.length - 1].change;
  const portfolioChangePercent = userProfile.pnlData[userProfile.pnlData.length - 1].changePercent;
  const isPositive = portfolioChange >= 0;
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container pt-20 px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" size="sm" className="rounded-full">
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
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">${userProfile.totalBalance.toLocaleString()}</span>
              <span className={cn(
                "text-sm",
                isPositive ? "text-crypto-green" : "text-crypto-red"
              )}>
                {isPositive ? "+" : ""}{portfolioChange.toLocaleString()} ({isPositive ? "+" : ""}{portfolioChangePercent}%)
              </span>
            </div>
          </AnimatedCard>
          
          <AnimatedCard className="p-4" delay={100}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Assets</h3>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">{userProfile.tokens.length}</span>
              <span className="text-sm text-muted-foreground">Tokens</span>
            </div>
          </AnimatedCard>
          
          <AnimatedCard className="p-4" delay={200}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Top Performer</h3>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-semibold">SOL</span>
              <span className="text-sm text-crypto-green">+5.67%</span>
            </div>
          </AnimatedCard>
        </div>
        
        <div className="grid gap-6 mt-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <PnLChart data={userProfile.pnlData} className="h-[400px]" />
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
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center space-x-2">
                  <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024" alt="BTC" className="h-6 w-6" />
                  <span>BTC</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono">$37,500</span>
                  <span className="ml-2 text-crypto-green text-sm">+2.3%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center space-x-2">
                  <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024" alt="ETH" className="h-6 w-6" />
                  <span>ETH</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono">$1,960</span>
                  <span className="ml-2 text-crypto-green text-sm">+3.7%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center space-x-2">
                  <img src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=024" alt="SOL" className="h-6 w-6" />
                  <span>SOL</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono">$72.40</span>
                  <span className="ml-2 text-crypto-green text-sm">+5.6%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center space-x-2">
                  <img src="https://cryptologos.cc/logos/chainlink-link-logo.svg?v=024" alt="LINK" className="h-6 w-6" />
                  <span>LINK</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono">$12.30</span>
                  <span className="ml-2 text-crypto-red text-sm">-1.2%</span>
                </div>
              </div>
              
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
                {userProfile.transactions.slice(0, 5).map((tx) => (
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
                        <img src={tx.tokenLogo} alt={tx.token} className="h-5 w-5" />
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
    </div>
  );
};

export default Dashboard;
