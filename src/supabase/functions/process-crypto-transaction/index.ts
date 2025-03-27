
// Denna edge-funktion skulle hantera kryptovalutatransaktioner

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Skapa en Supabase-klient med miljövariabler
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

interface TransactionRequest {
  type: "transfer" | "buy" | "sell" | "swap";
  amount: number;
  token: string;
  fromAddress?: string;
  toAddress?: string;
  userId: string;
}

serve(async (req) => {
  // Hantera CORS-preflight-begärandan
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, amount, token, fromAddress, toAddress, userId } = await req.json() as TransactionRequest;

    if (!type || !amount || !token || !userId) {
      throw new Error("Ofullständig transaktion");
    }

    console.log(`Processing ${type} transaction for user ${userId}: ${amount} ${token}`);

    // Här skulle vi anropa blockchain-API för att utföra transaktionen
    // För nu, simulera en transaktion genom att skapa en post i transactions-tabellen
    
    const txHash = `simulated_${type}_${Date.now()}`;
    
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: userId,
        type,
        amount,
        token,
        token_symbol: token,
        token_logo: `https://cryptologos.cc/logos/${token.toLowerCase()}-${token.toLowerCase()}-logo.png`,
        status: "completed",
        hash: txHash,
        to_address: toAddress,
        from_address: fromAddress
      })
      .select()
      .single();
      
    if (txError) throw txError;

    return new Response(JSON.stringify({ success: true, transaction }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in process-crypto-transaction function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
