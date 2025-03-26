
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  className?: string;
}

const WalletConnect = ({ onConnect, className }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem('jwt_token'));
  const [walletAddress, setWalletAddress] = useState<string>(localStorage.getItem('wallet_address') || '');
  const navigate = useNavigate();
  
  const handleConnect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found", {
        description: "Please install MetaMask extension to connect your wallet",
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Get nonce from the server - now passing the wallet address
      const { nonce } = await authService.getNonce(address);
      
      // Create a signature using the nonce
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(`Sign this message to login: ${nonce}`);
      
      // Verify signature with the server and get JWT token
      const { token, user, isNewUser } = await authService.verifySignature(address, signature, nonce);
      
      // Save token to localStorage
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('wallet_address', address);
      
      setWalletAddress(address);
      setIsConnected(true);
      
      if (onConnect) {
        onConnect(address);
      }
      
      // Check if this is a new user who needs to complete profile setup
      if (isNewUser || !user.username) {
        toast.success("Wallet connected! Let's set up your profile", {
          description: "Complete your profile to get started",
        });
        
        // Redirect to profile setup
        navigate('/setup-profile');
      } else {
        toast.success("Wallet connected successfully", {
          description: `Connected to ${formatWalletAddress(address)}`,
        });
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Connection failed", {
        description: "Failed to connect wallet. Please try again.",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
      className={className}
      variant={isConnected ? "outline" : "default"}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : 
       isConnected ? formatWalletAddress(walletAddress) : "Connect Wallet"}
    </Button>
  );
};

export default WalletConnect;
