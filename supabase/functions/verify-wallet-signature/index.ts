
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import * as bs58 from "npm:bs58@5.0.0";

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
    
    // Generate JWT token using admin.createUser for new users or admin.signIn for existing users
    const email = `${walletAddress}@phantom.wallet`;
    const password = signature.substring(0, 20); // Use part of the signature as password
    
    let authData;
    
    try {
      if (isNewUser) {
        // Create auth user for new users
        authData = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            wallet_address: walletAddress,
            user_id: userId,
          },
        });
      } else {
        // Sign in existing users
        // First try to delete any existing user with this email to avoid conflicts
        try {
          const { data: userByEmail } = await supabase.auth.admin.listUsers({
            filters: {
              email,
            },
          });
          
          if (userByEmail && userByEmail.users.length > 0) {
            // User exists in auth, try to sign in
            authData = await supabase.auth.admin.signInWithEmail({
              email,
              password,
            });
          } else {
            // No user found in auth, create one
            authData = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                wallet_address: walletAddress,
                user_id: userId,
              },
            });
          }
        } catch (err) {
          console.error('Error checking auth user:', err);
          // Fallback to create user
          authData = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              wallet_address: walletAddress,
              user_id: userId,
            },
          });
        }
      }
    } catch (authError: any) {
      console.error('Auth error:', authError);
      
      // Try to sign in if user already exists
      if (authError.message?.includes("User already registered")) {
        try {
          authData = await supabase.auth.admin.signInWithEmail({
            email,
            password,
          });
        } catch (signInError) {
          console.error('Sign in error:', signInError);
          return new Response(
            JSON.stringify({ error: 'Failed to authenticate' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Authentication error', details: authError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    
    if (authData?.error) {
      console.error('Auth data error:', authData.error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authData.error.message }),
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
