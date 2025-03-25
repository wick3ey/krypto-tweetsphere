
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { currentUser } from '@/lib/mockData';
import { toast } from 'sonner';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  className?: string;
}

const WalletConnect = ({ onConnect, className }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnecting(false);
    setIsConnected(true);
    
    // Mock wallet connection
    if (onConnect) {
      onConnect(currentUser.walletAddress);
    }
    
    toast.success("Wallet connected successfully", {
      description: `Connected to ${formatWalletAddress(currentUser.walletAddress)}`,
    });
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting || isConnected}
      className={className}
      variant={isConnected ? "outline" : "default"}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : 
       isConnected ? formatWalletAddress(currentUser.walletAddress) : "Connect Wallet"}
    </Button>
  );
};

export default WalletConnect;
