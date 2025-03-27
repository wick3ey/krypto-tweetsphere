
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup, isValidProfile, refetchCurrentUser } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  const [forceCheck, setForceCheck] = useState(false);
  const [verifyingProfile, setVerifyingProfile] = useState(true);
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  // Förberedande kontroll vid komponentens laddning
  useEffect(() => {
    const verifyUser = async () => {
      setVerifyingProfile(true);
      
      try {
        // Hämta aktuell session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Ingen session - gå till startsidan
          navigate('/', { replace: true });
          return;
        }
        
        // Kontrollera om profilen verkligen behöver setup genom att anropa sync-auth-user funktionen
        const response = await supabase.functions.invoke('sync-auth-user', {
          body: { userId: session.user.id }
        });
        
        console.log('Sync user response:', response.data);
        
        if (!response.data.success) {
          console.error('Failed to sync user data:', response.data.error);
          toast.error('Kunde inte synkronisera användardata', {
            description: 'Vi behöver uppgifter för att fortsätta'
          });
          return;
        }
        
        const { needsProfileSetup: reallyNeedsSetup, user } = response.data;
        
        if (!reallyNeedsSetup) {
          console.log('User already has a complete profile, redirecting to home...');
          localStorage.setItem('profile_setup_complete', 'true');
          localStorage.removeItem('needs_profile_setup');
          
          // Uppdatera cachedUser
          localStorage.setItem('current_user', JSON.stringify(user));
          
          // Ladda om användardata för att säkerställa att UI är uppdaterat
          await refetchCurrentUser();
          
          // Gå till startsidan
          setRedirecting(true);
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
          return;
        } else {
          // Användaren behöver faktiskt göra setup
          localStorage.setItem('needs_profile_setup', 'true');
          localStorage.removeItem('profile_setup_complete');
          
          // Visa setup-komponenten
          setForceCheck(true);
        }
      } catch (error) {
        console.error('Error verifying profile:', error);
        toast.error('Kunde inte verifiera din profil', {
          description: 'Ett fel uppstod vid kontroll av din profil'
        });
      } finally {
        setVerifyingProfile(false);
      }
    };
    
    if (isAuthenticated) {
      verifyUser();
    } else {
      setVerifyingProfile(false);
    }
  }, [navigate, refetchCurrentUser]);
  
  // Håll koll på redan existerande användarprofiler
  useEffect(() => {
    // Force a re-check after component mount
    const timer = setTimeout(() => {
      if (!forceCheck) {
        setForceCheck(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [forceCheck]);
  
  // Kontrollera om användaren behöver profilinställning
  useEffect(() => {
    // If user has completed setup, redirect to home page
    if (currentUser && !isLoadingCurrentUser) {
      console.log('ProfileSetupPage - Current user:', {
        id: currentUser.id,
        username: currentUser.username,
        needsSetup: needsProfileSetup()
      });
      
      const setupNeeded = needsProfileSetup();
      
      if (!setupNeeded) {
        console.log('Setup NOT needed, redirecting to home...');
        
        // Mark setup as complete in localStorage to prevent loops
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
        
        // Set redirecting flag to prevent flickering
        setRedirecting(true);
        
        // Hard redirect to home to ensure complete page refresh
        window.location.href = '/';
      } else if (currentUser && isValidProfile && isValidProfile(currentUser)) {
        // Double-check: if the profile is valid but needsProfileSetup still returns true
        // This is a safety check in case our state got out of sync
        console.log('Profile is valid despite needsProfileSetup flag, redirecting...');
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
        setRedirecting(true);
        window.location.href = '/';
      }
    }
  }, [currentUser, isLoadingCurrentUser, needsProfileSetup, navigate, forceCheck, isValidProfile]);
  
  if (!isAuthenticated) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  // Visa inläsningsmeddelande medan vi kontrollerar
  if (verifyingProfile || isLoadingCurrentUser || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mb-4 mx-auto text-crypto-blue" />
          <h2 className="text-xl font-semibold mb-2">Kontrollerar din profil...</h2>
          <p className="text-muted-foreground">Vänta medan vi hämtar din användarinformation.</p>
        </div>
      </div>
    );
  }
  
  // If the profile setup is complete, redirect to home
  if (currentUser && !needsProfileSetup()) {
    console.log('Profile setup is complete, redirecting...');
    return <Navigate to="/" replace />;
  }
  
  // One last check to avoid showing setup to users with complete profiles
  if (currentUser && isValidProfile && isValidProfile(currentUser)) {
    console.log('Final check: Profile is valid, redirecting...');
    localStorage.setItem('profile_setup_complete', 'true');
    localStorage.removeItem('needs_profile_setup');
    return <Navigate to="/" replace />;
  }
  
  // Only show profile setup component if user needs setup
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-screen-md bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
        <ProfileSetup />
      </div>
    </div>
  );
};

export default ProfileSetupPage;
