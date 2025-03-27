import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup, isValidProfile, refetchCurrentUser, syncAuthUser } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  const [forceCheck, setForceCheck] = useState(false);
  const [verifyingProfile, setVerifyingProfile] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  useEffect(() => {
    const verifyUser = async () => {
      setVerifyingProfile(true);
      setErrorState(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/', { replace: true });
          return;
        }
        
        const userId = session.user.id;
        
        try {
          const result = await syncAuthUser(userId, true);
          
          if (!result) {
            console.error('Failed to sync user: No result returned');
            setErrorState('Kunde inte synkronisera användarprofilen. Vi fortsätter med profilinställningen ändå.');
            setForceCheck(true);
            setVerifyingProfile(false);
            return;
          }
          
          if (!result.needsProfileSetup) {
            console.log('User already has a complete profile, redirecting to home');
            localStorage.setItem('profile_setup_complete', 'true');
            localStorage.removeItem('needs_profile_setup');
            
            if (result.user) {
              localStorage.setItem('current_user', JSON.stringify(result.user));
            }
            
            await refetchCurrentUser();
            
            setRedirecting(true);
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
            return;
          } else {
            localStorage.setItem('needs_profile_setup', 'true');
            localStorage.removeItem('profile_setup_complete');
            
            setForceCheck(true);
          }
        } catch (syncError) {
          console.error('Error syncing user:', syncError);
          setErrorState('Kunde inte synkronisera användarprofilen. Vi fortsätter med profilinställningen ändå.');
          
          if (currentUser && isValidProfile && isValidProfile(currentUser)) {
            localStorage.setItem('profile_setup_complete', 'true');
            localStorage.removeItem('needs_profile_setup');
            setRedirecting(true);
            window.location.href = '/';
            return;
          } else {
            setForceCheck(true);
          }
        }
      } catch (error) {
        console.error('Error verifying profile:', error);
        setErrorState('Ett fel uppstod vid kontroll av din profil. Vi fortsätter med profilinställningen ändå.');
        setForceCheck(true);
      } finally {
        setVerifyingProfile(false);
      }
    };
    
    if (isAuthenticated) {
      verifyUser();
    } else {
      setVerifyingProfile(false);
    }
  }, [navigate, refetchCurrentUser, syncAuthUser, currentUser, isValidProfile]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!forceCheck) {
        setForceCheck(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [forceCheck]);
  
  useEffect(() => {
    if (currentUser && !isLoadingCurrentUser) {
      console.log('ProfileSetupPage - Current user:', {
        id: currentUser.id,
        username: currentUser.username,
        needsSetup: needsProfileSetup()
      });
      
      const setupNeeded = needsProfileSetup();
      
      if (!setupNeeded) {
        console.log('Setup NOT needed, redirecting to home...');
        
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
        
        setRedirecting(true);
        window.location.href = '/';
      } else if (currentUser && isValidProfile && isValidProfile(currentUser)) {
        console.log('Profile is valid despite needsProfileSetup flag, redirecting...');
        localStorage.setItem('profile_setup_complete', 'true');
        localStorage.removeItem('needs_profile_setup');
        setRedirecting(true);
        window.location.href = '/';
      }
    }
  }, [currentUser, isLoadingCurrentUser, needsProfileSetup, navigate, forceCheck, isValidProfile]);
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (verifyingProfile || isLoadingCurrentUser || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mb-4 mx-auto text-crypto-blue" />
          <h2 className="text-xl font-semibold mb-2">Kontrollerar din profil...</h2>
          <p className="text-muted-foreground">Vänta medan vi hämtar din användarinformation.</p>
          {errorState && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
              <p>{errorState}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (currentUser && !needsProfileSetup()) {
    console.log('Profile setup is complete, redirecting...');
    return <Navigate to="/" replace />;
  }
  
  if (currentUser && isValidProfile && isValidProfile(currentUser)) {
    console.log('Final check: Profile is valid, redirecting...');
    localStorage.setItem('profile_setup_complete', 'true');
    localStorage.removeItem('needs_profile_setup');
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-screen-md bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
        {errorState && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4">
            <p className="font-bold">Observera</p>
            <p>{errorState}</p>
          </div>
        )}
        <ProfileSetup />
      </div>
    </div>
  );
};

export default ProfileSetupPage;
