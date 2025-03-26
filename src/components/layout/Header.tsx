
import { useState, useEffect } from 'react';
import { Bell, Menu, X, Moon, Sun, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletConnect from '@/components/common/WalletConnect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { notificationService } from '@/api/notificationService';
import { authService } from '@/api/authService';
import { useQuery } from '@tanstack/react-query';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isDark, setIsDark] = useState(true); // Since we implemented a dark theme by default
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  // Fetch notification count
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: () => notificationService.getUnreadCount().then(res => res.count),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch user profile
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "backdrop-blur-lg bg-background/80 border-b border-border/50 shadow-sm" 
        : "bg-transparent"
    )}>
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-crypto-blue to-crypto-purple animate-glow opacity-50"></div>
              <div className="relative z-10 h-full w-full rounded-full bg-card flex items-center justify-center border border-border">
                <span className="text-crypto-blue font-bold text-lg">K</span>
              </div>
            </div>
            <span className={cn(
              "font-bold text-xl md:text-2xl bg-gradient-to-r from-crypto-blue to-crypto-purple bg-clip-text text-transparent",
              "hover:from-crypto-blue hover:to-crypto-green transition-all duration-700"
            )}>
              KryptoSphere
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="rounded-full hidden md:flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            <span>New</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-crypto-red text-white"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
          
          <WalletConnect />
          
          <Link to="/profile">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full overflow-hidden border border-crypto-blue/30 group",
                "transition-all duration-300 hover:border-crypto-blue hover:shadow-glow-blue"
              )}
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <img
                  src={currentUser?.avatarUrl || "https://api.dicebear.com/7.x/identicon/svg?seed=user"}
                  alt="Profile"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(
        "fixed inset-0 top-16 bg-background/95 backdrop-blur-md z-40 transition-all duration-300 md:hidden border-t border-border/50",
        mobileMenu ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
      )}>
        <div className="flex flex-col p-4 space-y-4">
          <nav className="space-y-2">
            {[
              { text: 'Home', path: '/' },
              { text: 'Profile', path: '/profile' },
              { text: 'Explore', path: '/explore' },
              { text: 'Dashboard', path: '/dashboard' },
              { text: 'Messages', path: '/messages' },
              { text: 'Settings', path: '/settings' },
            ].map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className="block p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                {item.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
