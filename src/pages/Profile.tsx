import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MessageCircle, Shield, ArrowLeft, MoreHorizontal, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Tweet } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { useTweets } from '@/hooks/useTweets';
import EnhancedTweetCard from '@/components/feed/EnhancedTweetCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FollowButton from '@/components/profile/FollowButton';
import ProfileCard from '@/components/profile/ProfileCard';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { getUserProfile, currentUser } = useUser();
  const { getUserTweets } = useTweets();
  const [profile, setProfile] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tweets');
  
  // Check if the logged-in user follows this profile
  const isCurrentUser = currentUser?.id === profile?.id;
  // Fix: Safely check if following includes the profile.id regardless of type
  const isFollowing = profile && Array.isArray(currentUser?.following) 
    ? currentUser?.following.includes(profile.id) 
    : false;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        if (!username) return;
        
        const fetchedProfile = await getUserProfile(username);
        setProfile(fetchedProfile);
        
        // Fetch tweets for this profile
        const fetchedTweets = await getUserTweets(fetchedProfile.id);
        setTweets(fetchedTweets);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Could not load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [username, getUserProfile, getUserTweets]);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Profile</h1>
        </div>
        
        <div className="space-y-4">
          <div className="h-32 bg-gradient-to-r from-crypto-blue/30 to-crypto-lightBlue/30 rounded-t-lg"></div>
          <div className="px-6 pb-6">
            <div className="flex justify-between items-start mt-[-40px]">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="mt-10 flex space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
            <div className="mt-3">
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <div className="flex space-x-5 mt-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container max-w-5xl mx-auto py-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Profile Not Found</h1>
        </div>
        
        <div className="bg-background border border-border rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">{profile.displayName}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileCard profile={profile} />
          
          <Tabs defaultValue="tweets" className="mt-4" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background border border-border rounded-lg">
              <TabsTrigger value="tweets" className="flex-1">Tweets</TabsTrigger>
              <TabsTrigger value="replies" className="flex-1">Replies</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
              <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tweets" className="mt-4 space-y-4">
              {tweets.length > 0 ? (
                tweets.map(tweet => (
                  <EnhancedTweetCard key={tweet.id} tweet={tweet} />
                ))
              ) : (
                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">No tweets yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="replies" className="mt-4">
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No replies yet</p>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="mt-4">
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No media yet</p>
              </div>
            </TabsContent>
            
            <TabsContent value="likes" className="mt-4">
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No likes yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-4">
          <div className="bg-background border border-border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Username:</span> @{profile?.username}</p>
              <p><span className="font-medium">Display Name:</span> {profile?.displayName}</p>
              <p><span className="font-medium">Bio:</span> {profile?.bio || 'No bio provided'}</p>
              <p><span className="font-medium">Joined:</span> {formatDate(profile?.joinedDate || '')}</p>
            </div>
          </div>
          
          {!isCurrentUser && (
            <div className="bg-background border border-border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">Connect with {profile.displayName}</h2>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
                <FollowButton 
                  userId={profile.id} 
                  initialFollowing={isFollowing} 
                  className="w-full justify-start"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
