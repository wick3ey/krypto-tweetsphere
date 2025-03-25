
import { Home, BarChart, Compass, Users, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageSquare, label: 'Tweets', path: '/tweets' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Users, label: 'Network', path: '/network' },
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-lg border-t border-border md:left-4 md:top-20 md:w-16 md:bottom-4 md:border md:rounded-full md:flex md:flex-col md:items-center md:justify-start md:py-4">
      <div className="flex justify-around w-full md:flex-col md:space-y-4">
        {navigationItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 md:px-0",
              "transition-all duration-300 hover:text-crypto-blue"
            )}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "rounded-full",
                isActive(item.path) && "bg-crypto-blue/10 text-crypto-blue"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5",
                  isActive(item.path) ? "text-crypto-blue" : "text-muted-foreground"
                )} 
              />
            </Button>
            <span className="text-xs mt-1 md:text-[0px]">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
