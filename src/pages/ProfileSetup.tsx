
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, needsProfileSetup } = useUser();
  
  // Kontrollera om användaren är autentiserad
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  useEffect(() => {
    // Om användaren har slutfört inställningen, omdirigera till startsidan
    if (currentUser && !isLoadingCurrentUser && !needsProfileSetup()) {
      // Markera inställningen som slutförd i localStorage för att förhindra loopar
      localStorage.setItem('profile_setup_complete', 'true');
      localStorage.removeItem('needs_profile_setup');
      
      // Kort fördröjning för att förhindra flimmer
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }

    // Log debugging information to help diagnose issues
    if (currentUser) {
      console.log('ProfileSetupPage - Current user:', {
        id: currentUser.id,
        username: currentUser.username,
        needsSetup: needsProfileSetup()
      });
    }
  }, [currentUser, isLoadingCurrentUser, needsProfileSetup, navigate]);
  
  if (!isAuthenticated) {
    // Omdirigera till startsidan om inte autentiserad
    return <Navigate to="/" replace />;
  }
  
  // Visa laddningstillstånd medan användarens profil kontrolleras
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
  
  // Visa endast profilinställningskomponenten om användaren behöver inställning
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-screen-md bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
        <ProfileSetup />
      </div>
    </div>
  );
};

export default ProfileSetupPage;
