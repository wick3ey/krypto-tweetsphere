
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PhantomIcon } from '@/components/icons/PhantomIcon';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';

export const WalletConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refetchCurrentUser } = useUser();

  // Check if wallet is connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if we have a wallet address stored locally
      const storedWalletAddress = localStorage.getItem('wallet_address');
      const token = localStorage.getItem('jwt_token');
      
      if (storedWalletAddress && token) {
        setWalletAddress(storedWalletAddress);
      }
    };
    
    checkConnection();
  }, []);

  // Checks if Phantom is available
  const getProvider = () => {
    if (window.phantom?.solana) {
      return window.phantom.solana;
    } else if (window.solana) {
      return window.solana;
    }
    return null;
  };

  // Connect to wallet and authenticate with backend
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Check if Phantom is installed
      const provider = getProvider();
      
      if (!provider) {
        // Phantom wallet not found
        toast.error("Wallet not found", {
          description: "Please install Phantom wallet extension",
          action: {
            label: "Install",
            onClick: () => window.open("https://phantom.app/", "_blank"),
          },
        });
        return;
      }
      
      // Connect to Phantom wallet
      const connectResponse = await provider.connect();
      const newWalletAddress = connectResponse.publicKey.toString();
      
      // Store wallet address
      setWalletAddress(newWalletAddress);
      localStorage.setItem('wallet_address', newWalletAddress);
      
      // Get a nonce to sign from Supabase
      let { data: nonceData, error: nonceError } = await supabase.rpc('get_nonce', { 
        wallet_addr: newWalletAddress 
      });
      
      if (nonceError) {
        console.error("Error fetching nonce:", nonceError);
        
        // Create a new nonce if none exists
        const newNonce = crypto.randomUUID();
        const messageText = `Sign this message to verify your wallet ownership: ${newNonce}`;
        
        await supabase.rpc('create_nonce', { 
          wallet_addr: newWalletAddress,
          nonce_value: newNonce,
          message_text: messageText
        });
        
        nonceData = { nonce: newNonce, message: messageText };
      }
      
      const message = nonceData.message;
      
      // Sign the message with the wallet
      const encodedMessage = new TextEncoder().encode(message);
      const signResult = await provider.signMessage(encodedMessage, "utf8");
      const signature = Array.from(signResult.signature)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      // Verify the signature with the backend
      const authResponse = await fetch('https://dtrlmfwgtjrjkepvgatv.supabase.co/functions/v1/verify-wallet-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: newWalletAddress,
          signature,
          message
        })
      });
      
      const data = await authResponse.json();
      
      if (!authResponse.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Store JWT token
      localStorage.setItem('jwt_token', data.token);
      
      // Check if profile needs setup
      if (data.needsProfileSetup) {
        toast.success('Wallet connected', {
          description: 'Please set up your profile'
        });
        navigate('/setup-profile');
      } else {
        toast.success('Wallet connected', {
          description: 'Welcome back!'
        });
        
        // Store user data locally for faster access
        localStorage.setItem('current_user', JSON.stringify(data.user));
        
        // Refresh current user data
        refetchCurrentUser();
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again'
      });
      
      // Clean up on failure
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('jwt_token');
      setWalletAddress(null);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect wallet and clear auth state
  const handleDisconnect = async () => {
    try {
      const provider = getProvider();
      
      if (provider) {
        await provider.disconnect();
      }
      
      // Clear auth data
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('current_user');
      
      setWalletAddress(null);
      
      toast.success('Wallet disconnected');
      
      // Navigate to home page
      navigate('/');
    } catch (error: any) {
      console.error('Wallet disconnection error:', error);
      toast.error('Failed to disconnect wallet', { 
        description: error.message || 'Please try again'
      });
    }
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {walletAddress ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full"
          onClick={handleDisconnect}
        >
          <span className="font-mono text-xs mr-1">{formatWalletAddress(walletAddress)}</span>
          <LogOut className="h-4 w-4" />
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-purple hover:to-crypto-blue text-white"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-r-transparent"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <PhantomIcon className="h-4 w-4 mr-1" />
              <span>Connect</span>
            </div>
          )}
        </Button>
      )}
    </div>
  );
};
