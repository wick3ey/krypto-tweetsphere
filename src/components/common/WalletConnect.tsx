
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: any;
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  className?: string;
}

const WalletConnect = ({ onConnect, className }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Check token and wallet address on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem('wallet_address');
    const storedToken = localStorage.getItem('jwt_token');
    
    if (storedAddress && storedToken) {
      setWalletAddress(storedAddress);
      setIsConnected(true);
    }
  }, []);
  
  const handleConnect = async () => {
    if (!window.solana) {
      toast.error("Solana wallet not found", {
        description: "Please install a Solana wallet extension like Phantom to connect",
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // First, request wallet connection
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      console.log("Connected to wallet:", address);
      
      try {
        // Get nonce and authentication message from the server
        const { nonce, message } = await authService.getNonce(address);
        console.log("Received nonce:", nonce);
        console.log("Authentication message:", message);
        
        // Create a signature using the message from the server
        const encodedMessage = new TextEncoder().encode(message);
        
        // Sign the message
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        console.log("Message signed successfully");
        
        // Verify signature with the server and get JWT token
        const authResult = await authService.verifySignature(address, signedMessage.signature);
        console.log("Signature verified successfully");
        
        setWalletAddress(address);
        setIsConnected(true);
        
        // Invalidate any cached user data
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (onConnect) {
          onConnect(address);
        }
        
        // Check if this is a new user who needs to complete profile setup
        if (authResult.isNewUser || !authResult.user.username) {
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
      } catch (error: any) {
        console.error("Authentication error:", error);
        toast.error("Authentication failed", {
          description: error.message || "Failed to authenticate with the server. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast.error("Connection failed", {
        description: error.message || "Failed to connect wallet. Please try again.",
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
