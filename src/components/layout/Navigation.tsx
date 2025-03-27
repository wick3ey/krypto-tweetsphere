
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, User, Bell, Mail, Bookmark, Settings, LogOut, 
  Wallet, TrendingUp, Users, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';

const Navigation = () => {
  const location = useLocation();
  const { currentUser } = useUser();
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Du har loggats ut');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Kunde inte logga ut. Försök igen.');
    }
  };
  
  const navItems = [
    {
      title: 'Hem',
      icon: Home,
      path: '/',
      requiresAuth: false
    },
    {
      title: 'Utforska',
      icon: Sparkles,
      path: '/explore',
      requiresAuth: false
    },
    {
      title: 'Trender',
      icon: TrendingUp,
      path: '/trends',
      requiresAuth: false
    },
    {
      title: 'Community',
      icon: Users,
      path: '/community',
      requiresAuth: false
    },
    {
      title: 'Profil',
      icon: User,
      path: currentUser ? `/profile/${currentUser.username}` : '/profile',
      requiresAuth: true
    },
    {
      title: 'Notifikationer',
      icon: Bell,
      path: '/notifications',
      requiresAuth: true
    },
    {
      title: 'Meddelanden',
      icon: Mail,
      path: '/messages',
      requiresAuth: true
    },
    {
      title: 'Sparade',
      icon: Bookmark,
      path: '/bookmarks',
      requiresAuth: true
    },
    {
      title: 'Wallet',
      icon: Wallet,
      path: '/wallet',
      requiresAuth: true
    },
    {
      title: 'Inställningar',
      icon: Settings,
      path: '/settings',
      requiresAuth: true
    }
  ];
  
  return (
    <nav className="fixed left-0 bottom-0 w-full md:top-0 md:w-20 md:h-full p-2 border-t md:border-r md:border-t-0 border-border bg-background z-40">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:h-full">
        <div className="hidden md:block md:mb-8 w-10 h-10 bg-crypto-blue rounded-full flex items-center justify-center text-white text-lg font-bold mt-2">
          <Link to="/" className="flex items-center justify-center w-full h-full">
            F3
          </Link>
        </div>
        
        <div className="flex md:flex-col items-center justify-between md:space-y-1 w-full md:w-auto">
          {navItems
            .filter(item => !item.requiresAuth || (item.requiresAuth && isAuthenticated))
            .slice(0, 5)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full",
                  "hover:bg-muted transition-colors",
                  location.pathname === item.path && "bg-muted text-crypto-blue"
                )}
                title={item.title}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
        </div>
        
        {isAuthenticated && (
          <div className="hidden md:flex md:flex-col md:mt-auto md:mb-4 md:space-y-1">
            {navItems
              .filter(item => item.requiresAuth)
              .slice(5)
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full",
                    "hover:bg-muted transition-colors",
                    location.pathname === item.path && "bg-muted text-crypto-blue"
                  )}
                  title={item.title}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
              ))}
              
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
              title="Logga ut"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
