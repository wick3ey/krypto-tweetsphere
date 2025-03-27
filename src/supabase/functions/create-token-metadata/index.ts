
// Edge-funktion för att skapa metadata för tokens

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  symbol: string;
  network?: string;
}

serve(async (req) => {
  // Hantera CORS-preflight-begäranden
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, network = "ethereum" } = await req.json() as TokenRequest;

    if (!symbol) {
      throw new Error("Token symbol krävs");
    }

    console.log(`Creating metadata for token: ${symbol} on network: ${network}`);

    // Simulera att vi hämtar metadata från ett externt API
    const mockTokenData = {
      symbol: symbol.toUpperCase(),
      name: getTokenName(symbol),
      logo: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
      decimals: 18,
      address: `0x${generateRandomHex(40)}`,
      network,
      price: Math.random() * 1000,
      priceChange24h: (Math.random() * 20) - 10, // Between -10% and 10%
    };

    return new Response(JSON.stringify(mockTokenData), {
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

// Helper functions
function getTokenName(symbol: string): string {
  const tokenNames: Record<string, string> = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "SOL": "Solana",
    "MATIC": "Polygon",
    "ADA": "Cardano",
    "DOT": "Polkadot",
    "AVAX": "Avalanche",
    "LINK": "Chainlink",
    "UNI": "Uniswap",
    "AAVE": "Aave"
  };
  
  return tokenNames[symbol.toUpperCase()] || `${symbol.toUpperCase()} Token`;
}

function generateRandomHex(length: number): string {
  const characters = '0123456789abcdef';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}
