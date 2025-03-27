
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, chain } = await req.json();
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }
    
    // This would include real blockchain API calls in a production environment
    // For this example, we'll return mock data
    const blockchainData = await getMockBlockchainData(walletAddress, chain);
    
    return new Response(JSON.stringify(blockchainData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in sync-blockchain-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getMockBlockchainData(walletAddress: string, chain: string = 'ethereum') {
  // Mock data for demonstration purposes
  const data = {
    walletAddress,
    chain,
    nativeBalance: Math.random() * 10,
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: Math.floor(Math.random() * 1000),
        valueUSD: Math.floor(Math.random() * 1000),
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        balance: Math.floor(Math.random() * 100),
        valueUSD: Math.floor(Math.random() * 500),
      },
    ],
    recentTransactions: [
      {
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        from: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        to: walletAddress,
        value: Math.random() * 2,
        asset: 'ETH',
      },
      {
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        from: walletAddress,
        to: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        value: Math.random() * 1,
        asset: 'ETH',
      },
    ],
  };
  
  return data;
}
