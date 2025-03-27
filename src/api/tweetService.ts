
import apiClient from './apiClient';
import { toast } from "sonner";
import { Tweet, User } from '@/lib/types';

export const tweetService = {
  getFeed: async () => {
    try {
      console.log("Fetching feed from API...");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/feed');
      console.log("Feed response:", response.data);
      
      // Normalize the response data to handle different formats
      const normalizedTweets = normalizeTweetResponse(response.data);
      
      // Store tweets locally for offline access
      if (normalizedTweets && normalizedTweets.length > 0) {
        saveLocalTweets(normalizedTweets);
      }
      
      return normalizedTweets;
    } catch (error) {
      console.error('Error fetching feed:', error);
      
      // Return local tweets if API fails
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      console.log('Returning local tweets due to API error:', localTweets);
      
      toast.error("Failed to load feed", {
        description: "Could not load tweets from server. Showing local tweets only."
      });
      
      return localTweets;
    }
  },
  
  getExploreFeed: async () => {
    try {
      console.log("Fetching explore feed from API...");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/explore');
      console.log("Explore feed response:", response.data);
      
      // Normalize the response data to handle different formats
      const normalizedTweets = normalizeTweetResponse(response.data);
      
      // Store tweets locally for offline access
      if (normalizedTweets && normalizedTweets.length > 0) {
        saveLocalTweets(normalizedTweets);
      }
      
      return normalizedTweets;
    } catch (error) {
      console.error('Error fetching explore feed:', error);
      
      // Return local tweets if API fails
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      console.log('Returning local tweets due to API error:', localTweets);
      
      toast.error("Failed to load tweets", {
        description: "Could not load tweets from server. Showing local tweets only."
      });
      
      return localTweets;
    }
  },
  
  searchTweets: async (query: string) => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/search', { params: { query } });
      return Array.isArray(response.data) ? response.data : 
             (response.data.data ? response.data.data : []);
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  },
  
  createTweet: async (content: string, attachments?: string[]) => {
    const token = localStorage.getItem('jwt_token');
    
    try {
      console.log('Creating tweet with content:', content);
      
      // Create a mock tweet with user data for local storage
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}') as User;
      console.log('Current user data:', userData);
      
      if (!userData || !userData.id) {
        console.error('No user data available for tweet creation');
        toast.error("User data missing", { 
          description: "Could not find your user information. Please reconnect your wallet." 
        });
        throw new Error('No user data available');
      }
      
      // Always try to send to the real API first, even if no token (for public posting)
      try {
        console.log('Sending tweet to API endpoint');
        const payload = { content, attachments };
        console.log('Tweet payload:', payload);
        
        const response = await apiClient.post('https://f3oci3ty.xyz/api/tweets', payload);
        console.log('Tweet created successfully via API:', response.data);
        
        // Handle different response formats
        let newTweet;
        if (response.data.data) {
          newTweet = response.data.data;
        } else if (response.data.tweet) {
          newTweet = response.data.tweet;
        } else if (response.data.success && response.data.tweet) {
          newTweet = response.data.tweet;
        } else {
          newTweet = response.data;
        }
        
        // Make sure the tweet has all necessary fields
        newTweet = normalizeTweet(newTweet);
        
        // Also save locally for offline use
        saveLocalTweet(newTweet);
        
        return newTweet;
      } catch (apiError) {
        console.error('API call failed:', apiError);
        
        // If not authenticated, show error
        if (!token) {
          toast.error("Authentication required for persistent tweets", {
            description: "Connect your wallet to save tweets to the server"
          });
        }
        
        // Create a local tweet as fallback
        const mockTweet: Tweet = {
          id: 'local-' + Date.now(),
          content: content,
          user: userData,
          timestamp: new Date().toISOString(),
          likes: 0,
          retweets: 0,
          comments: 0,
          hashtags: content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || []
        };
        
        // Save to local storage
        saveLocalTweet(mockTweet);
        
        console.log('Created local tweet as fallback:', mockTweet);
        toast.info("Tweet saved locally", {
          description: "API unavailable. Attempting to sync in the background."
        });
        
        // Attempt to sync local tweet in the background
        syncLocalTweet(mockTweet);
        
        return mockTweet;
      }
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      throw error;
    }
  },
  
  syncLocalTweets: async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('Cannot sync tweets: Not authenticated');
      return { success: false, synced: 0 };
    }
    
    try {
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const localOnlyTweets = localTweets.filter((t: Tweet) => t.id.startsWith('local-'));
      
      if (localOnlyTweets.length === 0) {
        console.log('No local-only tweets to sync');
        return { success: true, synced: 0 };
      }
      
      console.log(`Attempting to sync ${localOnlyTweets.length} local tweets`);
      
      let syncedCount = 0;
      for (const tweet of localOnlyTweets) {
        try {
          await syncLocalTweet(tweet);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync tweet ${tweet.id}:`, error);
        }
      }
      
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} tweets to server`);
      }
      
      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('Error syncing local tweets:', error);
      return { success: false, synced: 0 };
    }
  },
  
  getTweet: async (id: string) => {
    try {
      // Check local tweets first
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const localTweet = localTweets.find((t: Tweet) => t.id === id);
      
      if (localTweet) {
        console.log(`Found tweet ${id} in local storage:`, localTweet);
        return localTweet;
      }
      
      // If not found locally, try the API
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/tweets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tweet ${id}:`, error);
      return null;
    }
  },
  
  deleteTweet: async (id: string) => {
    try {
      // If it's a local tweet, remove from local storage
      if (id.startsWith('local-')) {
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const updatedTweets = localTweets.filter((t: Tweet) => t.id !== id);
        localStorage.setItem('local_tweets', JSON.stringify(updatedTweets));
        console.log(`Deleted local tweet ${id}`);
        return { success: true };
      }
      
      // Otherwise try to delete from API
      const response = await apiClient.delete(`https://f3oci3ty.xyz/api/tweets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting tweet ${id}:`, error);
      
      // Fallback: Still remove from local storage if API fails
      try {
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const updatedTweets = localTweets.filter((t: Tweet) => t.id !== id);
        localStorage.setItem('local_tweets', JSON.stringify(updatedTweets));
        toast.success("Tweet deleted locally");
        return { success: true, message: "Deleted locally only" };
      } catch (localError) {
        console.error("Could not delete locally either:", localError);
        toast.error("Failed to delete tweet");
        throw error;
      }
    }
  },
  
  likeTweet: async (id: string) => {
    if (!id) {
      toast.error("Invalid tweet ID", { description: "Cannot like this tweet" });
      return { success: false };
    }
    
    try {
      // Try to call API first
      try {
        const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/like`);
        console.log("API like successful:", response.data);
        return response.data;
      } catch (apiError) {
        console.log("API like failed, using local fallback:", apiError);
        
        // Fallback to updating the tweet locally
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        
        if (tweetIndex >= 0) {
          // Increment the likes count
          localTweets[tweetIndex].likes = (localTweets[tweetIndex].likes || 0) + 1;
          localTweets[tweetIndex].likeCount = (localTweets[tweetIndex].likeCount || 0) + 1;
          localStorage.setItem('local_tweets', JSON.stringify(localTweets));
        }
        
        return { success: true, message: "Liked locally only" };
      }
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
      // Try to call API first
      try {
        const response = await apiClient.delete(`https://f3oci3ty.xyz/api/tweets/${id}/like`);
        console.log("API unlike successful:", response.data);
        return response.data;
      } catch (apiError) {
        console.log("API unlike failed, using local fallback:", apiError);
        
        // Fallback to updating the tweet locally
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        
        if (tweetIndex >= 0) {
          // Decrement the likes count, but don't go below 0
          localTweets[tweetIndex].likes = Math.max(0, (localTweets[tweetIndex].likes || 0) - 1);
          localTweets[tweetIndex].likeCount = Math.max(0, (localTweets[tweetIndex].likeCount || 0) - 1);
          localStorage.setItem('local_tweets', JSON.stringify(localTweets));
        }
        
        return { success: true, message: "Unliked locally only" };
      }
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
      // Try to call API first
      try {
        const payload = comment ? { comment } : {};
        const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/retweet`, payload);
        console.log("API retweet successful:", response.data);
        return response.data;
      } catch (apiError) {
        console.log("API retweet failed, using local fallback:", apiError);
        
        // Fallback to updating the tweet locally
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        
        if (tweetIndex >= 0) {
          // Increment the retweets count
          localTweets[tweetIndex].retweets = (localTweets[tweetIndex].retweets || 0) + 1;
          localTweets[tweetIndex].retweetCount = (localTweets[tweetIndex].retweetCount || 0) + 1;
          localStorage.setItem('local_tweets', JSON.stringify(localTweets));
          
          // Also create a local retweet if we have user data
          const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
          if (userData && userData.id) {
            const originalTweet = localTweets[tweetIndex];
            
            // Create a retweet object
            const retweetContent = comment || `RT @${originalTweet.user.username}: ${originalTweet.content}`;
            const retweetId = 'local-retweet-' + Date.now();
            
            const retweetObj: Tweet = {
              id: retweetId,
              content: retweetContent,
              user: userData,
              timestamp: new Date().toISOString(),
              likes: 0,
              retweets: 0,
              comments: 0,
              hashtags: originalTweet.hashtags || [],
              retweetOf: id
            };
            
            // Save it to local storage
            localTweets.unshift(retweetObj);
            localStorage.setItem('local_tweets', JSON.stringify(localTweets));
          }
        }
        
        return { success: true, message: "Retweeted locally only" };
      }
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
      // Try to call API first
      try {
        const response = await apiClient.delete(`https://f3oci3ty.xyz/api/tweets/${id}/retweet`);
        console.log("API unretweet successful:", response.data);
        return response.data;
      } catch (apiError) {
        console.log("API unretweet failed, using local fallback:", apiError);
        
        // Fallback to updating the tweet locally
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        
        if (tweetIndex >= 0) {
          // Decrement the retweets count, but don't go below 0
          localTweets[tweetIndex].retweets = Math.max(0, (localTweets[tweetIndex].retweets || 0) - 1);
          localTweets[tweetIndex].retweetCount = Math.max(0, (localTweets[tweetIndex].retweetCount || 0) - 1);
          
          // Also remove any local retweets of this tweet by the current user
          const userData = JSON.parse(localStorage.getItem('current_user') || '{}');
          if (userData && userData.id) {
            const updatedTweets = localTweets.filter((t: Tweet) => {
              return !(t.retweetOf === id && t.user.id === userData.id);
            });
            localStorage.setItem('local_tweets', JSON.stringify(updatedTweets));
          } else {
            localStorage.setItem('local_tweets', JSON.stringify(localTweets));
          }
        }
        
        return { success: true, message: "Unretweeted locally only" };
      }
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
      
      // Try to call API first
      try {
        const payload = { content, attachments };
        const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/reply`, payload);
        console.log("API reply successful:", response.data);
        
        // Update the comments count on the original tweet
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        if (tweetIndex >= 0) {
          localTweets[tweetIndex].comments = (localTweets[tweetIndex].comments || 0) + 1;
          localTweets[tweetIndex].commentCount = (localTweets[tweetIndex].commentCount || 0) + 1;
          localStorage.setItem('local_tweets', JSON.stringify(localTweets));
        }
        
        return response.data;
      } catch (apiError) {
        console.log("API reply failed, using local fallback:", apiError);
        
        // Fallback to creating a local reply
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const originalTweet = localTweets.find((t: Tweet) => t.id === id);
        
        // Create a reply object
        const replyId = 'local-reply-' + Date.now();
        const replyObj: Tweet = {
          id: replyId,
          content: content,
          user: userData,
          timestamp: new Date().toISOString(),
          likes: 0,
          retweets: 0,
          comments: 0,
          hashtags: content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [],
          replyTo: id
        };
        
        // Update comments count on original tweet
        const tweetIndex = localTweets.findIndex((t: Tweet) => t.id === id);
        if (tweetIndex >= 0) {
          localTweets[tweetIndex].comments = (localTweets[tweetIndex].comments || 0) + 1;
          localTweets[tweetIndex].commentCount = (localTweets[tweetIndex].commentCount || 0) + 1;
        }
        
        // Save the reply to local storage
        localTweets.unshift(replyObj);
        localStorage.setItem('local_tweets', JSON.stringify(localTweets));
        
        toast.success("Reply added locally");
        return { success: true, tweet: replyObj, message: "Reply added locally only" };
      }
    } catch (error: any) {
      console.error(`Error replying to tweet ${id}:`, error);
      toast.error("Failed to post reply");
      return { success: false, error };
    }
  },
  
  getTweetReplies: async (id: string) => {
    try {
      // Try API first
      try {
        const response = await apiClient.get(`https://f3oci3ty.xyz/api/tweets/${id}/replies`);
        console.log("API get replies successful:", response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (apiError) {
        console.log("API get replies failed, using local fallback:", apiError);
        
        // Fallback to filtering local tweets for replies
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        const replies = localTweets.filter((t: Tweet) => t.replyTo === id);
        
        return replies;
      }
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

// Function to normalize tweet response data
function normalizeTweetResponse(data: any): Tweet[] {
  if (!data) return [];
  
  // If data is already an array
  if (Array.isArray(data)) {
    return data.map(normalizeTweet).filter(Boolean) as Tweet[];
  }
  
  // If data has tweets property that is an array
  if (data.tweets && Array.isArray(data.tweets)) {
    return data.tweets.map(normalizeTweet).filter(Boolean) as Tweet[];
  }
  
  // If data has data property that is an array
  if (data.data && Array.isArray(data.data)) {
    return data.data.map(normalizeTweet).filter(Boolean) as Tweet[];
  }
  
  // Otherwise return an empty array
  return [];
}

// Function to normalize a single tweet
function normalizeTweet(item: any): Tweet | null {
  if (!item) return null;
  
  // If item has success and tweet properties, use the tweet
  if (item.success === true && item.tweet) {
    return normalizeTweet(item.tweet);
  }
  
  // Create a normalized tweet object
  const tweet: Tweet = {
    id: item.id || item._id || `tweet-${Math.random().toString(36).substring(2, 9)}`,
    content: item.content || '',
    timestamp: ensureValidTimestamp(item.timestamp || item.createdAt),
    user: normalizeUser(item.user || item.userId) || createDefaultUser(),
    likes: typeof item.likes === 'number' ? item.likes : (item.likeCount || 0),
    retweets: typeof item.retweets === 'number' ? item.retweets : (item.retweetCount || 0),
    comments: typeof item.comments === 'number' ? item.comments : (item.commentCount || 0),
    hashtags: item.hashtags || extractHashtags(item.content || ''),
    likeCount: typeof item.likes === 'number' ? item.likes : (item.likeCount || 0),
    retweetCount: typeof item.retweets === 'number' ? item.retweets : (item.retweetCount || 0),
    commentCount: typeof item.comments === 'number' ? item.comments : (item.commentCount || 0),
    createdAt: item.createdAt || item.timestamp || new Date().toISOString()
  };
  
  return tweet;
}

// Create a default user when no user data is available
function createDefaultUser(): User {
  return {
    id: 'unknown-id',
    username: 'unknown',
    displayName: 'Unknown User',
    avatarUrl: '/placeholder.svg',
    walletAddress: '',
    bio: '',
    joinedDate: new Date().toISOString(),
    following: 0,
    followers: 0,
    verified: false
  };
}

// Function to normalize a user object
function normalizeUser(userData: any): User | null {
  if (!userData) return null;
  
  // If userData is a string (like userId), return null
  if (typeof userData === 'string') return null;
  
  // Create a normalized user object
  return {
    id: userData.id || userData._id || 'unknown',
    username: userData.username || 'unknown',
    displayName: userData.displayName || userData.username || 'Unknown User',
    avatarUrl: userData.avatarUrl || userData.profileImage || '/placeholder.svg',
    bio: userData.bio || '',
    walletAddress: userData.walletAddress || '',
    joinedDate: userData.joinedDate || new Date().toISOString(),
    following: userData.following || 0,
    followers: userData.followers || 0,
    verified: userData.verified || false
  };
}

// Function to ensure a valid timestamp
function ensureValidTimestamp(timestamp: any): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      console.warn('Invalid timestamp:', timestamp);
    }
  }
  
  return new Date().toISOString();
}

// Function to extract hashtags from content
function extractHashtags(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

// Helper function to save a tweet to local storage
function saveLocalTweet(tweet: Tweet) {
  const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
  
  // Check if tweet already exists
  const exists = localTweets.some((t: Tweet) => t.id === tweet.id);
  
  // Ensure timestamp is valid before saving
  tweet.timestamp = ensureValidTimestamp(tweet.timestamp);
  
  if (!exists) {
    // Add to beginning of array
    localTweets.unshift(tweet);
    // Limit to 100 tweets to avoid localStorage size issues
    const limitedTweets = localTweets.slice(0, 100);
    localStorage.setItem('local_tweets', JSON.stringify(limitedTweets));
    console.log('Tweet saved to local storage:', tweet);
  }
}

// Helper function to save multiple tweets to local storage
function saveLocalTweets(tweets: Tweet[]) {
  if (!tweets || tweets.length === 0) return;
  
  const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
  let updated = false;
  
  for (const tweet of tweets) {
    // Check if tweet already exists
    const exists = localTweets.some((t: Tweet) => t.id === tweet.id);
    
    if (!exists) {
      // Ensure timestamp is valid before saving
      tweet.timestamp = ensureValidTimestamp(tweet.timestamp);
      localTweets.push(tweet);
      updated = true;
    }
  }
  
  if (updated) {
    // Sort by timestamp (newest first)
    localTweets.sort((a: Tweet, b: Tweet) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Limit to 100 tweets to avoid localStorage size issues
    const limitedTweets = localTweets.slice(0, 100);
    localStorage.setItem('local_tweets', JSON.stringify(limitedTweets));
    console.log(`Saved ${tweets.length} tweets to local storage`);
  }
}

// Function to attempt to sync a local tweet with the server
async function syncLocalTweet(tweet: Tweet) {
  const token = localStorage.getItem('jwt_token');
  if (!token || !tweet.id.startsWith('local-')) {
    return false;
  }
  
  try {
    console.log(`Attempting to sync local tweet ${tweet.id} with server`);
    
    const response = await apiClient.post('https://f3oci3ty.xyz/api/tweets', {
      content: tweet.content,
      attachments: tweet.attachments || []
    });
    
    if (response.data) {
      console.log(`Successfully synced tweet ${tweet.id} to server:`, response.data);
      
      // Remove local tweet and replace with server version
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const updatedTweets = localTweets.filter((t: Tweet) => t.id !== tweet.id);
      
      // Add normalized server tweet
      let serverTweet;
      if (response.data.data) {
        serverTweet = response.data.data;
      } else if (response.data.tweet) {
        serverTweet = response.data.tweet;
      } else if (response.data.success && response.data.tweet) {
        serverTweet = response.data.tweet;
      } else {
        serverTweet = response.data;
      }
      
      // Normalize the server tweet
      const normalizedTweet = normalizeTweet(serverTweet);
      
      if (normalizedTweet) {
        updatedTweets.unshift(normalizedTweet);
      }
      
      localStorage.setItem('local_tweets', JSON.stringify(updatedTweets));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to sync local tweet ${tweet.id}:`, error);
    return false;
  }
}
