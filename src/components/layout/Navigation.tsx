
import { useState, useEffect, useRef } from 'react';
import { Home, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/profile' && location.pathname.startsWith('/profile/'));
  };
  
  // Simplified navigation items - only Home and Profile
  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'Profile', path: '/profile' },
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
      {/* Mobile bottom navigation - simplified */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t border-border md:hidden">
        <div className="flex justify-around w-full">
          {navigationItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-4",
                "transition-colors hover:text-primary",
                isActive(item.path) && "text-primary"
              )}
            >
              <item.icon 
                className={cn(
                  "h-6 w-6 mb-1",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop side navigation - simplified */}
      <nav 
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-16 bottom-0 hidden md:flex md:flex-col py-4 z-20 bg-background border-r border-border",
          isCollapsed ? "w-16" : "w-48",
          "transition-all duration-200 ease-in-out"
        )}
      >
        <div className="flex flex-col items-center w-full space-y-2">
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
        </div>
      </nav>
    </>
  );
};

export default Navigation;
