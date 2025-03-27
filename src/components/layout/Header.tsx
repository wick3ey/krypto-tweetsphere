import { useState, useEffect } from 'react';
import { Bell, Menu, X, Moon, Sun, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { notificationService } from '@/api/notificationService';
import { authService } from '@/api/authService';
import { useQuery } from '@tanstack/react-query';
import { AuthDialog } from '@/components/auth/AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  // Fetch notification count if user is authenticated
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: () => notificationService.getUnreadCount().then(res => res.count),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching unread notification count:', error);
      }
    }
  });
  
  // Fetch user profile
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      // Navigation now handled by auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Det gick inte att logga ut. Försök igen.');
    }
  };
  
  const navigateToProfile = () => {
    navigate('/profile');
    // Close any open dropdown
    document.body.click();
  };
  
  const navigateToEditProfile = () => {
    navigate('/setup-profile');
    // Close any open dropdown
    document.body.click();
  };
  
  // Ensure avatar uses proper fallback for broken images
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || 'user'}`;
  };
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-background/80 backdrop-blur-sm shadow-sm" : "bg-transparent"
    )}>
      <div className="flex items-center justify-between h-16 px-4 md:container">
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-6">
            <span className="text-xl font-bold bg-gradient-to-r from-crypto-blue to-crypto-purple bg-clip-text text-transparent">
              F3ociety
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-crypto-blue text-[10px] text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 rounded-full relative overflow-hidden p-0 h-8 w-8">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage 
                        src={currentUser?.avatarUrl} 
                        alt={currentUser?.displayName || 'User'} 
                        onError={handleAvatarError}
                      />
                      <AvatarFallback>
                        {currentUser?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Min profil</DropdownMenuLabel>
                  <DropdownMenuItem onClick={navigateToProfile}>
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={navigateToEditProfile}>
                    Redigera profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Logga ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <AuthDialog />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
