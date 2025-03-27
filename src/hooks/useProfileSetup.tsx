
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, needsProfileSetup, refetchCurrentUser } = useUser();
  
  // Track if we're currently redirecting to prevent multiple redirects
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Skip if we're already redirecting
    if (isRedirecting) return;
    
    // Skip setup check on specific pages
    const skipPages = ['/setup-profile', '/auth/callback'];
    if (skipPages.some(path => location.pathname.includes(path))) {
      setIsLoading(false);
      return;
    }

    const checkProfileSetup = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // User is not logged in, no setup needed
          setNeedsSetup(false);
          setIsLoading(false);
          return;
        }
        
        // Get latest user data
        await refetchCurrentUser();
        
        // Check if setup is needed
        const setupNeeded = needsProfileSetup();
        setNeedsSetup(setupNeeded);
        
        // Only redirect if setup is needed
        if (setupNeeded) {
          setIsRedirecting(true);
          
          // Wait a moment before redirecting to ensure we don't redirect in a loop
          setTimeout(() => {
            navigate('/setup-profile', { replace: true });
            // Reset redirecting flag after navigation
            setTimeout(() => setIsRedirecting(false), 500);
          }, 100);
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
        setNeedsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileSetup();
  }, [navigate, currentUser, location.pathname, needsProfileSetup, refetchCurrentUser, isRedirecting]);

  return { 
    isLoading, 
    needsSetup, 
    // Method to force a refresh of the profile status
    refetchProfileStatus: () => setIsRedirecting(false) 
  };
};
