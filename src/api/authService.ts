
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
      
      // Fetch from Supabase with optimized query
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
        console.log('User data not found in database, creating minimal profile');
        
        // Create a minimal user profile
        const { user } = session;
        const newUser = {
          id: user.id,
          username: `user_${user.id.substring(0, 8)}`,
          display_name: user.user_metadata?.name || user.user_metadata?.full_name || 'New User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
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
        
        return dbUserToUser(createdUser);
      }
      
      return dbUserToUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
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
  }
};
