import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PhantomIcon } from '@/components/icons/PhantomIcon';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { dbUserToUser } from '@/lib/db-types';

interface WalletConnectProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const WalletConnect = ({
  className = '',
  variant = 'default',
  size = 'default',
  fullWidth = false,
}: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPhantomWallet, setHasPhantomWallet] = useState(false);
  const navigate = useNavigate();
  const { refetchCurrentUser } = useUser();

  useEffect(() => {
    const checkForPhantom = async () => {
      try {
        const isPhantomInstalled = window.phantom?.solana || window.solana?.isPhantom;
        setHasPhantomWallet(!!isPhantomInstalled);
        
        if (isPhantomInstalled) {
          console.log('Detected Phantom wallet via window.phantom.solana');
        }
      } catch (error) {
        console.error('Error checking for Phantom wallet:', error);
        setHasPhantomWallet(false);
      }
    };

    checkForPhantom();
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log('Initiating wallet connection...');
      
      const provider = window.phantom?.solana || window.solana;
      
      if (!provider) {
        toast.error('Phantom wallet not installed', {
          description: 'Please install Phantom wallet extension',
        });
        return;
      }
      
      console.log('Detected Phantom wallet via window.phantom.solana');
      console.log('Initiating wallet connection');
      
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();
      
      console.log('Connected to wallet', response);
      
      localStorage.setItem('wallet_address', publicKey);
      
      if (authService.isLoggedIn()) {
        try {
          await refetchCurrentUser();
          
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser.username.startsWith('user_') || 
              !currentUser.displayName || 
              currentUser.displayName === 'New User') {
            navigate('/setup-profile');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          
          await authenticateWithWallet(publicKey);
        }
      } else {
        await authenticateWithWallet(publicKey);
      }
    } catch (error) {
      console.log('Wallet connection error', error);
      toast.error('Could not connect to wallet', { 
        description: error.message || 'Please try again'
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const authenticateWithWallet = async (walletAddress: string) => {
    try {
      console.log('Requesting nonce for wallet', walletAddress);
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .maybeSingle();
        
        if (error) throw error;
        
        let userExists = !!data;
        let needsSetup = false;
        
        if (userExists) {
          needsSetup = !data.username || 
                     data.username.startsWith('user_') || 
                     !data.display_name || 
                     data.display_name === 'New User';
        }
        
        const { nonce, message } = await authService.getNonce(walletAddress);
        
        const provider = window.phantom?.solana || window.solana;
        
        const { signature } = await provider.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        
        const signatureBase64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(signature))
        );
        
        const { user, isNewUser, needsProfileSetup } = await authService.verifySignature(
          walletAddress, 
          signatureBase64, 
          message
        );
        
        if (isNewUser || needsProfileSetup || needsSetup) {
          const userObj = userExists ? dbUserToUser(data) : user;
          
          localStorage.setItem('current_user', JSON.stringify(userObj));
          
          toast.success('Login successful', {
            description: 'Please set up your profile'
          });
          
          navigate('/setup-profile');
        } else {
          toast.success('Login successful', {
            description: 'Welcome back!'
          });
          
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user in database:', error);
        
        const { nonce, message } = await authService.getNonce(walletAddress);
        
        const provider = window.phantom?.solana || window.solana;
        
        const { signature } = await provider.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        
        const signatureBase64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(signature))
        );
        
        const { user, isNewUser, needsProfileSetup } = await authService.verifySignature(
          walletAddress, 
          signatureBase64, 
          message
        );
        
        if (isNewUser || needsProfileSetup) {
          toast.success('Login successful', {
            description: 'Please set up your profile'
          });
          
          navigate('/setup-profile');
        } else {
          toast.success('Login successful', {
            description: 'Welcome back!'
          });
          
          navigate('/');
        }
      }
    } catch (error) {
      console.log('Authentication error', error);
      toast.error('Authentication failed', { 
        description: error.message || 'Please try again'
      });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${fullWidth ? 'w-full' : ''}`}
      onClick={connectWallet}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      <PhantomIcon className="ml-2 h-4 w-4" />
    </Button>
  );
};
