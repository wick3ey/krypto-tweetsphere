
import { useState, useEffect, useRef } from 'react';
import { Home, User, Search, Trophy, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/hooks/useUser';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const { currentUser, isLoadingCurrentUser } = useUser();
  
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/profile' && location.pathname.startsWith('/profile/'));
  };
  
  // Navigationsobjekt
  const navigationItems = [
    { icon: Home, label: 'Hem', path: '/' },
    { icon: User, label: 'Profil', path: '/profile' },
    { icon: Search, label: 'Utforska', path: '/explore' },
    { icon: Trophy, label: 'Topplistor', path: '/leaderboard' },
  ];
  
  // Close sidebar when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);
  
  return (
    <>
      {/* Mobile bottom navigation - förbättrad med profilbild */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t border-border md:hidden">
        <div className="flex justify-around w-full">
          {navigationItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2",
                "transition-colors hover:text-primary",
                isActive(item.path) && "text-primary"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
          
          {/* Profilknapp i mobil navigering */}
          {currentUser && (
            <Button 
              variant="ghost" 
              className="flex flex-col items-center justify-center py-3 px-2"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-5 w-5 mb-1">
                <AvatarImage 
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`} 
                  alt={currentUser.displayName} 
                />
                <AvatarFallback className="text-xs">{currentUser.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs">Jag</span>
            </Button>
          )}
        </div>
      </nav>

      {/* Desktop side navigation - med förbättrad profilvisning */}
      <nav 
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-16 bottom-0 hidden md:flex md:flex-col py-4 z-20 bg-background border-r border-border",
          isCollapsed ? "w-16" : "w-48",
          "transition-all duration-200 ease-in-out"
        )}
      >
        <div className="flex flex-col items-center w-full space-y-2 px-2">
          {/* Profilknapp i desktop-läge */}
          {currentUser && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profile')}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md mb-4",
                "transition-colors hover:bg-muted",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`} 
                  alt={currentUser.displayName} 
                />
                <AvatarFallback>{currentUser.displayName?.[0]}</AvatarFallback>
              </Avatar>
              
              {!isCollapsed && (
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium truncate max-w-[120px]">{currentUser.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">@{currentUser.username}</p>
                </div>
              )}
            </Button>
          )}
          
          {/* Navigation */}
          {navigationItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center w-full px-4 py-3 rounded-md",
                "transition-colors hover:bg-muted",
                isCollapsed ? "justify-center" : "justify-start",
                isActive(item.path) && "bg-muted"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )} 
              />
              
              {!isCollapsed && (
                <span className={cn(
                  "ml-3 text-sm transition-opacity duration-200",
                  isActive(item.path) ? "font-medium" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
          
          {/* Inställningsknappen längst ner */}
          <div className="mt-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/settings')}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-md",
                "transition-colors hover:bg-muted",
                isCollapsed ? "justify-center" : "justify-start",
                isActive('/settings') && "bg-muted"
              )}
            >
              <Settings 
                className={cn(
                  "h-5 w-5",
                  isActive('/settings') ? "text-primary" : "text-muted-foreground"
                )} 
              />
              
              {!isCollapsed && (
                <span className={cn(
                  "ml-3 text-sm transition-opacity duration-200",
                  isActive('/settings') ? "font-medium" : "text-muted-foreground"
                )}>
                  Inställningar
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
