
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
      throw new Error('Missing Supabase environment variables');
    }

    // Create a Supabase client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info from request
    const { userId, forceSync } = await req.json();

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
      if (error) throw error;
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
    const { data: existingUser, error: getUserError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (getUserError && getUserError.code !== 'PGRST116') {
      throw getUserError;
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
        const { data: newUser, error: createError } = await adminClient
          .from('users')
          .insert([
            {
              id: authUser.id,
              username: `user_${authUser.id.substring(0, 8)}`,
              display_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'New User',
              avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
              bio: '',
              joined_date: new Date().toISOString(),
              following: [],
              followers: [],
              verified: false
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        userRecord = newUser;
        
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

    return new Response(
      JSON.stringify({
        success: true, 
        user: userRecord, 
        needsProfileSetup,
        authUser: {
          id: authUser.id,
          email: authUser.email,
          providerId: authUser.app_metadata?.provider
        }
      }),
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
