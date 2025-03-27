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
      
      // Merge with local tweets
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const allTweets = [...localTweets, ...normalizedTweets].filter(
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
      
      // Normalize the response data to handle different formats
      const normalizedTweets = normalizeTweetResponse(response.data);
      
      // Merge with local tweets
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      const allTweets = [...localTweets, ...normalizedTweets].filter(
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
    user: normalizeUser(item.user || item.userId) || {
      id: 'unknown',
      username: 'unknown',
      displayName: 'Unknown User',
      avatarUrl: '/placeholder.svg'
    },
    likes: typeof item.likes === 'number' ? item.likes : (item.likeCount || 0),
    retweets: typeof item.retweets === 'number' ? item.retweets : (item.retweetCount || 0),
    comments: typeof item.comments === 'number' ? item.comments : (item.commentCount || 0),
    hashtags: item.hashtags || extractHashtags(item.content || '')
  };
  
  return tweet;
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

// Helper function to process API response that might have a nested tweet structure
function processApiResponse(data: any): Tweet[] {
  return normalizeTweetResponse(data);
}

// Helper function to process a tweet object and ensure it has all required fields
function processTweetObject(tweet: any): Tweet | null {
  return normalizeTweet(tweet);
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
