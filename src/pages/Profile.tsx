
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import TweetCard from '@/components/feed/TweetCard';
import ProfileCard from '@/components/profile/ProfileCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { mockTweets, suggestedUsers } from '@/lib/mockData';

const Profile = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState("tweets");
  
  // Find the user data based on the username parameter
  const userData = suggestedUsers.find(user => user.username === username) || suggestedUsers[0];
  
  // Filter tweets for this user
  const userTweets = mockTweets.filter(tweet => tweet.user.username === userData.username);
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container max-w-4xl pt-20 px-4">
        <ProfileCard user={userData} />
        
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="tweets" className="flex-1">Tweets</TabsTrigger>
              <TabsTrigger value="replies" className="flex-1">Replies</TabsTrigger>
              <TabsTrigger value="assets" className="flex-1">Assets</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tweets" className="mt-6">
              <div className="space-y-4">
                {userTweets.length > 0 ? (
                  userTweets.map((tweet, index) => (
                    <TweetCard
                      key={tweet.id}
                      tweet={tweet}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No tweets yet
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="replies" className="mt-6">
              <div className="text-center py-10 text-muted-foreground">
                No replies yet
              </div>
            </TabsContent>
            
            <TabsContent value="assets" className="mt-6">
              <div className="text-center py-10 text-muted-foreground">
                Asset information coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              <div className="text-center py-10 text-muted-foreground">
                Transaction history coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
