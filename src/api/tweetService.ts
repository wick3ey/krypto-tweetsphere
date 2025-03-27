import { supabase } from '@/integrations/supabase/client';
import { Tweet } from '@/lib/types';
import { dbTweetToTweet, dbUserToUser } from '@/lib/db-types';
import { mockTweets } from '@/lib/mockData';
import { toast } from 'sonner';

export const tweetService = {
  // Fetch tweets for the main feed (tweets from people the user follows)
  getFeed: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found, returning mock data for feed');
        return mockTweets;
      }

      // Get tweets from the database
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching feed:', error);
        throw error;
      }
      
      // Convert database tweets to application tweets
      const tweets = data?.map(item => {
        if (!item.user) return null; // Skip if no user data
        return dbTweetToTweet(item, dbUserToUser(item.user));
      }).filter(Boolean) || [];
      
      console.log(`Fetched ${tweets.length} tweets for user feed`);
      
      return tweets;
    } catch (error) {
      console.error('Error in getFeed:', error);
      return mockTweets;
    }
  },

  // Fetch tweets for the explore feed (public tweets)
  getExploreFeed: async () => {
    try {
      console.log('Fetching explore feed from Supabase...');
      
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching explore feed:', error);
        throw error;
      }
      
      console.log('Explore feed data from Supabase:', data);
      
      // If no tweets in database yet, return mock data
      if (!data || data.length === 0) {
        return mockTweets;
      }
      
      // Convert database tweets to application tweets
      const tweets = data.map(item => {
        if (!item.user) return null; // Skip if no user data
        return dbTweetToTweet(item, dbUserToUser(item.user));
      }).filter(Boolean);
      
      return tweets;
    } catch (error) {
      console.error('Error in getExploreFeed:', error);
      return mockTweets;
    }
  },

  // Create a new tweet
  createTweet: async (content: string, attachments = []) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att skapa ett inlägg');
      }
      
      // Extract hashtags and mentions from content
      const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      const mentions = content.match(/@[a-zA-Z0-9_]+/g) || [];
      
      const newTweet = {
        content,
        user_id: session.user.id,
        hashtags,
        mentions,
        attachments
      };
      
      const { data, error } = await supabase
        .from('tweets')
        .insert(newTweet)
        .select('*, user:user_id(*)')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Kunde inte hämta användardata');
      }
      
      return dbTweetToTweet(data, dbUserToUser(data.user));
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      toast.error('Kunde inte skapa inlägg', { 
        description: error.message || 'Ett fel uppstod vid skapandet av inlägg' 
      });
      throw error;
    }
  },

  // Rename getTweet to getTweetById to maintain consistency with hooks
  getTweetById: async (tweetId: string): Promise<Tweet> => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*, user:user_id(*)')
        .eq('id', tweetId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Kunde inte hämta användardata');
      }
      
      return dbTweetToTweet(data, dbUserToUser(data.user));
    } catch (error) {
      console.error(`Error fetching tweet with ID ${tweetId}:`, error);
      throw error;
    }
  },

  // Alias getTweet for backward compatibility
  getTweet: async (tweetId: string): Promise<Tweet> => {
    return tweetService.getTweetById(tweetId);
  },

  // Add getUserTweets method
  getUserTweets: async (userId: string, options = {}) => {
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
        return dbTweetToTweet(item, dbUserToUser(item.user));
      }).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getUserTweets:', error);
      throw error;
    }
  },

  // Get comments for a specific tweet
  getComments: async (tweetId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:user_id(*)')
        .eq('tweet_id', tweetId)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching comments for tweet ${tweetId}:`, error);
      return [];
    }
  },

  // Add a comment to a tweet
  addComment: async (tweetId: string, content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att kommentera');
      }
      
      const newComment = {
        content,
        user_id: session.user.id,
        tweet_id: tweetId
      };
      
      const { data, error } = await supabase
        .from('comments')
        .insert(newComment)
        .select('*, user:user_id(*)')
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update comment count on the tweet manually since RPC function isn't available
      const { data: tweetData } = await supabase
        .from('tweets')
        .select('comment_count')
        .eq('id', tweetId)
        .single();
      
      const currentCount = tweetData?.comment_count || 0;
      
      await supabase
        .from('tweets')
        .update({ comment_count: currentCount + 1 })
        .eq('id', tweetId);
      
      return data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Kunde inte lägga till kommentar', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },

  // Like a tweet
  likeTweet: async (tweetId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att gilla ett inlägg');
      }
      
      const userId = session.user.id;
      
      // Get current tweet data
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .select('likes')
        .eq('id', tweetId)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Check if user already liked the tweet
      const likes = tweetData.likes || [];
      if (likes.includes(userId)) {
        return { message: 'Tweet already liked' };
      }
      
      // Add user to likes array
      const updatedLikes = [...likes, userId];
      
      const { error } = await supabase
        .from('tweets')
        .update({ likes: updatedLikes })
        .eq('id', tweetId);
        
      if (error) throw error;
      
      return { success: true, likesCount: updatedLikes.length };
    } catch (error: any) {
      console.error('Error liking tweet:', error);
      toast.error('Kunde inte gilla inlägg', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },

  // Unlike a tweet
  unlikeTweet: async (tweetId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att ogilla ett inlägg');
      }
      
      const userId = session.user.id;
      
      // Get current tweet data
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .select('likes')
        .eq('id', tweetId)
        .single();
        
      if (tweetError) throw tweetError;
      
      // Remove user from likes array
      const likes = tweetData.likes || [];
      const updatedLikes = likes.filter((id: string) => id !== userId);
      
      const { error } = await supabase
        .from('tweets')
        .update({ likes: updatedLikes })
        .eq('id', tweetId);
        
      if (error) throw error;
      
      return { success: true, likesCount: updatedLikes.length };
    } catch (error: any) {
      console.error('Error unliking tweet:', error);
      toast.error('Kunde inte ogilla inlägg', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },

  // Retweet a tweet
  retweet: async (tweetId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att dela ett inlägg');
      }
      
      const userId = session.user.id;
      
      // Create a retweet
      const newRetweet = {
        retweet_of: tweetId,
        user_id: userId,
        content: '' // Empty content for pure retweets
      };
      
      const { data, error } = await supabase
        .from('tweets')
        .insert(newRetweet)
        .select('*, user:user_id(*)')
        .single();
        
      if (error) throw error;
      
      // Also update the original tweet's retweet count
      const { data: originalTweet, error: fetchError } = await supabase
        .from('tweets')
        .select('retweets')
        .eq('id', tweetId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const retweets = originalTweet.retweets || [];
      if (!retweets.includes(userId)) {
        const { error: updateError } = await supabase
          .from('tweets')
          .update({ retweets: [...retweets, userId] })
          .eq('id', tweetId);
          
        if (updateError) throw updateError;
      }
      
      if (!data.user) {
        throw new Error('Kunde inte hämta användardata');
      }
      
      return dbTweetToTweet(data, dbUserToUser(data.user));
    } catch (error: any) {
      console.error('Error retweeting:', error);
      toast.error('Kunde inte dela inlägg', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },
  
  // Unretweet a tweet
  unretweet: async (tweetId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att ta bort en delning');
      }
      
      const userId = session.user.id;
      
      // Find and delete user's retweet of this tweet
      const { data: userRetweet, error: findError } = await supabase
        .from('tweets')
        .select('id')
        .eq('retweet_of', tweetId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (findError) throw findError;
      
      if (userRetweet) {
        const { error: deleteError } = await supabase
          .from('tweets')
          .delete()
          .eq('id', userRetweet.id);
          
        if (deleteError) throw deleteError;
      }
      
      // Update the original tweet's retweet array
      const { data: originalTweet, error: fetchError } = await supabase
        .from('tweets')
        .select('retweets')
        .eq('id', tweetId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const retweets = originalTweet.retweets || [];
      const updatedRetweets = retweets.filter((id: string) => id !== userId);
      
      const { error: updateError } = await supabase
        .from('tweets')
        .update({ retweets: updatedRetweets })
        .eq('id', tweetId);
        
      if (updateError) throw updateError;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error unretweeting:', error);
      toast.error('Kunde inte ta bort delning', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },

  // Delete a tweet
  deleteTweet: async (tweetId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att ta bort ett inlägg');
      }
      
      // Verify ownership of the tweet
      const { data: tweetData, error: fetchError } = await supabase
        .from('tweets')
        .select('user_id')
        .eq('id', tweetId)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (tweetData.user_id !== session.user.id) {
        throw new Error('Du kan bara ta bort dina egna inlägg');
      }
      
      // Delete the tweet
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', tweetId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting tweet:', error);
      toast.error('Kunde inte ta bort inlägg', { 
        description: error.message || 'Ett fel uppstod' 
      });
      throw error;
    }
  },
  
  // Share a tweet (to external platform)
  shareTweet: async (tweetId: string, platform: string) => {
    try {
      // This is a client-side function that just handles sharing to platforms
      // In a real app, this might track share analytics
      console.log(`Sharing tweet ${tweetId} to ${platform}`);
      
      // Get the tweet to share
      const tweet = await tweetService.getTweet(tweetId);
      const shareText = `Check out this tweet: "${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}"`;
      
      // Handle sharing based on platform
      switch(platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
          break;
        case 'copy':
          navigator.clipboard.writeText(window.location.href);
          toast.success('Länk kopierad till urklipp');
          break;
        default:
          break;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sharing tweet:', error);
      toast.error('Kunde inte dela inlägg');
      return { success: false };
    }
  },

  // Search for tweets
  searchTweets: async (query: string) => {
    try {
      if (!query || query.trim() === '') {
        return [];
      }
      
      // Search by content
      const { data: contentResults, error: contentError } = await supabase
        .from('tweets')
        .select('*, user:user_id(*)')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (contentError) throw contentError;
      
      // Search by hashtag if query starts with #
      let hashtagResults = [];
      if (query.startsWith('#')) {
        const hashtag = query.substring(1);
        const { data, error } = await supabase
          .from('tweets')
          .select('*, user:user_id(*)')
          .contains('hashtags', [hashtag])
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (!error && data) {
          hashtagResults = data;
        }
      }
      
      // Combine and deduplicate results
      const allResults = [...(contentResults || []), ...hashtagResults];
      const uniqueIds = new Set();
      const uniqueResults = allResults.filter(tweet => {
        if (uniqueIds.has(tweet.id)) return false;
        uniqueIds.add(tweet.id);
        return true;
      });
      
      // Map to proper Tweet objects
      return uniqueResults.filter(item => item.user).map(item => {
        return dbTweetToTweet(item, dbUserToUser(item.user));
      });
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  }
};
