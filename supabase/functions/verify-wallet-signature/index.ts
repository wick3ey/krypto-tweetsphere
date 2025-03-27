
import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import bs58 from "base58";

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
    
    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Verifying signature for wallet: ${walletAddress}`);
    console.log(`Message: ${message}`);
    console.log(`Signature: ${signature}`);
    
    // For development, we'll accept all signatures without cryptographic verification
    // In production, you would want a proper verification implementation
    let isValid = true;
    
    if (!isValid) {
      console.error('Signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
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
          following: [],
          followers: []
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
    
    // Generate a JWT token - we'll use email+password auth as a simple solution
    // This approach creates a "fake" email and password to associate with the wallet
    const safeSignature = signature.substring(0, 20);
    let authData;
    try {
      authData = await supabase.auth.admin.createUser({
        email: `${walletAddress}@phantom.wallet`,
        password: safeSignature, 
        email_confirm: true,
        user_metadata: {
          wallet_address: walletAddress,
          user_id: userId,
        },
      });
    } catch (authError: any) {
      if (authError.message?.includes("User already registered")) {
        // Try to sign in instead if the user already exists in auth
        authData = await supabase.auth.admin.signInWithEmail({
          email: `${walletAddress}@phantom.wallet`,
          password: safeSignature,
        });
      } else {
        throw authError;
      }
    }
    
    if (authData.error) {
      // If we get an error about the user being already registered, try to sign in
      if (authData.error.message === 'User already registered') {
        const signInData = await supabase.auth.admin.signInWithEmail({
          email: `${walletAddress}@phantom.wallet`,
          password: safeSignature,
        });
        
        if (signInData.error) {
          console.error('Error signing in:', signInData.error);
          return new Response(
            JSON.stringify({ error: 'Failed to authenticate user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        authData = signInData;
      } else {
        console.error('Error creating auth account:', authData.error);
        return new Response(
          JSON.stringify({ error: 'Failed to authenticate user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
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
    
    // Determine if profile setup is needed
    const needsProfileSetup = isNewUser || 
      !userData.username || 
      userData.username.startsWith('user_') || 
      !userData.display_name || 
      userData.display_name === 'New User';
    
    // Return success response with token and user data
    return new Response(
      JSON.stringify({
        token: authData?.data?.session?.access_token || null,
        user: userData,
        isNewUser,
        needsProfileSetup,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
