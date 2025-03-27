
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/api/tweetService';
import { toast } from 'sonner';
import { Tweet } from '@/lib/types';

export function useTweets() {
  const queryClient = useQueryClient();

  const createTweetMutation = useMutation({
    mutationFn: (tweetData: { content: string; attachments?: string[] }) => 
      tweetService.createTweet(tweetData.content, tweetData.attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      toast.success('Inlägg publicerat');
    },
    onError: (error: any) => {
      toast.error('Kunde inte publicera inlägg', { 
        description: error.message || 'Försök igen senare' 
      });
    }
  });

  const deleteTweetMutation = useMutation({
    mutationFn: (tweetId: string) => tweetService.deleteTweet(tweetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      toast.success('Inlägg borttaget');
    },
    onError: (error: any) => {
      toast.error('Kunde inte ta bort inlägg', { 
        description: error.message || 'Försök igen senare' 
      });
    }
  });

  const likeTweetMutation = useMutation({
    mutationFn: (tweetId: string) => tweetService.likeTweet(tweetId),
    onSuccess: (_, tweetId) => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['tweet', tweetId] });
    },
    onError: (error: any) => {
      toast.error('Kunde inte gilla inlägg', { 
        description: error.message || 'Försök igen senare' 
      });
    }
  });

  const unlikeTweetMutation = useMutation({
    mutationFn: (tweetId: string) => tweetService.unlikeTweet(tweetId),
    onSuccess: (_, tweetId) => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['tweet', tweetId] });
    },
    onError: (error: any) => {
      toast.error('Kunde inte ogilla inlägg', { 
        description: error.message || 'Försök igen senare' 
      });
    }
  });

  const getUserTweets = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userTweets', userId],
      queryFn: () => tweetService.getUserTweets(userId, options),
      staleTime: 2 * 60 * 1000,
    });
  };

  const getTweetById = (tweetId: string) => {
    return useQuery({
      queryKey: ['tweet', tweetId],
      queryFn: () => tweetService.getTweetById(tweetId),
      staleTime: 2 * 60 * 1000,
      enabled: !!tweetId,
    });
  };

  return {
    createTweet: createTweetMutation.mutate,
    isCreatingTweet: createTweetMutation.isPending,
    deleteTweet: deleteTweetMutation.mutate,
    isDeletingTweet: deleteTweetMutation.isPending,
    likeTweet: likeTweetMutation.mutate,
    isLikingTweet: likeTweetMutation.isPending,
    unlikeTweet: unlikeTweetMutation.mutate,
    isUnlikingTweet: unlikeTweetMutation.isPending,
    getTweetById: (tweetId: string) => tweetService.getTweetById(tweetId),
    getUserTweets: (userId: string, options = {}) => tweetService.getUserTweets(userId, options),
  };
}
