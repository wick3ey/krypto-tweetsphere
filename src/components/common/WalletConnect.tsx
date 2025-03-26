
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { useNavigate } from 'react-router-dom';
import { Connection, PublicKey } from '@solana/web3.js';

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
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem('jwt_token'));
  const [walletAddress, setWalletAddress] = useState<string>(localStorage.getItem('wallet_address') || '');
  const navigate = useNavigate();
  
  const handleConnect = async () => {
    if (!window.solana) {
      toast.error("Solana wallet not found", {
        description: "Please install a Solana wallet extension like Phantom to connect",
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Request wallet connection
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      console.log("Connected to wallet:", address);
      
      try {
        // Get nonce from the server - passing the wallet address
        const { nonce } = await authService.getNonce(address);
        console.log("Received nonce:", nonce);
        
        // Create a signature using the nonce
        const message = `Sign this message to login: ${nonce}`;
        const encodedMessage = new TextEncoder().encode(message);
        
        // Sign the message
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        console.log("Message signed successfully");
        
        // Verify signature with the server and get JWT token
        const { token, user, isNewUser } = await authService.verifySignature(address, signedMessage.signature, nonce);
        console.log("Signature verified successfully");
        
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
        console.error("Authentication error:", error);
        // Even if there's an authentication error, we already connected to the wallet
        // Don't show a connection failure message here
        toast.error("Authentication failed", {
          description: "Failed to authenticate with the server. Please try again.",
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
