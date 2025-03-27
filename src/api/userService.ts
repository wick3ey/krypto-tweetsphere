
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { dbUserToUser } from '@/lib/db-types';
import { toast } from 'sonner';

export const userService = {
  getUserProfile: async (identifier: string, options: any = {}): Promise<User> => {
    try {
      let query = supabase
        .from('users')
        .select('*');

      // Apply filter first, BEFORE extending the select
      let filteredQuery;
      if (identifier.startsWith('user_')) {
        filteredQuery = query.eq('username', identifier);
      } else {
        filteredQuery = query.eq('id', identifier);
      }

      // Then extend the select if needed
      if (options.includeFollowers) {
        filteredQuery = filteredQuery.select('*, followers(count)');
      }

      if (options.includeFollowing) {
        filteredQuery = filteredQuery.select('*, following(count)');
      }

      const { data, error } = await filteredQuery.maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (!data) {
        console.log('User profile not found');
        throw new Error('User profile not found');
      }

      return dbUserToUser(data);
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const userId = session.user.id;

      const updates = {
        updated_at: new Date(),
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio,
        avatar_url: profileData.avatarUrl,
        header_url: profileData.headerUrl,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return dbUserToUser(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async setupProfile(profileData: Partial<User>): Promise<User> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const userId = session.user.id;
      
      // Instead of inserting, we should update the existing user record
      // that was created during Google sign-up
      const updates = {
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio || '',
        avatar_url: profileData.avatarUrl,
        header_url: profileData.headerUrl || ''
        // Removed updated_at as it doesn't exist in the users table
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return dbUserToUser(data);
    } catch (error) {
      console.error('Error setting up profile:', error);
      throw error;
    }
  },

  async followUser(userId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const followerId = session.user.id;

      // Optimistically update the UI
      await supabase.rpc('follow_user', { follower_id: followerId, followed_id: userId });
    } catch (error: any) {
      console.error('Error following user:', error);
      throw new Error(error.message || 'Could not follow user');
    }
  },

  async unfollowUser(userId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const followerId = session.user.id;

      // Optimistically update the UI
      await supabase.rpc('unfollow_user', { follower_id: followerId, followed_id: userId });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      throw new Error(error.message || 'Could not unfollow user');
    }
  },

  getUserFollowers: async (userId: string, page: number = 1, limit: number = 20, sortBy: string = 'recent') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('following', [userId])
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching user followers:', error);
        throw error;
      }

      return data?.map(dbUserToUser) || [];
    } catch (error) {
      console.error('Error in getUserFollowers:', error);
      throw error;
    }
  },

  getUserFollowing: async (userId: string, page: number = 1, limit: number = 20, sortBy: string = 'recent') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('followers', [userId])
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching user following:', error);
        throw error;
      }

      return data?.map(dbUserToUser) || [];
    } catch (error) {
      console.error('Error in getUserFollowing:', error);
      throw error;
    }
  },

  getUserTweets: async (userId: string, options: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tweets:', error);
        throw error;
      }

      return data?.map(item => {
        if (!item.user) return null;
        return dbUserToUser(item.user);
      }).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getUserTweets:', error);
      throw error;
    }
  },

  getSuggestedUsers: async (): Promise<User[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('id', 'eq', userId)
        .limit(5);

      if (error) {
        console.error('Error fetching suggested users:', error);
        throw error;
      }

      return data?.map(dbUserToUser) || [];
    } catch (error) {
      console.error('Error in getSuggestedUsers:', error);
      throw error;
    }
  },
  
  searchUsers: async (query: string): Promise<User[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let queryBuilder = supabase.from('users').select('*');
      
      if (session) {
        queryBuilder = queryBuilder.not('id', 'eq', session.user.id);
      }
      
      if (query) {
        queryBuilder = queryBuilder.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
      }
      
      const { data, error } = await queryBuilder.limit(5);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      return data?.map(dbUserToUser) || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw error;
    }
  }
};
