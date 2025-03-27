
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/authService';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();
  const { currentUser, needsProfileSetup } = useUser();

  useEffect(() => {
    const checkProfileSetup = async () => {
      try {
        // Kontrollera bara om användaren är inloggad
        if (authService.isLoggedIn()) {
          try {
            // Om vi redan har currentUser, använd det
            if (currentUser) {
              // Kontrollera om användaren behöver slutföra uppsättning
              const setupNeeded = needsProfileSetup();
              setNeedsSetup(setupNeeded);
              
              // Navigera bara om vi inte redan är på uppsättningssidan och uppsättning behövs
              if (setupNeeded && !window.location.pathname.includes('/setup-profile')) {
                toast.info('Profilinställning krävs', {
                  description: 'Slutför din profil för att fortsätta.',
                });
                navigate('/setup-profile');
              }
            } else {
              // Hämta wallet-adress från localStorage
              const walletAddress = localStorage.getItem('wallet_address');
              
              if (walletAddress) {
                // Kontrollera om användaren finns i databasen
                const { data, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('wallet_address', walletAddress)
                  .maybeSingle();
                
                if (error) throw error;
                
                // Om användaren inte finns eller behöver uppsättning
                const setupNeeded = !data || 
                                  !data.username || 
                                  data.username.startsWith('user_') || 
                                  !data.display_name || 
                                  data.display_name === 'New User';
                
                setNeedsSetup(setupNeeded);
                
                if (setupNeeded && !window.location.pathname.includes('/setup-profile')) {
                  toast.info('Profilinställning krävs', {
                    description: 'Slutför din profil för att fortsätta.',
                  });
                  navigate('/setup-profile');
                }
              } else {
                // Om vi inte har en wallet-adress så är användaren inte riktigt inloggad
                authService.clearAuthData();
                navigate('/');
              }
            }
          } catch (error) {
            console.error('Error fetching current user:', error);
            // Om vi inte kan hämta användaren, anta att de behöver konfigurera sin profil
            setNeedsSetup(true);
            
            // Rensa potentiellt korrupt auth-data
            authService.clearAuthData();
            
            // Omdirigera till hem för att återansluta wallet
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileSetup();
  }, [navigate, currentUser, needsProfileSetup]);

  return { isLoading, needsSetup };
};
