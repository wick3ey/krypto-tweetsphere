
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import AnimatedCard from '@/components/common/AnimatedCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, PlusCircle, Send, Paperclip, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for messages
const mockConversations = [
  {
    id: 1,
    user: {
      id: 'user-1',
      name: 'Vitalik Buterin',
      username: 'vitalikbuterin',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vitalik',
      verified: true,
    },
    lastMessage: 'Have you checked the latest Ethereum update?',
    timestamp: '2023-04-15T10:30:00',
    unread: 2,
  },
  {
    id: 2,
    user: {
      id: 'user-2',
      name: 'CZ Binance',
      username: 'cz_binance',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=binance',
      verified: true,
    },
    lastMessage: 'The market is looking good today!',
    timestamp: '2023-04-14T15:45:00',
    unread: 0,
  },
  {
    id: 3,
    user: {
      id: 'user-3',
      name: 'Charles Hoskinson',
      username: 'IOHK_Charles',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=charles',
      verified: true,
    },
    lastMessage: 'Let me know your thoughts on the Cardano ecosystem.',
    timestamp: '2023-04-12T09:20:00',
    unread: 0,
  },
  {
    id: 4,
    user: {
      id: 'user-4',
      name: 'SBF',
      username: 'SBF_FTX',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=sbf',
      verified: false,
    },
    lastMessage: "Can I borrow some funds for a bit? Promise I'll return them.",
    timestamp: '2023-04-10T22:15:00',
    unread: 0,
  },
  {
    id: 5,
    user: {
      id: 'user-5',
      name: 'Do Kwon',
      username: 'dokwon',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dokwon',
      verified: false,
    },
    lastMessage: 'Trust me, this new token is absolutely stable.',
    timestamp: '2023-04-08T11:05:00',
    unread: 0,
  },
];

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If it's today, show the time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If it's within a week, show the day
  const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  
  // Otherwise, show the date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredConversations = searchQuery 
    ? mockConversations.filter(conv => 
        conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockConversations;
  
  return (
    <div className="min-h-screen bg-background md:pl-20">
      <Header />
      <Navigation />
      
      <main className="container max-w-7xl pt-20 px-4 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] gap-4">
          {/* Conversations List */}
          <div className={cn(
            "w-full md:w-1/3 lg:w-1/4 border border-border/50 rounded-xl overflow-hidden",
            selectedConversation && "hidden md:block"
          )}>
            <div className="p-3 border-b border-border/50 bg-card/50">
              <h2 className="text-xl font-bold flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Messages
              </h2>
              
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages" 
                  className="pl-9 crypto-input rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-70px)]">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className={cn(
                    "flex items-start p-3 hover:bg-secondary/50 cursor-pointer transition-colors",
                    selectedConversation === conversation.id && "bg-secondary/50",
                    conversation.unread > 0 && "bg-crypto-blue/5"
                  )}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                    <img 
                      src={conversation.user.avatar} 
                      alt={conversation.user.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold truncate">
                        {conversation.user.name}
                        {conversation.user.verified && (
                          <span className="ml-1 text-crypto-blue">✓</span>
                        )}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    
                    {conversation.unread > 0 && (
                      <div className="mt-1 flex justify-end">
                        <span className="bg-crypto-blue text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                          {conversation.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations found
                </div>
              )}
            </div>
          </div>
          
          {/* Message Conversation */}
          <div className={cn(
            "flex-1 border border-border/50 rounded-xl overflow-hidden flex flex-col",
            !selectedConversation && "hidden md:flex md:items-center md:justify-center"
          )}>
            {selectedConversation ? (
              <>
                <div className="p-3 border-b border-border/50 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="mr-2 md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                        <img 
                          src={mockConversations.find(c => c.id === selectedConversation)?.user.avatar} 
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">
                          {mockConversations.find(c => c.id === selectedConversation)?.user.name}
                          {mockConversations.find(c => c.id === selectedConversation)?.user.verified && (
                            <span className="ml-1 text-crypto-blue">✓</span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          @{mockConversations.find(c => c.id === selectedConversation)?.user.username}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-secondary/20">
                  <div className="flex justify-center mb-6">
                    <div className="bg-card px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {new Date(mockConversations.find(c => c.id === selectedConversation)?.timestamp || '').toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-end">
                      <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                        <img 
                          src={mockConversations.find(c => c.id === selectedConversation)?.user.avatar}
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="bg-card rounded-lg rounded-bl-none p-3 max-w-[80%]">
                        <p className="text-sm">
                          {mockConversations.find(c => c.id === selectedConversation)?.lastMessage}
                        </p>
                        <p className="text-right text-xs text-muted-foreground mt-1">
                          {formatTimestamp(mockConversations.find(c => c.id === selectedConversation)?.timestamp || '')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-end">
                      <div className="bg-crypto-blue text-white rounded-lg rounded-br-none p-3 max-w-[80%]">
                        <p className="text-sm">
                          Thanks for reaching out! I'll look into it and get back to you soon.
                        </p>
                        <p className="text-right text-xs text-white/70 mt-1">
                          {formatTimestamp(new Date().toISOString())}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full overflow-hidden ml-2">
                        <img 
                          src="https://api.dicebear.com/7.x/identicon/svg?seed=satoshi"
                          alt="You"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border-t border-border/50 bg-card/50">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Image className="h-5 w-5" />
                    </Button>
                    <Input 
                      placeholder="Type a message" 
                      className="crypto-input rounded-full flex-1"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
                          e.preventDefault();
                          // TODO: Send message
                          setMessageText('');
                        }
                      }}
                    />
                    <Button 
                      variant={messageText.trim() ? "default" : "ghost"} 
                      size="icon" 
                      className="rounded-full"
                      disabled={!messageText.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-10 text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">Your Messages</h2>
                <p className="text-muted-foreground mb-6">
                  Select a conversation or start a new one
                </p>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
