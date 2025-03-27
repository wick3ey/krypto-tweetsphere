
// Denna edge-funktion skulle hämta och lagra token-metadata
// (Implementeras senare när det behövs)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  symbol: string;
}

serve(async (req) => {
  // Hantera CORS-preflight-begäranden
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json() as TokenRequest;

    if (!symbol) {
      throw new Error("Symbol krävs");
    }

    console.log(`Fetching metadata for token: ${symbol}`);

    // Här skulle vi anropa CoinGecko eller liknande API för att hämta token-metadata
    // För nu, returnera simulerad data
    
    const tokenMetadata = {
      symbol,
      name: getTokenName(symbol),
      logo: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
      description: `${getTokenName(symbol)} är en kryptovaluta.`,
      website: `https://${symbol.toLowerCase()}.org`,
      twitter: `https://twitter.com/${symbol.toLowerCase()}`,
      marketData: {
        currentPrice: getRandomPrice(symbol),
        marketCap: Math.random() * 1000000000,
        volume24h: Math.random() * 100000000,
        priceChange24h: (Math.random() * 10) - 5,
        priceChangePercentage24h: (Math.random() * 20) - 10
      }
    };

    return new Response(JSON.stringify(tokenMetadata), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in create-token-metadata function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});

// Hjälpfunktioner
function getTokenName(symbol: string): string {
  const names: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'USDC': 'USD Coin',
    'USDT': 'Tether',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'XRP': 'Ripple',
    'DOGE': 'Dogecoin',
    'SHIB': 'Shiba Inu'
  };
  
  return names[symbol] || `${symbol} Token`;
}

function getRandomPrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    'BTC': 58000,
    'ETH': 3500,
    'SOL': 140,
    'USDC': 1,
    'USDT': 1,
    'ADA': 1.5,
    'DOT': 20,
    'XRP': 0.8,
    'DOGE': 0.15,
    'SHIB': 0.00003
  };
  
  const basePrice = basePrices[symbol] || 10;
  const variation = basePrice * 0.05; // 5% variation
  
  return basePrice + (Math.random() * variation * 2) - variation;
}
