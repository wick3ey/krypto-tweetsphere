
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/authService';

export const useProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfileSetup = async () => {
      try {
        // Only check if user is logged in
        if (localStorage.getItem('jwt_token')) {
          const user = await authService.getCurrentUser();
          
          // If user doesn't have a username or display name, they need to complete setup
          if (!user.username || !user.displayName) {
            setNeedsSetup(true);
            navigate('/setup-profile');
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
