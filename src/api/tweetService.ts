
import apiClient from './apiClient';
import { toast } from "sonner";
import { Tweet, User } from '@/lib/types';

export const tweetService = {
  getFeed: async () => {
    try {
      console.log("Fetching feed from API...");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/feed');
      console.log("Feed response:", response.data);
      
      // Handle different response formats
      let apiTweets = [];
      if (Array.isArray(response.data)) {
        apiTweets = response.data;
      } else if (response.data.tweets && Array.isArray(response.data.tweets)) {
        apiTweets = response.data.tweets;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        apiTweets = response.data.data;
      } else {
        // Handle array of objects with tweet property
        apiTweets = processApiResponse(response.data);
      }
      
      // Merge with local tweets
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const allTweets = [...localTweets, ...apiTweets].filter(
        (tweet, index, self) => index === self.findIndex((t) => t.id === tweet.id)
      );
      
      console.log('All tweets after merging:', allTweets);
      return allTweets;
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
      
      // Handle different response formats
      let apiTweets = [];
      if (Array.isArray(response.data)) {
        apiTweets = response.data;
      } else if (response.data.tweets && Array.isArray(response.data.tweets)) {
        apiTweets = response.data.tweets;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        apiTweets = response.data.data;
      } else {
        // Handle array of objects with tweet property
        apiTweets = processApiResponse(response.data);
      }
      
      // Merge with local tweets
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const allTweets = [...localTweets, ...apiTweets].filter(
        (tweet, index, self) => index === self.findIndex((t) => t.id === tweet.id)
      );
      
      console.log('All tweets after merging:', allTweets);
      return allTweets;
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
    if (!token) {
      toast.error("Authentication required", {
        description: "Please connect your wallet to post tweets"
      });
      throw new Error('Authentication required');
    }
    
    try {
      console.log('Creating tweet with content:', content);
      
      // Create a mock tweet with user data
      const userData = JSON.parse(localStorage.getItem('current_user') || '{}') as User;
      console.log('Current user data:', userData);
      
      if (!userData || !userData.id) {
        console.error('No user data available for tweet creation');
        toast.error("User data missing", { 
          description: "Could not find your user information. Please reconnect your wallet." 
        });
        throw new Error('No user data available');
      }
      
      // Try to call the real API first
      try {
        console.log('Attempting to call the real API endpoint');
        const response = await apiClient.post('https://f3oci3ty.xyz/api/tweets', { content, attachments });
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
        if (!newTweet.user && userData) {
          newTweet.user = userData;
        }
        
        // Ensure tweet has an id
        if (!newTweet.id && newTweet._id) {
          newTweet.id = newTweet._id;
        }
        
        // Ensure timestamp is valid
        if (!newTweet.timestamp || typeof newTweet.timestamp !== 'string' || isNaN(new Date(newTweet.timestamp).getTime())) {
          console.warn('Tweet has invalid timestamp, setting to current time');
          newTweet.timestamp = new Date().toISOString();
        }
        
        // If createdAt exists but no timestamp, use createdAt as timestamp
        if (!newTweet.timestamp && newTweet.createdAt) {
          newTweet.timestamp = newTweet.createdAt;
        }
        
        // Also save locally for offline use
        saveLocalTweet(newTweet);
        
        return newTweet;
      } catch (apiError) {
        console.error('API call failed, creating local tweet instead:', apiError);
        
        // If API fails, create a local tweet
        const mockTweet: Tweet = {
          id: 'local-' + Date.now(),
          content: content,
          user: userData,
          timestamp: new Date().toISOString(), // Ensure valid ISO timestamp
          likes: 0,
          retweets: 0,
          comments: 0,
          hashtags: content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || []
        };
        
        // Save to local storage
        saveLocalTweet(mockTweet);
        
        console.log('Created local tweet:', mockTweet);
        toast.info("Tweet saved locally", {
          description: "API unavailable. Tweet will be visible to you only."
        });
        
        return mockTweet;
      }
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      throw error;
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
      throw error;
    }
  },
  
  likeTweet: async (id: string) => {
    try {
      const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking tweet ${id}:`, error);
      throw error;
    }
  },
  
  unlikeTweet: async (id: string) => {
    try {
      const response = await apiClient.delete(`https://f3oci3ty.xyz/api/tweets/${id}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error unliking tweet ${id}:`, error);
      throw error;
    }
  },
  
  retweet: async (id: string, comment?: string) => {
    try {
      const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/retweet`, 
        comment ? { comment } : undefined
      );
      return response.data;
    } catch (error) {
      console.error(`Error retweeting tweet ${id}:`, error);
      throw error;
    }
  },
  
  unretweet: async (id: string) => {
    try {
      const response = await apiClient.delete(`https://f3oci3ty.xyz/api/tweets/${id}/retweet`);
      return response.data;
    } catch (error) {
      console.error(`Error un-retweeting tweet ${id}:`, error);
      throw error;
    }
  },
  
  replyToTweet: async (id: string, content: string, attachments?: string[]) => {
    try {
      const response = await apiClient.post(`https://f3oci3ty.xyz/api/tweets/${id}/reply`, { content, attachments });
      return response.data;
    } catch (error) {
      console.error(`Error replying to tweet ${id}:`, error);
      throw error;
    }
  },
  
  getTweetReplies: async (id: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/tweets/${id}/replies`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching replies for tweet ${id}:`, error);
      return [];
    }
  },
};

