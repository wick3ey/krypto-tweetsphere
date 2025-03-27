
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// TypeScript declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the project URL and anonymous key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { transaction } = await req.json();
    
    if (!transaction || !transaction.user_id || !transaction.amount || !transaction.token) {
      throw new Error('Missing required transaction data');
    }
    
    // Insert the transaction into the database
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.user_id,
        amount: transaction.amount,
        token: transaction.token,
        token_symbol: transaction.token_symbol,
        token_logo: transaction.token_logo,
        type: transaction.type,
        status: 'completed',
        hash: transaction.hash || crypto.randomUUID(),
        fee: transaction.fee || 0,
        from_address: transaction.from_address,
        to_address: transaction.to_address,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update the user's token balance
    await updateUserTokenBalance(supabase, transaction);
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in process-crypto-transaction function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateUserTokenBalance(supabase: any, transaction: any) {
  // Check if user already has this token
  const { data: existingToken } = await supabase
    .from('token_balances')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('token', transaction.token)
    .maybeSingle();
  
  if (existingToken) {
    // Update existing token balance
    const newAmount = existingToken.amount + transaction.amount;
    
    await supabase
      .from('token_balances')
      .update({
        amount: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingToken.id);
  } else {
    // Create new token balance entry
    await supabase
      .from('token_balances')
      .insert({
        user_id: transaction.user_id,
        token: transaction.token,
        symbol: transaction.token_symbol,
        amount: transaction.amount,
        value_usd: 0, // This would be calculated based on current price
        logo: transaction.token_logo,
      });
  }
}
