import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }
    
    // In a real implementation, you would fetch this data from a cryptocurrency API
    // For demonstration, we'll return mock data
    const tokenMetadata = {
      symbol: symbol.toUpperCase(),
      name: getTokenName(symbol),
      logo: `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/128/color/${symbol.toLowerCase()}.png`,
      price: getRandomPrice(),
      priceChange24h: getRandomPriceChange(),
    };
    
    return new Response(JSON.stringify(tokenMetadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-token-metadata function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getTokenName(symbol: string): string {
  const tokenNames: {[key: string]: string} = {
    'btc': 'Bitcoin',
    'eth': 'Ethereum',
    'sol': 'Solana',
    'dot': 'Polkadot',
    'ada': 'Cardano',
    'bnb': 'Binance Coin',
    'xrp': 'Ripple',
    'doge': 'Dogecoin',
    'shib': 'Shiba Inu',
    'avax': 'Avalanche',
  };
  
  return tokenNames[symbol.toLowerCase()] || symbol.toUpperCase();
}

function getRandomPrice(): number {
  // Generate a realistic-looking price based on the current market
  return Math.floor(Math.random() * 10000) + 0.01;
}

function getRandomPriceChange(): number {
  // Generate a random price change between -10% and +10%
  return Number((Math.random() * 20 - 10).toFixed(2));
}
