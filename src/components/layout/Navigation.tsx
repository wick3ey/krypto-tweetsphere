
import { useState, useEffect, useRef } from 'react';
import { Home, BarChart, Compass, Users, MessageSquare, BellRing, Settings, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Navigation = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: '/', notify: false },
    { icon: MessageSquare, label: 'Tweets', path: '/tweets', notify: 2 },
    { icon: Compass, label: 'Explore', path: '/explore', notify: false },
    { icon: Users, label: 'Network', path: '/network', notify: false },
    { icon: BarChart, label: 'Dashboard', path: '/dashboard', notify: false },
    { icon: BellRing, label: 'Notifications', path: '/notifications', notify: 5 },
    { icon: Settings, label: 'Settings', path: '/settings', notify: false },
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
  
  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-lg border-t border-border/50 md:hidden">
        <div className="flex justify-around w-full">
          {navigationItems.slice(0, 5).map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1",
                "transition-all duration-300 hover:text-crypto-blue",
                isActive(item.path) && "text-crypto-blue"
              )}
            >
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "rounded-full h-10 w-10",
                    isActive(item.path) && "bg-crypto-blue/10"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5",
                      isActive(item.path) ? "text-crypto-blue" : "text-muted-foreground"
                    )} 
                  />
                </Button>
                
                {item.notify && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-crypto-red text-white text-[10px]"
                  >
                    {item.notify}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop side navigation */}
      <nav 
        ref={sidebarRef}
        className={cn(
          "fixed left-4 top-20 bottom-4 hidden md:flex md:flex-col md:items-center md:justify-start md:py-4 z-20",
          "border border-border/50 rounded-2xl backdrop-blur-lg transition-all duration-300",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex flex-col items-center w-full space-y-1">
          <div className="px-2 py-3 w-full flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {navigationItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center w-full px-3 py-3",
                "transition-all duration-300 hover:text-crypto-blue",
                isCollapsed ? "justify-center" : "justify-start",
                isActive(item.path) && "text-crypto-blue"
              )}
            >
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "rounded-full h-10 w-10",
                    isActive(item.path) && "bg-crypto-blue/10",
                    isActive(item.path) && !isCollapsed && "bg-opacity-50"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5",
                      isActive(item.path) ? "text-crypto-blue" : "text-muted-foreground"
                    )} 
                  />
                </Button>
                
                {item.notify && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-crypto-red text-white text-[10px]"
                  >
                    {item.notify}
                  </Badge>
                )}
              </div>
              
              {!isCollapsed && (
                <span className={cn(
                  "ml-3 text-sm transition-opacity duration-300",
                  isActive(item.path) ? "font-medium" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
      
      {/* Mobile side menu overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Mobile side menu */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-background border-r border-border z-40 md:hidden transition-transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-xl">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-md",
                  isActive(item.path) 
                    ? "bg-crypto-blue/10 text-crypto-blue"
                    : "hover:bg-secondary/50"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.notify && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-crypto-red text-white text-[10px]"
                    >
                      {item.notify}
                    </Badge>
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile menu trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-30 md:hidden rounded-full bg-background/50 backdrop-blur-lg"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
};

export default Navigation;
