
import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletConnect from '@/components/common/WalletConnect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 backdrop-blur-lg bg-white/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-crypto-blue to-crypto-lightBlue bg-clip-text text-transparent">KryptoSphere</span>
          </Link>
          
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-[200px] lg:w-[300px] bg-secondary rounded-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-crypto-blue"></span>
          </Button>
          
          <WalletConnect />
          
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/identicon/svg?seed=satoshi"
                alt="Profile"
                className="h-8 w-8 object-cover"
              />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
