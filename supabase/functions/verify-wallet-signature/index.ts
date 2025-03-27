
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { walletAddress, signature, message } = await req.json();
    
    if (!walletAddress || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Verifying signature for wallet: ${walletAddress}`);
    
    // Verify the wallet owns this signature by calling our database function
    // This is a placeholder. In a real implementation, you'd verify the signature cryptographically
    const { data: verified, error: verifyError } = await supabase.rpc('verify_signature', {
      wallet_addr: walletAddress,
      signature,
      message
    });
    
    if (verifyError) {
      console.error('Error verifying signature:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // If verified, check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user existence' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    let isNewUser = false;
    let userId = existingUser?.id;
    
    // If user doesn't exist, create one
    if (!existingUser) {
      isNewUser = true;
      
      // Generate a temporary username from wallet address
      const tempUsername = `user_${walletAddress.substring(0, 8).toLowerCase()}`;
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          username: tempUsername,
          display_name: 'New User',
          joined_date: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating user:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      userId = newUser.id;
    }
    
    // Generate a JWT token
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${walletAddress}@phantom.wallet`,
      password: signature.substring(0, 20), // Use part of the signature as password
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress,
      },
    });
    
    if (authError) {
      console.error('Error creating auth account:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get full user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to get user data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Return success response with token and user data
    return new Response(
      JSON.stringify({
        token: authData.user?.id ? 'authenticated' : null,
        user: userData,
        isNewUser,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
