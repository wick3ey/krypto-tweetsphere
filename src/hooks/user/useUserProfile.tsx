
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/userService';

export function useUserProfile() {
  const getUserProfile = (identifier: string, options = {}) => {
    return useQuery({
      queryKey: ['userProfile', identifier],
      queryFn: () => userService.getUserProfile(identifier, options),
      staleTime: 2 * 60 * 1000,
      ...options
    });
  };

  const getUserFollowers = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowers', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowers(userId, page, limit, sortBy),
    });
  };

  const getUserFollowing = (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
    return useQuery({
      queryKey: ['userFollowing', userId, page, limit, sortBy],
      queryFn: () => userService.getUserFollowing(userId, page, limit, sortBy),
    });
  };

  const getUserTweets = (userId: string, options = {}) => {
    return useQuery({
      queryKey: ['userTweets', userId, options],
      queryFn: () => userService.getUserTweets(userId, options),
    });
  };

  return {
    getUserProfile: (identifier: string, options = {}) => {
      return userService.getUserProfile(identifier, options);
    },
    getUserFollowers: (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
      return userService.getUserFollowers(userId, page, limit, sortBy);
    },
    getUserFollowing: (userId: string, page = 1, limit = 20, sortBy = 'recent') => {
      return userService.getUserFollowing(userId, page, limit, sortBy);
    },
    getUserTweets: (userId: string, options = {}) => {
      return userService.getUserTweets(userId, options);
    }
  };
}
