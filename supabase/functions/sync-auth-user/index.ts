
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// CORS headers för alla anrop
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Hantera CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Hämta Supabase-miljövariabler
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Skapa en Supabase-klient med service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Hämta användarinfo från request
    const { email, userId } = await req.json();

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: 'Either email or userId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Om userId är angivet, använd det, annars leta efter användaren via email
    let authUser;
    if (userId) {
      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (error) throw error;
      authUser = data.user;
    } else {
      // Leta efter användaren via email
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;

      authUser = data.users.find(user => 
        user.email === email || 
        user.user_metadata?.email === email
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

    // Kontrollera om användaren redan finns i users-tabellen
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

    // Om användaren finns, uppdatera information vid behov
    if (existingUser) {
      console.log('User exists in database:', { id: existingUser.id, username: existingUser.username });
      
      // Kontrollera om profilen behöver kompletteras
      needsProfileSetup = !existingUser.username || 
                         existingUser.username.startsWith('user_') || 
                         !existingUser.display_name || 
                         existingUser.display_name === 'New User';
      
      // Om användaren har en autogenererad profil men det finns nya uppgifter i auth, uppdatera
      const updateData: any = {};
      
      // Uppdatera email om det behövs
      if (authUser.email && (!existingUser.email || existingUser.email !== authUser.email)) {
        updateData.email = authUser.email;
      }
      
      // Uppdatera displayName om användaren har en autogenererad profil och det finns nya uppgifter
      if (needsProfileSetup && (authUser.user_metadata?.name || authUser.user_metadata?.full_name)) {
        updateData.display_name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || existingUser.display_name;
      }
      
      // Uppdatera avatar om användaren har en autogenererad profil och det finns nya uppgifter
      if (needsProfileSetup && (authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture)) {
        updateData.avatar_url = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || existingUser.avatar_url;
      }
      
      // Bara genomför uppdateringen om det finns något att uppdatera
      if (Object.keys(updateData).length > 0) {
        const { data: updatedUser, error: updateError } = await adminClient
          .from('users')
          .update(updateData)
          .eq('id', authUser.id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        userRecord = updatedUser;
        
        // Kontrollera om uppdateringen gjorde att profilen nu är komplett
        needsProfileSetup = !userRecord.username || 
                          userRecord.username.startsWith('user_') || 
                          !userRecord.display_name || 
                          userRecord.display_name === 'New User';
      } else {
        userRecord = existingUser;
      }
    } else {
      // Skapa en ny användare
      console.log('Creating new user for auth ID:', authUser.id);
      needsProfileSetup = true;

      const { data: newUser, error: createError } = await adminClient
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
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
