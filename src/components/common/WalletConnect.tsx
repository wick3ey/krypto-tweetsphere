
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Add TypeScript declaration for window.solana and window.phantom
declare global {
  interface Window {
    solana?: any;
    phantom?: {
      solana?: any;
    };
    ethereum?: {
      providers?: any[];
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
  
  // Get Phantom provider using the recommended method
  const getProvider = () => {
    // Check if phantom is in window using the recommended approach
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      
      if (provider?.isPhantom) {
        console.log("Detected Phantom wallet via window.phantom.solana");
        return provider;
      }
    }
    
    // Fallback to legacy detection via window.solana
    if ('solana' in window && window.solana?.isPhantom) {
      console.log("Detected Phantom wallet via window.solana");
      return window.solana;
    }
    
    // Check if Phantom is present in the injected providers
    // This is a more thorough check
    if (typeof window !== 'undefined') {
      const providers = window.ethereum?.providers;
      if (providers) {
        const phantomProvider = providers.find((p: any) => p.isPhantom);
        if (phantomProvider) {
          console.log("Detected Phantom wallet via ethereum providers");
          return phantomProvider;
        }
      }
    }
    
    console.log("No Phantom wallet detected, redirecting to install page");
    // Phantom is not installed, redirect to Phantom website
    window.open('https://phantom.app/', '_blank');
    toast.error("Phantom plånbok saknas", {
      description: "Du behöver installera Phantom plånbok för att fortsätta.",
    });
    return null;
  };

  // The component will NOT eagerly connect on mount anymore
  // This is to ensure users have to explicitly connect their wallet each time
  useEffect(() => {
    console.debug("WalletConnect component mounted, automatic connection disabled");
    
    // Clear any existing auth data on component mount
    authService.clearAuthData();
    
    // Setup account change handler
    const setupAccountChangeListener = () => {
      const provider = getProvider();
      if (!provider) return;
      
      provider.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          // User switched to a connected account
          const newAddress = publicKey.toString();
          console.info("Switched wallet account", { newAddress });
          
          // This will require re-authentication
          setIsConnected(false);
          setWalletAddress('');
          authService.clearAuthData();
          
          // Invalidate any cached user data
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          
          // Prompt user to reconnect with the new account
          toast.info("Plånbok ändrad", {
            description: "Du behöver ansluta igen med ditt nya konto.",
          });
          
          // Trigger connection with the new account
          handleConnect();
        } else {
          // User switched to an account that isn't connected to the app
          setIsConnected(false);
          setWalletAddress('');
          authService.clearAuthData();
        }
      });
      
      // Listen for disconnect events
      provider.on('disconnect', () => {
        console.info("Wallet disconnected");
        setIsConnected(false);
        setWalletAddress('');
        authService.clearAuthData();
        
        // Invalidate any cached user data
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      });
    };
    
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
  }, [queryClient]);
  
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
      const authResult = await authService.verifySignature(address, signature, message);
      console.info("Signature verified successfully", 
        { userId: authResult.user.id, needsProfileSetup: authResult.needsProfileSetup });
      
      // Invalidate any cached user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      if (onConnect) {
        onConnect(address);
      }
      
      // Check if this is a new user who needs to complete profile setup
      if (authResult.needsProfileSetup) {
        console.info("Profile setup needed, redirecting to profile setup", 
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
    console.log("Initiating wallet connection...");
    const provider = getProvider();
    if (!provider) {
      console.log("No provider found, cannot connect");
      toast.error("Phantom plånbok kunde inte hittas", {
        description: "Installera Phantom plånboken och ladda om sidan.",
      });
      return;
    }
    
    setIsConnecting(true);
    console.info("Initiating wallet connection");
    
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
      setIsConnected(false);
      setWalletAddress('');
      
      // Check for specific error codes
      if (error.code === 4001) {
        // User rejected the connection
        toast.info("Anslutning avbruten", {
          description: "Du avbröt anslutningsbegäran.",
        });
      } else if (error.message?.includes("rejected")) {
        // Alternative way to detect user rejections
        toast.info("Anslutning avbruten", {
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
  
  const handleDisconnect = async () => {
    try {
      const provider = getProvider();
      if (provider) {
        // Disconnect from Phantom
        await provider.disconnect();
      }
      
      // Logout from Supabase
      await authService.logout();
      
      // Reset state
      setIsConnected(false);
      setWalletAddress('');
      
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      toast.success("Wallet bortkopplad", {
        description: "Du har loggat ut från din plånbok.",
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Utloggning misslyckades", {
        description: "Kunde inte koppla bort plånboken. Försök igen.",
      });
    }
  };
  
  const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Show different UI based on connection state
  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={className}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {formatWalletAddress(walletAddress)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Wallet</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              toast.success("Kopierat", {
                description: "Plånboksadressen kopierad till urklipp",
              });
            }}
          >
            Kopiera adress
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
      className={className}
      variant="default"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? "Ansluter..." : "Anslut Wallet"}
    </Button>
  );
};

export default WalletConnect;
