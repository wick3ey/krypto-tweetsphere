
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
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
        
        // Navigate to home page directly
        window.location.href = '/';
      }
    }
  }, [currentUser, isLoadingCurrentUser, needsProfileSetup, navigate]);
  
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
