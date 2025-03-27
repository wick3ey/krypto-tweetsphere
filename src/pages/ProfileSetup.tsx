
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup } = useUser();
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  useEffect(() => {
    // If the user has completed setup, redirect to home
    if (currentUser && !isLoadingCurrentUser && !needsProfileSetup()) {
      // Short delay to prevent flickering
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, isLoadingCurrentUser, needsProfileSetup, navigate]);
  
  if (!isAuthenticated) {
    // Redirect to home if not authenticated
    return <Navigate to="/" replace />;
  }
  
  // Show loading state while checking the user's profile
  if (isLoadingCurrentUser) {
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
  
  // Only render the profile setup component if user needs setup
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-screen-md bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
        <ProfileSetup />
      </div>
    </div>
  );
};

export default ProfileSetupPage;
