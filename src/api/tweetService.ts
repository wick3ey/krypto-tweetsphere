
import apiClient from './apiClient';
import { toast } from "sonner";

export const tweetService = {
  getFeed: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/feed');
      return Array.isArray(response.data) ? response.data : 
             (response.data.data ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      return [];
    }
  },
  
  getExploreFeed: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/tweets/explore');
      return Array.isArray(response.data) ? response.data : 
             (response.data.data ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching explore feed:', error);
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
      const response = await apiClient.post('https://f3oci3ty.xyz/api/tweets', { content, attachments });
      console.log('Tweet created successfully:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Session expired", {
            description: "Your session has expired. Please reconnect your wallet."
          });
        } else {
          toast.error("Error", {
            description: error.response.data?.message || "Failed to create tweet. Please try again."
          });
        }
      } else {
        toast.error("Network error", {
          description: "Could not connect to the server. Please check your connection."
        });
      }
      
      throw error;
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
