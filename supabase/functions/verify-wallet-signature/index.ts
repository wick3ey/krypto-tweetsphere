
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import * as bs58 from "bs58";

// Set up CORS headers with wildcard origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body
    const { walletAddress, signature, message } = await req.json();

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: walletAddress, signature, and message are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Request received:', { walletAddress, message, signature: signature.substring(0, 20) + '...' });

    // Find or create a user
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (getUserError && getUserError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Database error when checking user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let user = existingUser;
    let needsProfileSetup = false;

    // If user doesn't exist, create a new one
    if (!user) {
      needsProfileSetup = true;
      
      // Create a new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([
          {
            wallet_address: walletAddress,
            username: `user_${walletAddress.substring(0, 8)}`,
            display_name: `User ${walletAddress.substring(0, 8)}`,
            bio: '',
            joined_date: new Date().toISOString(),
            following: [],
            followers: [],
            verified: false
          }
        ])
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating new user:', createUserError);
        return new Response(
          JSON.stringify({ error: 'Could not create user' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      user = newUser;
    }

    // Create a JWT token for authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      properties: {
        user_id: user.id,
      },
    });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create authentication token' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return token and user data
    return new Response(
      JSON.stringify({
        token: sessionData.session.access_token,
        user,
        needsProfileSetup
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
