
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import * as bs58 from "bs58";

// Set up CORS headers with wildcard origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
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

    try {
      // Get environment variables
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }

      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Find or create a user
      const { data: existingUser, error: getUserError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

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
        
        // Check if there's any existing user with an empty wallet address that we can update
        // This helps prevent conflicts with users created via Google OAuth
        const { data: existingEmptyWalletUser, error: emptyWalletError } = await supabase
          .from('users')
          .select('*')
          .is('wallet_address', null)
          .or('wallet_address.eq.""')
          .limit(1)
          .maybeSingle();
        
        if (emptyWalletError) {
          console.error('Error checking for empty wallet users:', emptyWalletError);
        }
        
        if (existingEmptyWalletUser) {
          // Update the existing user with the wallet address
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              wallet_address: walletAddress
            })
            .eq('id', existingEmptyWalletUser.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('Error updating existing user with wallet:', updateError);
          } else {
            user = updatedUser;
          }
        }
        
        // If we couldn't find or update an existing user, create a new one
        if (!user) {
          try {
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
          } catch (createError) {
            console.error('Error in user creation:', createError);
            return new Response(
              JSON.stringify({ error: 'Failed to create user account' }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        }
      }

      // Create a JWT token for authentication with custom domain
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
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return new Response(
        JSON.stringify({ error: dbError.message || 'Database operation failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
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
