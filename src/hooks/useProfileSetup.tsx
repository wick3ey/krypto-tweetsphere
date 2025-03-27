
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
  const { currentUser, needsProfileSetup, refetchCurrentUser } = useUser();
  
  // Lägg till en state för att hålla reda på om omdirigering pågår
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Undvik att köra flera gånger
    if (isRedirecting) return;

    const checkProfileSetup = async () => {
      try {
        // Kontrollera om användaren är inloggad
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Användaren är inte inloggad
          setNeedsSetup(false);
          setIsLoading(false);
          return;
        }
        
        // Hämta uppdaterad användardata för att se korrekt profilstatus
        await refetchCurrentUser();
        
        try {
          // Om vi har currentUser, använd det för att kontrollera om användaren behöver slutföra uppsättning
          if (currentUser) {
            // Kontrollera om användaren behöver slutföra uppsättning
            const setupNeeded = needsProfileSetup();
            setNeedsSetup(setupNeeded);
            
            // Navigera bara om vi inte redan är på uppsättningssidan och uppsättning behövs
            if (setupNeeded) {
              if (!window.location.pathname.includes('/setup-profile')) {
                // Förhindra flera omdirigeringar
                setIsRedirecting(true);
                
                toast.info('Profilinställning krävs', {
                  description: 'Slutför din profil för att fortsätta.',
                });
                navigate('/setup-profile');
              }
            } else if (window.location.pathname.includes('/setup-profile')) {
              // Om användarens profil är klar och de fortfarande är på setup-sidan, navigera till startsidan
              setIsRedirecting(true);
              navigate('/');
            }
          } else {
            // Hämta användar-ID från sessionen
            const userId = session.user.id;
            
            if (userId) {
              // Kontrollera om användaren finns i databasen
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
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
                // Förhindra flera omdirigeringar
                setIsRedirecting(true);
                
                toast.info('Profilinställning krävs', {
                  description: 'Slutför din profil för att fortsätta.',
                });
                navigate('/setup-profile');
              } else if (!setupNeeded && window.location.pathname.includes('/setup-profile')) {
                // Om användarens profil är klar och de fortfarande är på setup-sidan, navigera till startsidan
                setIsRedirecting(true);
                navigate('/');
              }
            }
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          // Om vi inte kan hämta användaren, anta att de behöver konfigurera sin profil
          setNeedsSetup(true);
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
      } finally {
        setIsLoading(false);
        // Återställ omdirigeringsflaggan efter en timeout
        setTimeout(() => setIsRedirecting(false), 1000);
      }
    };

    checkProfileSetup();
  }, [navigate, currentUser, needsProfileSetup, refetchCurrentUser, isRedirecting]);

  return { isLoading, needsSetup, refetchProfileStatus: () => setIsRedirecting(false) };
};
