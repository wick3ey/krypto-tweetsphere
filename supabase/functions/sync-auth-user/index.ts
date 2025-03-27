
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// CORS headers for all requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', success: false }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a Supabase client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info from request
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request format', success: false }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId, forceSync } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'UserId is required', success: false }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user from auth.users using userId
    let authUser;
    try {
      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (error) {
        console.error('Failed to get auth user:', error.message);
        throw error;
      }
      authUser = data.user;
    } catch (error) {
      console.error('Error getting auth user:', error);
      return new Response(
        JSON.stringify({ error: `Auth user fetch failed: ${error.message}`, success: false }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Auth user not found', success: false }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Found auth user:', { id: authUser.id, email: authUser.email });

    // Get the user's email from auth user
    const userEmail = authUser.email || authUser.user_metadata?.email || '';

    // Check if user already exists in users table
    let existingUser;
    try {
      const { data, error } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      existingUser = data;
    } catch (error) {
      console.error('Error checking for existing user:', error);
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}`, success: false }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let userRecord;
    let needsProfileSetup = false;

    // If user exists, update information if needed
    if (existingUser) {
      console.log('User exists in database:', { id: existingUser.id, username: existingUser.username });
      
      // Check if profile needs to be completed
      needsProfileSetup = !existingUser.username || 
                         existingUser.username.startsWith('user_') || 
                         !existingUser.display_name || 
                         existingUser.display_name === 'New User';
      
      // Create an update object to handle changes
      const updateData: Record<string, any> = {};
      
      // Update displayName if user has an auto-generated profile and there's new data
      if ((needsProfileSetup || forceSync) && (authUser.user_metadata?.name || authUser.user_metadata?.full_name)) {
        updateData.display_name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || existingUser.display_name;
      }
      
      // Update avatar if user has an auto-generated profile and there's new data
      if ((needsProfileSetup || forceSync) && (authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture)) {
        updateData.avatar_url = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || existingUser.avatar_url;
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        try {
          const { data: updatedUser, error: updateError } = await adminClient
            .from('users')
            .update(updateData)
            .eq('id', authUser.id)
            .select()
            .single();
            
          if (updateError) throw updateError;
          userRecord = updatedUser;
          
          // Check if update made the profile complete
          needsProfileSetup = !userRecord.username || 
                            userRecord.username.startsWith('user_') || 
                            !userRecord.display_name || 
                            userRecord.display_name === 'New User';
        } catch (updateError) {
          console.error('Error updating user:', updateError);
          userRecord = existingUser;
        }
      } else {
        userRecord = existingUser;
      }

      // Add email to userRecord for the client without affecting the database
      userRecord.auth_email = userEmail;
    } else {
      // Create a new user
      console.log('Creating new user for auth ID:', authUser.id);
      needsProfileSetup = true;

      try {
        const newUser = {
          id: authUser.id,
          username: `user_${authUser.id.substring(0, 8)}`,
          display_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'New User',
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          bio: '',
          joined_date: new Date().toISOString(),
          following: [],
          followers: [],
          verified: false
        };
        
        const { data: createdUser, error: createError } = await adminClient
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) throw createError;
        userRecord = createdUser;
        
        // Add email to userRecord for the client
        userRecord.auth_email = userEmail;
      } catch (createError) {
        console.error('Error creating new user:', createError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${createError.message}`, success: false }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Check and transform the user record for safety
    if (!userRecord || typeof userRecord !== 'object') {
      console.error('Invalid user record', userRecord);
      return new Response(
        JSON.stringify({ error: 'Invalid user record obtained', success: false }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const safeResponse = {
      success: true, 
      user: userRecord, 
      needsProfileSetup,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        providerId: authUser.app_metadata?.provider
      }
    };

    return new Response(
      JSON.stringify(safeResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error syncing user:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred', success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
