
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/authService';
import { toast } from 'sonner';

export const useProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfileSetup = async () => {
      try {
        // Only check if user is logged in
        if (authService.isLoggedIn()) {
          try {
            const user = await authService.getCurrentUser();
            
            // If user doesn't have a username, display name, or has default values, they need to complete setup
            const setupNeeded = !user.username || 
                              user.username.startsWith('user_') || 
                              !user.displayName || 
                              user.displayName === 'New User';
            
            setNeedsSetup(setupNeeded);
            
            // Only navigate if we're not already on the setup page and setup is needed
            if (setupNeeded && !window.location.pathname.includes('/setup-profile')) {
              toast.info('Profilinställning krävs', {
                description: 'Slutför din profil för att fortsätta.',
              });
              navigate('/setup-profile');
            }
          } catch (error) {
            console.error('Error fetching current user:', error);
            // If we can't get the user, assume they need to set up their profile
            setNeedsSetup(true);
            
            // Clear potentially corrupted auth data
            authService.clearAuthData();
            
            // Redirect to home to reconnect wallet
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
  }, [navigate]);

  return { isLoading, needsSetup };
};
