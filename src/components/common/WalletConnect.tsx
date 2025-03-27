
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

// Lägg till TypeScript-deklaration för window.solana och window.phantom
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
  const { currentUser, refetchCurrentUser, checkWalletUser } = useUser();
  
  // Hjälpfunktion för att konvertera Uint8Array till base64-sträng
  const arrayToBase64 = (buffer: Uint8Array): string => {
    // Förbättrad base64-konverteringsmetod som är mer kompatibel mellan webbläsare
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  
  // Hämta Phantom-provider med den rekommenderade metoden
  const getProvider = () => {
    try {
      // Kontrollera om phantom finns i fönstret enligt rekommenderad metod
      if ('phantom' in window) {
        const provider = window.phantom?.solana;
        
        if (provider?.isPhantom) {
          console.log("Detected Phantom wallet via window.phantom.solana");
          return provider;
        }
      }
      
      // Fallback till legacy-detektering via window.solana
      if ('solana' in window && window.solana?.isPhantom) {
        console.log("Detected Phantom wallet via window.solana");
        return window.solana;
      }
      
      // Kontrollera om Phantom finns bland de injicerade providerna
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
      // Phantom är inte installerad, omdirigera till Phantom-webbplatsen
      window.open('https://phantom.app/', '_blank');
      toast.error("Phantom plånbok saknas", {
        description: "Du behöver installera Phantom plånbok för att fortsätta.",
      });
      return null;
    } catch (error) {
      console.error("Error getting provider:", error);
      toast.error("Kunde inte ansluta till Phantom", {
        description: "Ett fel uppstod vid anslutning till Phantom plånbok.",
      });
      return null;
    }
  };

  // Komponenten kommer INTE längre att ansluta automatiskt vid montering
  // Detta är för att säkerställa att användare explicit måste ansluta sin plånbok varje gång
  useEffect(() => {
    console.debug("WalletConnect component mounted, automatic connection disabled");
    
    // Rensa befintlig auth-data vid komponentmontering
    authService.clearAuthData();
    
    // Konfigurera kontoändringshanterare
    const setupAccountChangeListener = () => {
      const provider = getProvider();
      if (!provider) return;
      
      provider.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          // Användaren bytte till ett anslutet konto
          const newAddress = publicKey.toString();
          console.info("Switched wallet account", { newAddress });
          
          // Detta kräver återautentisering
          setIsConnected(false);
          setWalletAddress('');
          authService.clearAuthData();
          
          // Ogiltigförklara cachad användardata
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          
          // Uppmana användaren att återansluta med det nya kontot
          toast.info("Plånbok ändrad", {
            description: "Du behöver ansluta igen med ditt nya konto.",
          });
          
          // Utlös anslutning med det nya kontot
          handleConnect();
        } else {
          // Användaren bytte till ett konto som inte är anslutet till appen
          setIsConnected(false);
          setWalletAddress('');
          authService.clearAuthData();
        }
      });
      
      // Lyssna efter frånkopplingshändelser
      provider.on('disconnect', () => {
        console.info("Wallet disconnected");
        setIsConnected(false);
        setWalletAddress('');
        authService.clearAuthData();
        
        // Ogiltigförklara cachad användardata
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      });
    };
    
    setupAccountChangeListener();
    
    // Städa upp när komponenten avmonteras
    return () => {
      const provider = getProvider();
      if (provider) {
        provider.removeAllListeners('accountChanged');
        provider.removeAllListeners('disconnect');
      }
      console.debug("WalletConnect component unmounted");
    };
  }, [queryClient]);
  
  // Kontrollera om användare med denna wallet-adress finns
  const checkUserExistsAndRedirect = async (address: string) => {
    try {
      console.log("Kontrollerar om användare finns för wallet:", address);
      
      // Hämta användare från Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw userError;
      }
      
      // Om användaren inte finns eller saknar korrekt profildata
      if (!userData || 
          !userData.username || 
          userData.username.startsWith('user_') || 
          !userData.display_name || 
          userData.display_name === 'New User') {
        
        console.log("Användare behöver konfigurera profil:", 
          userData ? `${userData.username} (${userData.id})` : "Ingen användare hittad");
          
        toast.info("Profilkonfiguration behövs", {
          description: "Slutför din profil för att fortsätta.",
        });
        
        // Omdirigera till profilkonfiguration
        navigate('/setup-profile');
        return false;
      }
      
      console.log("Befintlig användare inloggad:", userData.username);
      
      // Uppdatera lokalt lagrad användardata
      const user = dbUserToUser(userData);
      localStorage.setItem('current_user', JSON.stringify(user));
      
      // Ladda om aktuell användardata
      refetchCurrentUser();
      
      return true;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };
  
  const verifyWalletConnection = async (provider: any, address: string) => {
    try {
      // Hämta engångsnummer och autentiseringsmeddelande från servern
      console.debug("Requesting authentication nonce", { address });
      
      let authData: { nonce: string, message: string };
      
      try {
        // Försök hämta från Supabase
        const { data, error } = await supabase.rpc('get_nonce', {
          wallet_addr: address
        });
        
        if (error || !data) {
          console.log("Kunde inte hämta nonce från Supabase:", error);
          
          // Skapa ett nytt engångsnummer lokalt som fallback
          const nonce = Math.floor(Math.random() * 1000000).toString();
          const message = `Sign this message to verify your wallet ownership: ${nonce}`;
          
          // Försök lagra i Supabase
          await supabase.rpc('create_nonce', {
            wallet_addr: address,
            nonce_value: nonce,
            message_text: message
          });
          
          authData = { nonce, message };
        } else {
          authData = data as { nonce: string, message: string };
        }
      } catch (nonceError) {
        console.error("Error getting nonce:", nonceError);
        
        // Skapa ett nytt engångsnummer lokalt som sista fallback
        const nonce = Math.floor(Math.random() * 1000000).toString();
        const message = `Sign this message to verify your wallet ownership: ${nonce}`;
        
        authData = { nonce, message };
      }
      
      if (!authData || !authData.nonce || !authData.message) {
        const errorMsg = "Failed to get valid authentication data";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const { message } = authData;
      console.debug("Received authentication message", { message });
      
      // Skapa en signatur med meddelandet från servern
      const encodedMessage = new TextEncoder().encode(message);
      
      // Signera meddelandet med det explicita meddelandeformatet
      console.debug("Requesting user to sign message", { message });
      const signedMessage = await provider.signMessage(encodedMessage, "utf8");
      
      // Logga signaturbytesen för felsökning
      console.debug("Signature bytes received", { 
        signatureBytes: signedMessage.signature,
        signatureLength: signedMessage.signature.length,
        signatureType: typeof signedMessage.signature
      });
      
      // Konvertera signaturbufferten till en base64-sträng för att skicka till servern
      const signature = arrayToBase64(signedMessage.signature);
      
      console.info("Message signed successfully", { 
        signaturePreview: signature.substring(0, 20) + '...',
        signatureLength: signature.length
      });
      
      // Verifiera signatur med servern och få JWT-token
      console.debug("Verifying signature with server");
      
      let authResult;
      try {
        // Försök verifiera genom Supabase Edge Function
        authResult = await authService.verifySignature(address, signature, message);
      } catch (verifyError) {
        console.error("Signature verification through API failed:", verifyError);
        
        // Fallback till direkt Supabase-anrop för utveckling
        const { data: isVerified, error: verifyRpcError } = await supabase.rpc('verify_signature', {
          wallet_addr: address,
          signature,
          message
        });
        
        if (verifyRpcError || !isVerified) {
          console.error("Direct verification also failed:", verifyRpcError);
          throw new Error("Could not verify wallet signature");
        }
        
        // Om verifieringen lyckades men API anropet misslyckades, 
        // skapa en lokal autentisering
        console.log("Using local authentication fallback");
        
        // Lagra wallet-adress
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('jwt_token', 'local_dev_token');
        
        // Kontrollera om användaren behöver skapa profil
        const userExists = await checkUserExistsAndRedirect(address);
        
        if (!userExists) {
          // Användaren behöver konfigurera profil
          navigate('/setup-profile');
        }
        
        return;
      }
      
      console.info("Signature verified successfully", { 
        userId: authResult.user.id, 
        needsProfileSetup: authResult.needsProfileSetup 
      });
      
      // Ogiltigförklara cachad användardata
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      if (onConnect) {
        onConnect(address);
      }
      
      // Kontrollera om detta är en ny användare som behöver slutföra profilkonfiguration
      if (authResult.needsProfileSetup) {
        console.info("Profile setup needed, redirecting to profile setup", 
          { userId: authResult.user.id });
          
        toast.success("Wallet ansluten! Låt oss konfigurera din profil", {
          description: "Slutför din profil för att komma igång",
        });
        
        // Omdirigera till profilkonfiguration
        navigate('/setup-profile');
      } else {
        console.info("Existing user logged in successfully", 
          { userId: authResult.user.id, username: authResult.user.username });
          
        // Ladda om aktuell användare för att säkerställa att vi har senaste data
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
      // Begär wallet-anslutning
      console.debug("Requesting connection to wallet");
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      console.info("Connected to wallet", { address });
      
      setWalletAddress(address);
      setIsConnected(true);
      
      // Verifiera med servern för att få en JWT-token
      await verifyWalletConnection(provider, address);
    } catch (error: any) {
      console.error("Wallet connection error", { error });
      setIsConnected(false);
      setWalletAddress('');
      
      // Kontrollera efter specifika felkoder
      if (error.code === 4001) {
        // Användaren avvisade anslutningen
        toast.info("Anslutning avbruten", {
          description: "Du avbröt anslutningsbegäran.",
        });
      } else if (error.message?.includes("rejected")) {
        // Alternativt sätt att upptäcka användaravvisningar
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
        // Koppla från Phantom
        await provider.disconnect();
      }
      
      // Logga ut från Supabase
      await authService.logout();
      
      // Återställ state
      setIsConnected(false);
      setWalletAddress('');
      
      // Ogiltigförklara användarfrågor
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      toast.success("Wallet bortkopplad", {
        description: "Du har loggat ut från din plånbok.",
      });
      
      // Omdirigera till startsidan
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

  // Visa olika UI baserat på anslutningsstatus
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
