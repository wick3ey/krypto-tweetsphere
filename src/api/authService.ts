import { supabase } from '@/integrations/supabase/client';
import apiClient from './apiClient';
import { User } from '@/lib/types';
import { dbUserToUser } from '@/lib/db-types';

export const authService = {
  /**
   * Check if user is logged in
   */
  isLoggedIn: () => {
    const token = localStorage.getItem('jwt_token');
    return !!token;
  },
  
  /**
   * Get current user data from Supabase
   */
  async getCurrentUser(): Promise<User> {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }
      
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
        .eq('wallet_address', walletAddress)
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
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) return;
      
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('wallet_address', walletAddress);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  },
  
  /**
   * Clear all authentication data
   */
  clearAuthData() {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
  },
  
  /**
   * Connect wallet and authenticate (this is implemented in the WalletConnect component)
   * This is just a placeholder for the API signature
   */
  async connectWallet(): Promise<{ user: User, token: string }> {
    throw new Error('Not implemented. Please use the WalletConnect component');
  }
};
