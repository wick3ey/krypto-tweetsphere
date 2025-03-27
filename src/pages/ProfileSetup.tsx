
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup, isValidProfile } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  const [forceCheck, setForceCheck] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  useEffect(() => {
    // Force a re-check after component mount
    const timer = setTimeout(() => {
      setForceCheck(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
  
  // Show loading state while checking user profile
  if (isLoadingCurrentUser || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mb-4 mx-auto text-crypto-blue" />
          <h2 className="text-xl font-semibold mb-2">Laddar användarprofil...</h2>
          <p className="text-muted-foreground">Vänta medan vi hämtar din profil.</p>
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