// Helper function to process API response that might have a nested tweet structure
function processApiResponse(data: any): Tweet[] {
  if (!data) return [];
  
  // If data is an array, process each item
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item.tweet) return processTweetObject(item.tweet);
      if (item.success && item.tweet) return processTweetObject(item.tweet);
      return processTweetObject(item);
    }).filter(Boolean);
  }
  
  // If it's a single object with success and tweet properties
  if (data.success && data.tweet) {
    return [processTweetObject(data.tweet)];
  }
  
  return [];
}

// Helper function to process a tweet object and ensure it has all required fields
function processTweetObject(tweet: any): Tweet | null {
  if (!tweet) return null;
  
  // Use _id as id if id is missing
  if (!tweet.id && tweet._id) {
    tweet.id = tweet._id;
  }
  
  // Ensure we have user data
  if (!tweet.user && tweet.userId) {
    if (typeof tweet.userId === 'object') {
      tweet.user = {
        id: tweet.userId._id || tweet.userId.id,
        username: tweet.userId.username,
        displayName: tweet.userId.displayName || tweet.userId.username,
        avatarUrl: tweet.userId.profileImage || tweet.userId.avatarUrl
      };
    } else {
      // Try to get current user as fallback
      try {
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        tweet.user = currentUser;
      } catch (e) {
        console.error('Error parsing current user from localStorage:', e);
      }
    }
  }
  
  // Convert timestamps if needed
  if (!tweet.timestamp && tweet.createdAt) {
    tweet.timestamp = tweet.createdAt;
  }
  
  // Ensure timestamp is valid
  if (!tweet.timestamp || typeof tweet.timestamp !== 'string' || isNaN(new Date(tweet.timestamp).getTime())) {
    console.warn('Tweet has invalid timestamp, setting to current time');
    tweet.timestamp = new Date().toISOString();
  }
  
  // Set default counts if missing
  if (tweet.likes === undefined) {
    tweet.likes = tweet.likeCount || 0;
  }
  
  if (tweet.retweets === undefined) {
    tweet.retweets = tweet.retweetCount || 0;
  }
  
  if (tweet.comments === undefined) {
    tweet.comments = tweet.commentCount || 0;
  }
  
  // Extract hashtags if not present
  if (!tweet.hashtags && tweet.content) {
    tweet.hashtags = tweet.content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [];
  }
  
  return tweet;
}

// Helper function to save a tweet to local storage
function saveLocalTweet(tweet: Tweet) {
  const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
  
  // Check if tweet already exists
  const exists = localTweets.some((t: Tweet) => t.id === tweet.id);
  
  // Ensure timestamp is valid before saving
  if (!tweet.timestamp || typeof tweet.timestamp !== 'string' || isNaN(new Date(tweet.timestamp).getTime())) {
    console.warn('Tweet has invalid timestamp before saving, fixing it');
    tweet.timestamp = new Date().toISOString();
  }
  
  if (!exists) {
    // Add to beginning of array
    localTweets.unshift(tweet);
    // Limit to 100 tweets to avoid localStorage size issues
    const limitedTweets = localTweets.slice(0, 100);
    localStorage.setItem('local_tweets', JSON.stringify(limitedTweets));
    console.log('Tweet saved to local storage:', tweet);
  }
}
