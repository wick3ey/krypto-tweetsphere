import { supabase } from '@/integrations/supabase/client';
import { User, Tweet, UserProfile } from '@/lib/types';
import { dbUserToUser, dbTweetToTweet } from '@/lib/db-types';
import { authService } from './authService';

export const userService = {
  async getUserProfile(identifier: string, options = {}): Promise<User> {
    try {
      let query = supabase.from('users').select('*');
      
      // Check if the identifier is a UUID (assuming UUID is 36 characters long)
      if (identifier.length === 36) {
        query = query.eq('id', identifier);
      }
      // Otherwise, assume it's a username
      else {
        query = query.eq('username', identifier);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      // Get followers and following counts
      const followersCount = data.followers ? data.followers.length : 0;
      const followingCount = data.following ? data.following.length : 0;
      
      const user = dbUserToUser(data);
      user.followers = followersCount;
      user.following = followingCount;
      
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  async uploadProfileImage(file: File, type: 'avatar' | 'header'): Promise<string> {
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('User ID not found in local storage');
      }
      
      // Generate a unique filename with timestamp to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
      
      console.log(`Trying to upload ${type} image for user ${userId}`);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error(`Error uploading ${type} image:`, error);
        throw error;
      }
      
      console.log(`Uploaded file: ${data?.path}`);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
        
      console.log(`Public URL: ${publicUrlData.publicUrl}`);
      
      // Update the user's profile directly in the database with the new image
      if (type === 'avatar') {
        await supabase
          .from('users')
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq('id', userId);
      } else if (type === 'header') {
        await supabase
          .from('users')
          .update({ header_url: publicUrlData.publicUrl })
          .eq('id', userId);
      }
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },
  
  async setupProfile(profileData: Partial<User>): Promise<User> {
    try {
      // Get user ID from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }
      
      const userId = session.user.id;
      console.log('Creating/updating profile for user:', userId);
      
      // Check if user has uploaded avatar or header
      let avatarUrl = profileData.avatarUrl;
      let headerUrl = profileData.headerUrl;
      
      // Get current user from Supabase
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Could not fetch user data:', fetchError);
        throw fetchError;
      }
      
      // If user doesn't exist, create a new one
      if (!userData) {
        console.log('No user found, creating new user');
        
        // Generate temporary username if none provided
        const tempUsername = profileData.username || `user_${userId.substring(0, 8).toLowerCase()}`;
        const tempDisplayName = profileData.displayName || session.user.user_metadata?.name || 'New User';
        
        // Create the new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            username: tempUsername,
            display_name: tempDisplayName,
            bio: profileData.bio || '',
            avatar_url: avatarUrl || session.user.user_metadata?.avatar_url || '',
            header_url: headerUrl || '',
            joined_date: new Date().toISOString(),
            following: [],
            followers: []
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Could not create new user:', insertError);
          throw insertError;
        }
        
        console.log('New user created:', newUser);
        
        // Mark profile setup as completed
        localStorage.setItem('profile_setup_complete', 'true');
        
        return dbUserToUser(newUser);
      }
      
      // Prepare data for update
      const updateData = {
        username: profileData.username || userData.username,
        display_name: profileData.displayName || userData.display_name,
        bio: profileData.bio !== undefined ? profileData.bio : userData.bio,
        avatar_url: avatarUrl || userData.avatar_url,
        header_url: headerUrl || userData.header_url,
      };
      
      console.log('Updating existing user with:', updateData);
      
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Could not update user profile:', error);
        throw error;
      }
      
      console.log('User profile updated:', data);
      
      // Mark profile setup as completed
      localStorage.setItem('profile_setup_complete', 'true');
      
      // Update avatar in Auth metadata for consistency
      if (avatarUrl) {
        try {
          await supabase.auth.updateUser({
            data: { 
              avatar_url: avatarUrl 
            }
          });
        } catch (metaError) {
          console.error('Could not update auth metadata:', metaError);
          // This is not a critical error, so we continue
        }
      }
      
      // Update cache for currentUser
      if (typeof window !== 'undefined') {
        const converted = dbUserToUser(data);
        localStorage.setItem('current_user', JSON.stringify(converted));
      }
      
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
      const updateData: any = {};
      
      if (profileData.username) updateData.username = profileData.username;
      if (profileData.displayName) updateData.display_name = profileData.displayName;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.avatarUrl) updateData.avatar_url = profileData.avatarUrl;
      if (profileData.headerUrl) updateData.header_url = profileData.headerUrl;
      
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
      
      // Update local user data to reflect the change
      const updatedUser = { ...currentUser };
      if (!Array.isArray(updatedUser.following)) {
        updatedUser.following = [];
      }
      if (typeof updatedUser.following === 'number') {
        updatedUser.following++;
      } else {
        updatedUser.following.push(userId);
      }
      
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
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
      
      // Update local user data to reflect the change
      const updatedUser = { ...currentUser };
      if (typeof updatedUser.following === 'number') {
        updatedUser.following = Math.max(0, updatedUser.following - 1);
      } else if (Array.isArray(updatedUser.following)) {
        updatedUser.following = updatedUser.following.filter(id => id !== userId);
      }
      
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
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
  
  async getUserTweets(userId: string, options: { type?: string } = {}): Promise<Tweet[]> {
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
