
import apiClient from './apiClient';
import { toast } from "sonner";
import { Tweet, User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { dbTweetToTweet, dbUserToUser } from '@/lib/db-types';

export const tweetService = {
  getFeed: async () => {
    try {
      console.log("Fetching feed from Supabase...");
      // Get current user's following list
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      
      if (!currentUser.id) {
        return await tweetService.getExploreFeed();
      }
      
      // Get tweets from followed users
      let query = supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .in('user_id', [currentUser.id, ...(currentUser.following || [])])
        .order('created_at', { ascending: false })
        .limit(50);
        
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log("Feed data from Supabase:", data);
      
      // Convert to application Tweet type
      const tweets = data.map(item => {
        const user = item.users ? dbUserToUser(item.users) : null;
        return dbTweetToTweet(item, user!);
      });
      
      return tweets;
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error("Failed to load feed", {
        description: "Could not load tweets from server."
      });
      return [];
    }
  },
  
  getExploreFeed: async () => {
    try {
      console.log("Fetching explore feed from Supabase...");
      
      const { data, error } = await supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        throw error;
      }
      
      console.log("Explore feed data from Supabase:", data);
      
      // Convert to application Tweet type
      const tweets = data.map(item => {
        const user = item.users ? dbUserToUser(item.users) : null;
        return dbTweetToTweet(item, user!);
      });
      
      return tweets;
    } catch (error) {
      console.error('Error fetching explore feed:', error);
      toast.error("Failed to load tweets", {
        description: "Could not load tweets from server."
      });
      return [];
    }
  },
  
  searchTweets: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .or(`content.ilike.%${query}%,users.username.ilike.%${query}%,users.display_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      // Convert to application Tweet type
      return data.map(item => {
        const user = item.users ? dbUserToUser(item.users) : null;
        return dbTweetToTweet(item, user!);
      });
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  },
  
  createTweet: async (content: string, attachments: string[] = []) => {
    const token = localStorage.getItem('jwt_token');
    
    try {
      console.log('Creating tweet with content:', content);
      console.log('Attachments:', attachments);
      
      // Get current user
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}') as User;
      console.log('Current user data:', userData);
      
      if (!userData || !userData.id) {
        console.error('No user data available for tweet creation');
        toast.error("User data missing", { 
          description: "Could not find your user information. Please reconnect your wallet." 
        });
        throw new Error('No user data available');
      }
      
      // Extract hashtags from content
      const hashtags = content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [];
      
      // Extract mentions from content
      const mentions = content.match(/@(\w+)/g)?.map(mention => mention.substring(1)) || [];
      
      // Create tweet in Supabase
      const { data, error } = await supabase
        .from('tweets')
        .insert({
          user_id: userData.id,
          content,
          attachments,
          hashtags,
          mentions,
          created_at: new Date().toISOString(),
        })
        .select('*, users:user_id(*)')
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Tweet created successfully in Supabase:', data);
      
      // Convert to application Tweet type
      const user = data.users ? dbUserToUser(data.users) : userData;
      return dbTweetToTweet(data, user);
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      toast.error("Failed to create tweet", {
        description: error.message || "Please try again later."
      });
      throw error;
    }
  },
  
  getTweet: async (id: string) => {
    try {
      // Try Supabase
      const { data, error } = await supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Convert to application Tweet type
      const user = data.users ? dbUserToUser(data.users) : null;
      return dbTweetToTweet(data, user!);
    } catch (error) {
      console.error(`Error fetching tweet ${id}:`, error);
      return null;
    }
  },
  
  deleteTweet: async (id: string) => {
    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting tweet ${id}:`, error);
      toast.error("Failed to delete tweet");
      throw error;
    }
  },
  
  likeTweet: async (id: string) => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot like this tweet" });
      return { success: false };
    }
    
    try {
      // Get current user ID
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
      const userId = userData?.id;
      
      if (!userId) {
        toast.error("User data missing", { description: "Please log in to like tweets" });
        return { success: false, message: "Authentication required" };
      }
      
      // Get current tweet
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .select('likes')
        .eq('id', id)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Check if user already liked the tweet
      const currentLikes = tweetData.likes || [];
      if (currentLikes.includes(userId)) {
        return { success: true, message: "Already liked" };
      }
      
      // Add user to likes array
      const newLikes = [...currentLikes, userId];
      
      // Update tweet
      const { error } = await supabase
        .from('tweets')
        .update({ likes: newLikes })
        .eq('id', id);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error liking tweet ${id}:`, error);
      toast.error("Failed to like tweet");
      return { success: false, error };
    }
  },
  
  unlikeTweet: async (id: string) => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot unlike this tweet" });
      return { success: false };
    }
    
    try {
      // Get current user ID
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
      const userId = userData?.id;
      
      if (!userId) {
        toast.error("User data missing", { description: "Please log in to unlike tweets" });
        return { success: false, message: "Authentication required" };
      }
      
      // Get current tweet
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .select('likes')
        .eq('id', id)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Check if user already liked the tweet
      const currentLikes = tweetData.likes || [];
      if (!currentLikes.includes(userId)) {
        return { success: true, message: "Not liked" };
      }
      
      // Remove user from likes array
      const newLikes = currentLikes.filter((uid: string) => uid !== userId);
      
      // Update tweet
      const { error } = await supabase
        .from('tweets')
        .update({ likes: newLikes })
        .eq('id', id);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error unliking tweet ${id}:`, error);
      toast.error("Failed to unlike tweet");
      return { success: false, error };
    }
  },
  
  retweet: async (id: string, comment?: string) => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot retweet this tweet" });
      return { success: false };
    }
    
    try {
      // Get current user ID
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
      const userId = userData?.id;
      
      if (!userId) {
        toast.error("User data missing", { description: "Please log in to retweet" });
        return { success: false, message: "Authentication required" };
      }
      
      // Get the original tweet
      const { data: originalTweet, error: tweetError } = await supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .eq('id', id)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Update retweets count on the original tweet
      const currentRetweets = originalTweet.retweets || [];
      if (!currentRetweets.includes(userId)) {
        const newRetweets = [...currentRetweets, userId];
        
        const { error: updateError } = await supabase
          .from('tweets')
          .update({ retweets: newRetweets })
          .eq('id', id);
          
        if (updateError) throw updateError;
      }
      
      // Create a new tweet as a retweet if there's a comment
      if (comment) {
        const retweetContent = `RT @${originalTweet.users.username}: ${comment}`;
        
        const { data, error } = await supabase
          .from('tweets')
          .insert({
            user_id: userId,
            content: retweetContent,
            retweet_of: id,
            created_at: new Date().toISOString(),
            hashtags: originalTweet.hashtags || []
          })
          .select('*, users:user_id(*)')
          .single();
          
        if (error) throw error;
        
        const user = data.users ? dbUserToUser(data.users) : userData;
        return { success: true, tweet: dbTweetToTweet(data, user) };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error retweeting tweet ${id}:`, error);
      toast.error("Failed to retweet");
      return { success: false, error };
    }
  },
  
  unretweet: async (id: string) => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot unretweet this tweet" });
      return { success: false };
    }
    
    try {
      // Get current user ID
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
      const userId = userData?.id;
      
      if (!userId) {
        toast.error("User data missing", { description: "Please log in to unretweet" });
        return { success: false, message: "Authentication required" };
      }
      
      // Get current tweet
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .select('retweets')
        .eq('id', id)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Check if user already retweeted the tweet
      const currentRetweets = tweetData.retweets || [];
      if (!currentRetweets.includes(userId)) {
        return { success: true, message: "Not retweeted" };
      }
      
      // Remove user from retweets array
      const newRetweets = currentRetweets.filter((uid: string) => uid !== userId);
      
      // Update tweet
      const { error } = await supabase
        .from('tweets')
        .update({ retweets: newRetweets })
        .eq('id', id);
        
      if (error) throw error;
      
      // Also delete any retweet tweets
      const { error: deleteError } = await supabase
        .from('tweets')
        .delete()
        .eq('user_id', userId)
        .eq('retweet_of', id);
        
      if (deleteError) console.error('Error deleting retweet:', deleteError);
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error unretweeting tweet ${id}:`, error);
      toast.error("Failed to unretweet");
      return { success: false, error };
    }
  },
  
  replyToTweet: async (id: string, content: string, attachments?: string[]) => {
    if (!id || !content) {
      toast.error("Invalid tweet or empty reply", { description: "Cannot reply to this tweet" });
      return { success: false };
    }
    
    try {
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
      if (!userData || !userData.id) {
        toast.error("User data missing", { description: "Please log in to reply" });
        return { success: false, message: "Authentication required" };
      }
      
      // Create reply in Supabase
      const { data, error } = await supabase
        .from('tweets')
        .insert({
          user_id: userData.id,
          content,
          attachments: attachments || [],
          reply_to: id,
          created_at: new Date().toISOString()
        })
        .select('*, users:user_id(*)')
        .single();
        
      if (error) throw error;
      
      // Increment comment count on the original tweet
      const { data: originalTweet, error: fetchError } = await supabase
        .from('tweets')
        .select('comment_count')
        .eq('id', id)
        .single();
        
      if (!fetchError) {
        const newCount = (originalTweet.comment_count || 0) + 1;
        
        await supabase
          .from('tweets')
          .update({ comment_count: newCount })
          .eq('id', id);
      }
      
      // Convert to application Tweet type
      const user = data.users ? dbUserToUser(data.users) : userData;
      return { success: true, tweet: dbTweetToTweet(data, user) };
    } catch (error: any) {
      console.error(`Error replying to tweet ${id}:`, error);
      toast.error("Failed to post reply");
      return { success: false, error };
    }
  },
  
  getTweetReplies: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, users:user_id(*)')
        .eq('reply_to', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Convert to application Tweet type
      return data.map(item => {
        const user = item.users ? dbUserToUser(item.users) : null;
        return dbTweetToTweet(item, user!);
      });
    } catch (error) {
      console.error(`Error fetching replies for tweet ${id}:`, error);
      return [];
    }
  },
  
  shareTweet: async (id: string, platform = 'default') => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot share this tweet" });
      return { success: false };
    }
    
    try {
      // Get the tweet first
      const tweet = await tweetService.getTweet(id);
      if (!tweet) {
        toast.error("Tweet not found");
        return { success: false };
      }
      
      // Create share URL
      const shareUrl = `https://f3oci3ty.xyz/tweet/${id}`;
      
      // Handle sharing based on platform
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.content)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'copy':
          navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard");
          break;
        default:
          // Default share action using Web Share API if available
          if (navigator.share) {
            await navigator.share({
              title: `Tweet by @${tweet.user.username}`,
              text: tweet.content,
              url: shareUrl
            });
          } else {
            // Fallback if Web Share API is not available
            navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard");
          }
      }
      
      // Log the share action
      console.log(`Tweet ${id} shared via ${platform}`);
      
      return { success: true, message: `Shared via ${platform}` };
    } catch (error: any) {
      console.error(`Error sharing tweet ${id}:`, error);
      toast.error("Failed to share tweet", { description: error.message });
      return { success: false, error };
    }
  }
};
