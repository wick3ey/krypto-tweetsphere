
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { dbUserToUser } from '@/lib/db-types';
import { toast } from 'sonner';

export const authService = {
  /**
   * Check if user is logged in
   */
  isLoggedIn: () => {
    return !!supabase.auth.getSession();
  },
  
  /**
   * Transform database user to User type
   */
  dbUserToUser,
  
  /**
   * Get current user data from Supabase
   */
  async getCurrentUser(): Promise<User> {
    try {
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }
      
      const userId = session.user.id;
      console.log('Getting current user for ID:', userId);
      
      // Try to get from local storage first for faster access
      const cachedUser = localStorage.getItem('current_user');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          // Verify that the cached user ID matches the session user ID
          if (parsedUser && parsedUser.id === userId) {
            console.log('Using cached user data');
            // Check if cached user data shows a complete profile
            const user = dbUserToUser(parsedUser);
            if (this.hasCompleteProfile(user)) {
              localStorage.setItem('profile_setup_complete', 'true');
              localStorage.removeItem('needs_profile_setup');
            }
            return user;
          }
        } catch (e) {
          // Invalid JSON in localStorage, continue to fetch from API
          console.error('Invalid cached user data:', e);
        }
      }
      
      // Fetch from Supabase with optimized query
      console.log('Fetching user from Supabase with ID:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
      
      if (!data) {
        console.log('User data not found in database, syncing with auth...');
        
        // Try to sync the user via our edge function
        try {
          const response = await supabase.functions.invoke('sync-auth-user', {
            body: { userId, forceSync: true }
          });
          
          if (!response.data.success) {
            throw new Error(`Failed to sync user: ${response.data.error}`);
          }
          
          // Cache the synced user
          localStorage.setItem('current_user', JSON.stringify(response.data.user));
          
          // Update flags based on if profile is complete
          if (response.data.needsProfileSetup) {
            localStorage.setItem('needs_profile_setup', 'true');
            localStorage.removeItem('profile_setup_complete');
          } else {
            localStorage.setItem('profile_setup_complete', 'true');
            localStorage.removeItem('needs_profile_setup');
          }
          
          return dbUserToUser(response.data.user);
        } catch (syncError) {
          console.error('Error syncing user with auth:', syncError);
          
          // Fallback to creating a basic user if sync fails
          // Try to create a profile for the user
          const { user } = session;
          const newUser = {
            id: user.id,
            username: `user_${user.id.substring(0, 8)}`,
            display_name: user.user_metadata?.name || user.user_metadata?.full_name || 'New User',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            email: user.email,
            bio: '',
            joined_date: new Date().toISOString(),
            following: [],
            followers: [],
            verified: false
          };
          
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating user profile:', createError);
            throw createError;
          }
          
          // Mark that user needs to complete profile setup
          localStorage.setItem('needs_profile_setup', 'true');
          localStorage.removeItem('profile_setup_complete');
          
          // Cache the newly created user
          localStorage.setItem('current_user', JSON.stringify(createdUser));
          
          return dbUserToUser(createdUser);
        }
      }
      
      const user = dbUserToUser(data);
      
      // Determine if profile is complete and set appropriate flags
      if (this.hasCompleteProfile(user)) {
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
        console.log('User has complete profile, no setup needed');
      } else {
        localStorage.setItem('needs_profile_setup', 'true');
        localStorage.removeItem('profile_setup_complete');
        console.log('User needs to complete profile setup');
      }
      
      // Cache for faster access
      localStorage.setItem('current_user', JSON.stringify(data));
      
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  /**
   * Check if a user profile is complete
   */
  hasCompleteProfile(user: User): boolean {
    if (!user) return false;
    
    const isCompleteProfile = !!user.username && 
                            !user.username.startsWith('user_') && 
                            !!user.displayName && 
                            user.displayName !== 'New User';
    
    console.log('Profile completeness check:', {
      username: user.username,
      displayName: user.displayName,
      isComplete: isCompleteProfile
    });
    
    return isCompleteProfile;
  },
  
  /**
   * Update the last seen timestamp
   */
  async updateLastSeen() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  },
  
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Set auth data
      localStorage.setItem('current_user', JSON.stringify(data.user));
      
      return data;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  },
  
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  },
  
  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      // Get current URL to determine environment
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      // Make sure callback URL is correctly set with no trailing slashes
      const redirectTo = isLocalhost
        ? `${window.location.origin}/auth/callback` // Use local origin for development
        : 'https://f3oci3ty.xyz/auth/callback'; // Use production domain for live site
      
      console.log('Signing in with Google, redirectTo:', redirectTo);
      
      // Reset the profile setup flags - we'll determine this after sign-in
      localStorage.removeItem('needs_profile_setup');
      localStorage.removeItem('profile_setup_complete');
      localStorage.removeItem('current_user'); // Tvinga ny synkronisering efter inloggning
      
      // Optimize for faster redirects by setting fewer options
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account', // Always show account selection screen
            access_type: 'offline'    // För att få refresh token
          }
        }
      });
      
      if (result.error) throw result.error;
      
      return result;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },
  
  /**
   * Sign up with Google
   */
  async signUpWithGoogle() {
    // Markera att detta är en ny användare som behöver konfigurera sin profil
    localStorage.setItem('needs_profile_setup', 'true');
    localStorage.removeItem('profile_setup_complete');
    
    return this.signInWithGoogle(); // Same method for both sign in and sign up
  },
  
  /**
   * Sign out user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear auth data
      this.clearAuthData();
      
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
  
  /**
   * Clear all authentication data
   */
  clearAuthData() {
    localStorage.removeItem('current_user');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('profile_setup_complete');
  }
};
