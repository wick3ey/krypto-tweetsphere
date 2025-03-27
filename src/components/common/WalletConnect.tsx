
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';

// Add TypeScript declaration for window.solana and window.phantom
declare global {
  interface Window {
    solana?: any;
    phantom?: {
      solana?: any;
    };
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
  const { currentUser, refetchCurrentUser } = useUser();
  
  // Helper function to convert Uint8Array to base64 string
  const arrayToBase64 = (buffer: Uint8Array): string => {
    // Improved base64 conversion method that's more compatible across browsers
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  
  // Get Phantom provider
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      
      if (provider?.isPhantom) {
        return provider;
      }
    }
    
    // Phantom is not installed, redirect to Phantom website
    window.open('https://phantom.app/', '_blank');
    return null;
  };
  
  // When component mounts, try to eagerly connect
  useEffect(() => {
    console.debug("WalletConnect component mounted");
    
    const tryEagerConnect = async () => {
      const provider = getProvider();
      if (!provider) return;
      
      try {
        // Try to eagerly connect if the user has already connected before
        const resp = await provider.connect({ onlyIfTrusted: true });
        const address = resp.publicKey.toString();
        console.info("Eagerly connected to wallet", { address });
        
        setWalletAddress(address);
        setIsConnected(true);
        
        // Check if token exists in localStorage
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
          // Verify with the server
          await verifyWalletConnection(provider, address);
        } else {
          // Just update localStorage with wallet address
          localStorage.setItem('wallet_address', address);
          
          // Refetch current user to make sure we have the latest data
          refetchCurrentUser();
          
          // Let the parent component know about the connection
          if (onConnect) {
            onConnect(address);
          }
        }
      } catch (error) {
        console.debug("No eager connection available", error);
        // This is expected if the wallet hasn't connected before
      }
    };
    
    // Setup account change handler
    const setupAccountChangeListener = () => {
      const provider = getProvider();
      if (!provider) return;
      
      provider.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          // User switched to a connected account
          const newAddress = publicKey.toString();
          console.info("Switched wallet account", { newAddress });
          
          setWalletAddress(newAddress);
          localStorage.setItem('wallet_address', newAddress);
          
          // Invalidate any cached user data
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          
          if (onConnect) {
            onConnect(newAddress);
          }
        } else {
          // User switched to an account that isn't connected to the app
          // Try to reconnect
          handleConnect();
        }
      });
      
      // Listen for disconnect events
      provider.on('disconnect', () => {
        console.info("Wallet disconnected");
        setIsConnected(false);
        setWalletAddress('');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('wallet_address');
        
        // Invalidate any cached user data
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      });
    };
    
    tryEagerConnect();
    setupAccountChangeListener();
    
    // Cleanup when component unmounts
    return () => {
      const provider = getProvider();
      if (provider) {
        provider.removeAllListeners('accountChanged');
        provider.removeAllListeners('disconnect');
      }
      console.debug("WalletConnect component unmounted");
    };
  }, []);
  
  const verifyWalletConnection = async (provider: any, address: string) => {
    try {
      // Get nonce and authentication message from the server
      console.debug("Requesting authentication nonce", { address });
      const authData = await authService.getNonce(address);
      
      if (!authData || !authData.nonce || !authData.message) {
        const errorMsg = "Failed to get valid authentication data from server";
        console.error(errorMsg, { authData });
        throw new Error(errorMsg);
      }
      
      const { message } = authData;
      console.debug("Received authentication message", { message });
      
      // Create a signature using the message from the server
      const encodedMessage = new TextEncoder().encode(message);
      
      // Sign the message with the explicit message format
      console.debug("Requesting user to sign message", { message });
      const signedMessage = await provider.signMessage(encodedMessage, "utf8");
      
      // Log the signature bytes for debugging
      console.debug("Signature bytes received", { 
        signatureBytes: signedMessage.signature,
        signatureLength: signedMessage.signature.length,
        signatureType: typeof signedMessage.signature
      });
      
      // Convert the signature buffer to a base64 string for sending to the server
      const signature = arrayToBase64(signedMessage.signature);
      
      console.info("Message signed successfully", { 
        signaturePreview: signature.substring(0, 20) + '...',
        signatureLength: signature.length
      });
      
      // Verify signature with the server and get JWT token
      console.debug("Verifying signature with server");
      const authResult = await authService.verifySignature(address, signature);
      console.info("Signature verified successfully", 
        { userId: authResult.user.id, isNewUser: authResult.isNewUser });
      
      // Invalidate any cached user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      if (onConnect) {
        onConnect(address);
      }
      
      // Check if this is a new user who needs to complete profile setup
      if (authResult.isNewUser) {
        console.info("New user detected, redirecting to profile setup", 
          { userId: authResult.user.id });
          
        toast.success("Wallet ansluten! Låt oss konfigurera din profil", {
          description: "Slutför din profil för att komma igång",
        });
        
        // Redirect to profile setup
        navigate('/setup-profile');
      } else {
        console.info("Existing user logged in successfully", 
          { userId: authResult.user.id, username: authResult.user.username });
          
        // Refetch current user to make sure we have the latest data
        refetchCurrentUser();
          
        toast.success("Wallet ansluten", {
          description: `Ansluten till ${formatWalletAddress(address)}`,
        });
      }
    } catch (error: any) {
      console.error("Authentication error", { error });
      toast.error("Authentication misslyckades", {
        description: error.message || "Kunde inte autentisera med servern. Försök igen.",
      });
      throw error;
    }
  };
  
  const handleConnect = async () => {
    const provider = getProvider();
    if (!provider) return;
    
    setIsConnecting(true);
    console.info("Initierar wallet-anslutning");
    
    try {
      // Request wallet connection
      console.debug("Requesting connection to wallet");
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      console.info("Connected to wallet", { address });
      
      setWalletAddress(address);
      setIsConnected(true);
      
      // Verify with the server to get a JWT token
      await verifyWalletConnection(provider, address);
    } catch (error: any) {
      console.error("Wallet connection error", { error });
      
      if (error.code === 4001) {
        // User rejected the connection
        toast.error("Anslutning avbruten", {
          description: "Du avbröt anslutningsbegäran.",
        });
      } else {
        toast.error("Anslutningen misslyckades", {
          description: error.message || "Kunde inte ansluta wallet. Försök igen.",
        });
      }
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
      {isConnecting ? "Ansluter..." : 
       isConnected ? formatWalletAddress(walletAddress) : "Anslut Wallet"}
    </Button>
  );
};

export default WalletConnect;
