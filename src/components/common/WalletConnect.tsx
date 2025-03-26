
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logService } from '@/api/logService';

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
  
  // When component mounts
  useEffect(() => {
    logService.debug("WalletConnect component mounted", {}, "WalletConnect");
    
    // Send diagnostic report on startup
    logService.sendDiagnosticReport();
    
    // Check if user is already logged in
    const checkStoredCredentials = () => {
      const storedAddress = localStorage.getItem('wallet_address');
      const storedToken = localStorage.getItem('jwt_token');
      
      if (storedAddress && storedToken) {
        setWalletAddress(storedAddress);
        setIsConnected(true);
        logService.info("User already connected with stored credentials", 
          { walletAddress: storedAddress }, "WalletConnect");
      }
    };
    
    checkStoredCredentials();
    
    // Cleanup when component unmounts
    return () => {
      logService.debug("WalletConnect component unmounted", {}, "WalletConnect");
    };
  }, []);
  
  const handleConnect = async () => {
    if (!window.solana) {
      const errorMsg = "Solana wallet not found";
      logService.warn(errorMsg, { userAgent: navigator.userAgent }, "WalletConnect");
      
      toast.error(errorMsg, {
        description: "Please install a Solana wallet extension like Phantom to connect",
      });
      return;
    }
    
    setIsConnecting(true);
    logService.info("Initiating wallet connection", {}, "WalletConnect");
    
    try {
      // First, request wallet connection
      logService.debug("Requesting connection to wallet", {}, "WalletConnect");
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      logService.info("Connected to wallet", { address }, "WalletConnect");
      
      try {
        // Get nonce and authentication message from the server
        logService.debug("Requesting authentication nonce", { address }, "WalletConnect");
        const authData = await authService.getNonce(address);
        
        if (!authData || !authData.nonce || !authData.message) {
          const errorMsg = "Failed to get valid authentication data from server";
          logService.error(errorMsg, { authData }, "WalletConnect");
          throw new Error(errorMsg);
        }
        
        const { message } = authData;
        logService.debug("Received authentication message", { message }, "WalletConnect");
        
        // Create a signature using the message from the server
        const encodedMessage = new TextEncoder().encode(message);
        
        // Sign the message
        logService.debug("Requesting user to sign message", { message }, "WalletConnect");
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        logService.info("Message signed successfully", { signature: !!signedMessage }, "WalletConnect");
        
        // Verify signature with the server and get JWT token
        logService.debug("Verifying signature with server", {}, "WalletConnect");
        const authResult = await authService.verifySignature(address, signedMessage.signature);
        logService.info("Signature verified successfully", 
          { userId: authResult.user.id, isNewUser: authResult.isNewUser }, "WalletConnect");
        
        setWalletAddress(address);
        setIsConnected(true);
        
        // Invalidate any cached user data
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        if (onConnect) {
          onConnect(address);
        }
        
        // Check if this is a new user who needs to complete profile setup
        if (authResult.isNewUser) {
          logService.info("New user detected, redirecting to profile setup", 
            { userId: authResult.user.id }, "WalletConnect");
            
          toast.success("Wallet connected! Let's set up your profile", {
            description: "Complete your profile to get started",
          });
          
          // Redirect to profile setup
          navigate('/setup-profile');
        } else {
          logService.info("Existing user logged in successfully", 
            { userId: authResult.user.id, username: authResult.user.username }, "WalletConnect");
            
          toast.success("Wallet connected successfully", {
            description: `Connected to ${formatWalletAddress(address)}`,
          });
        }
      } catch (error: any) {
        logService.error("Authentication error", { error, address }, "WalletConnect");
        toast.error("Authentication failed", {
          description: error.message || "Failed to authenticate with the server. Please try again.",
        });
      }
    } catch (error: any) {
      logService.error("Wallet connection error", { error }, "WalletConnect");
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
