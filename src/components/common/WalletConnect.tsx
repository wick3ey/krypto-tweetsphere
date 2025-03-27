
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PhantomIcon } from '@/components/icons/PhantomIcon';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client'; // Lägg till denna import
import { dbUserToUser } from '@/lib/db-types'; // Lägg till denna import

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

  // Kontrollera om Phantom-plånboken finns tillgänglig
  useEffect(() => {
    const checkForPhantom = async () => {
      try {
        // @ts-ignore - Phantom är inte i typescript definitionerna
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

  // Funktion för att ansluta till plånboken
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log('Initiating wallet connection...');
      
      // @ts-ignore - Phantom är inte i typescript definitionerna
      const provider = window.phantom?.solana || window.solana;
      
      if (!provider) {
        toast.error('Phantom wallet not installed', {
          description: 'Please install Phantom wallet extension',
        });
        return;
      }
      
      console.log('Detected Phantom wallet via window.phantom.solana');
      console.log('Initiating wallet connection');
      
      // Anslut till plånboken
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();
      
      console.log('Connected to wallet', response);
      
      // Spara plånboksadressen i localStorage
      localStorage.setItem('wallet_address', publicKey);
      
      // Kontrollera om användaren redan är inloggad
      if (authService.isLoggedIn()) {
        try {
          // Om inloggad, uppdatera bara användardata
          await refetchCurrentUser();
          
          // Kontrollera om profilen behöver konfigureras
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
          
          // Om vi inte kan uppdatera användardata, försök logga in igen
          await authenticateWithWallet(publicKey);
        }
      } else {
        // Om inte inloggad, autentisera med plånboken
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
  
  // Autentisera användaren med plånboksadress
  const authenticateWithWallet = async (walletAddress: string) => {
    try {
      console.log('Requesting nonce for wallet', walletAddress);
      
      // Kontrollera först om användaren redan finns i databasen
      try {
        // Kontrollera om användaren finns i databasen
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .maybeSingle();
        
        if (error) throw error;
        
        let userExists = !!data;
        let needsSetup = false;
        
        if (userExists) {
          // Användaren finns, kontrollera om de behöver profiluppsättning
          needsSetup = !data.username || 
                     data.username.startsWith('user_') || 
                     !data.display_name || 
                     data.display_name === 'New User';
        }
        
        // Hämta nonce för signering
        const { nonce, message } = await authService.getNonce(walletAddress);
        
        // @ts-ignore - Phantom är inte i typescript definitionerna
        const provider = window.phantom?.solana || window.solana;
        
        // Signera meddelandet
        const { signature } = await provider.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        
        // Konvertera signaturen till base64
        const signatureBase64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(signature))
        );
        
        // Verifiera signaturen och autentisera användaren
        const { user, isNewUser, needsProfileSetup } = await authService.verifySignature(
          walletAddress, 
          signatureBase64, 
          message
        );
        
        if (isNewUser || needsProfileSetup || needsSetup) {
          // Användaren är ny eller behöver konfigurera sin profil
          const userObj = userExists ? dbUserToUser(data) : user;
          
          // Cachelagra användarobjektet
          localStorage.setItem('current_user', JSON.stringify(userObj));
          
          toast.success('Login successful', {
            description: 'Please set up your profile'
          });
          
          navigate('/setup-profile');
        } else {
          // Användaren är inloggad och har en konfigurerad profil
          toast.success('Login successful', {
            description: 'Welcome back!'
          });
          
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user in database:', error);
        
        // Fallback: Försök med standard autentiseringsflöde
        const { nonce, message } = await authService.getNonce(walletAddress);
        
        // @ts-ignore - Phantom är inte i typescript definitionerna
        const provider = window.phantom?.solana || window.solana;
        
        // Signera meddelandet
        const { signature } = await provider.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        
        // Konvertera signaturen till base64
        const signatureBase64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(signature))
        );
        
        // Verifiera signaturen och autentisera användaren
        const { user, isNewUser, needsProfileSetup } = await authService.verifySignature(
          walletAddress, 
          signatureBase64, 
          message
        );
        
        // Användarens tillstånd
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
  
  // Oavsett om användaren har Phantom eller inte, visa knappen
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
