import apiClient from './apiClient';
import { toast } from "sonner";

export const tweetService = {
  getFeed: async () => {
    try {
      console.log("Fetching feed from API...");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/feed');
      console.log("Feed response:", response.data);
      return Array.isArray(response.data) ? response.data : 
             (response.data.data ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error("Failed to load feed", {
        description: "Could not load tweets. Network error or service unavailable."
      });
      return [];
    }
  },
  
  getExploreFeed: async () => {
    try {
      console.log("Fetching explore feed from API...");
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/explore');
      console.log("Explore feed response:", response.data);
      return Array.isArray(response.data) ? response.data : 
             (response.data.data ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching explore feed:', error);
      toast.error("Failed to load tweets", {
        description: "Could not load tweets. Network error or service unavailable."
      });
      return [];
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
      
      // For now, let's create a mock successful response since the API might be down
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.log('Using mock tweet creation (API may be down)');
        // Create a mock tweet
        const mockTweet = {
          id: 'local-' + Date.now(),
          content: content,
          user: JSON.parse(localStorage.getItem('current_user') || '{}'),
          timestamp: new Date().toISOString(),
          likes: 0,
          retweets: 0,
          comments: 0,
          hashtags: content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || []
        };
        
        // Store in local storage to display in feed
        const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
        localTweets.unshift(mockTweet);
        localStorage.setItem('local_tweets', JSON.stringify(localTweets));
        
        console.log('Created mock tweet:', mockTweet);
        return mockTweet;
      }
      
      // Attempt to call the real API
      const response = await apiClient.post('https://f3oci3ty.xyz/api/tweets', { content, attachments });
      console.log('Tweet created successfully:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      
      // Create a local tweet if API fails
      console.log('API failed, creating local tweet');
      const mockTweet = {
        id: 'local-' + Date.now(),
        content: content,
        user: JSON.parse(localStorage.getItem('current_user') || '{}'),
        timestamp: new Date().toISOString(),
        likes: 0,
        retweets: 0,
        comments: 0,
        hashtags: content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || []
      };
      
      // Store in local storage
      const localTweets = JSON.parse(localStorage.getItem('local_tweets') || '[]');
      localTweets.unshift(mockTweet);
      localStorage.setItem('local_tweets', JSON.stringify(localTweets));
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Session expired", {
            description: "Your session has expired. Please reconnect your wallet."
          });
        } else {
          toast.error("Error", {
            description: error.response.data?.message || "Failed to create tweet. Created locally instead."
          });
        }
      } else {
        toast.error("Network error", {
          description: "Could not connect to the server. Tweet saved locally."
        });
      }
      
      return mockTweet;
    }
  },
  
  getTweet: async (id: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/tweets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tweet ${id}:`, error);
      return null;
    }
  },
  
  deleteTweet: async (id: string) => {
    try {
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
