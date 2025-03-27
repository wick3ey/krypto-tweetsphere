
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
      
      // Try to get from local storage first for faster access
      const cachedUser = localStorage.getItem('current_user');
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        return dbUserToUser(parsedUser);
      }
      
      // Fetch from Supabase if not cached
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      // Fetch followers and following counts
      const followersCount = data.followers ? data.followers.length : 0;
      const followingCount = data.following ? data.following.length : 0;
      
      // Convert to application User type
      const user = dbUserToUser(data);
      
      // Update followers and following counts
      user.followers = followersCount;
      user.following = followingCount;
      
      // Cache for faster access
      localStorage.setItem('current_user', JSON.stringify(data));
      
      return user;
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
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
  }
};
