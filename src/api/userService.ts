import { supabase } from '@/integrations/supabase/client';
import { User, Tweet, UserProfile } from '@/lib/types';
import { dbUserToUser, dbTweetToTweet } from '@/lib/db-types';
import { authService } from './authService';

export const userService = {
  async getUserProfile(identifier: string, options = {}): Promise<User> {
    try {
      let query = supabase.from('users').select('*');
      
      // Check if identifier is a UUID (assuming UUIDs are 36 chars long)
      if (identifier.length === 36) {
        query = query.eq('id', identifier);
      }
      // Check if identifier looks like a wallet address (0x followed by at least 40 chars)
      else if (identifier.startsWith('0x') || identifier.length >= 42) {
        query = query.eq('wallet_address', identifier);
      }
      // Otherwise, assume it's a username
      else {
        query = query.eq('username', identifier);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      return dbUserToUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  async setupProfile(profileData: Partial<User>): Promise<User> {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) throw new Error('No wallet address found');
      
      // Get the current user from Supabase
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      if (!userData) throw new Error('User not found');
      
      // Prepare data for update
      const updateData = {
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio || userData.bio,
        avatar_url: profileData.avatarUrl || userData.avatar_url,
        header_url: profileData.headerImage || userData.header_url,
      };
      
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert to application User type and return
      return dbUserToUser(data);
    } catch (error) {
      console.error('Error setting up profile:', error);
      throw error;
    }
  },
  
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const currentUser = await authService.getCurrentUser();
      
      // Prepare data for update
      const updateData = {
        username: profileData.username || currentUser.username,
        display_name: profileData.displayName || currentUser.displayName,
        bio: profileData.bio || currentUser.bio,
        avatar_url: profileData.avatarUrl || currentUser.avatarUrl,
        header_url: profileData.headerUrl || currentUser.headerUrl,
      };
      
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert to application User type
      const updatedUser = dbUserToUser(data);
      
      // Update cached user
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  async followUser(userId: string): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      
      // Add userId to current user's following array
      const { error: followError } = await supabase.rpc('follow_user', {
        follower_id: currentUser.id,
        followed_id: userId
      });
      
      if (followError) throw followError;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },
  
  async unfollowUser(userId: string): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      
      // Remove userId from current user's following array
      const { error: unfollowError } = await supabase.rpc('unfollow_user', {
        follower_id: currentUser.id,
        followed_id: userId
      });
      
      if (unfollowError) throw unfollowError;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },
  
  async getUserFollowers(userId: string, page = 1, limit = 20, sortBy = 'recent'): Promise<User[]> {
    try {
      // Get followers IDs from the user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('followers')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      
      if (!userData.followers || userData.followers.length === 0) {
        return [];
      }
      
      // Fetch follower user records
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userData.followers)
        .range((page - 1) * limit, page * limit - 1);
        
      if (error) throw error;
      
      // Convert to application User type
      return data.map(dbUserToUser);
    } catch (error) {
      console.error('Error getting user followers:', error);
      throw error;
    }
  },
  
  async getUserFollowing(userId: string, page = 1, limit = 20, sortBy = 'recent'): Promise<User[]> {
    try {
      // Get following IDs from the user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('following')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      
      if (!userData.following || userData.following.length === 0) {
        return [];
      }
      
      // Fetch following user records
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userData.following)
        .range((page - 1) * limit, page * limit - 1);
        
      if (error) throw error;
      
      // Convert to application User type
      return data.map(dbUserToUser);
    } catch (error) {
      console.error('Error getting user following:', error);
      throw error;
    }
  },
  
  async getUserTweets(userId: string, options = {}): Promise<Tweet[]> {
    try {
      const type = options.type || 'tweets';
      
      let query = supabase
        .from('tweets')
        .select('*, users:user_id(*)');
      
      // Filter based on type
      if (type === 'tweets') {
        query = query.eq('user_id', userId)
          .is('reply_to', null);
      } else if (type === 'replies') {
        query = query.eq('user_id', userId)
          .not('reply_to', 'is', null);
      } else if (type === 'media') {
        query = query.eq('user_id', userId)
          .not('attachments', 'is', '{}');
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert to application Tweet type
      return data.map(item => {
        const user = dbUserToUser(item.users);
        return dbTweetToTweet(item, user);
      });
    } catch (error) {
      console.error('Error getting user tweets:', error);
      throw error;
    }
  },
  
  async searchUsers(query: string, options = {}): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      // Convert to application User type
      return data.map(dbUserToUser);
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};
