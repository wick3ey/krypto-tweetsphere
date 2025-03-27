
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/api/authService';
import { useRealtime } from '@/hooks/useRealtime';
import { useProfileSetup } from '@/hooks/useProfileSetup';
import { toast } from 'sonner';

// Layout components
import MainLayout from '@/components/layout/MainLayout';

// Pages
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import ProfileSetupPage from '@/pages/ProfileSetup';
import NotFound from '@/pages/NotFound';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Only initialize profile setup hook after auth is initialized
  const profileSetup = authInitialized ? useProfileSetup() : { isLoading: true, needsSetup: false };
  
  // Subscribe to realtime updates for notifications if user is logged in
  const userId = localStorage.getItem('user_id');
  useRealtime({
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [['notifications'], ['notificationCount']],
    enabled: !!userId
  });
  
  // Set up Supabase auth state listener
  useEffect(() => {
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    
    // Start auth initialization
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Store essential auth data
          localStorage.setItem('jwt_token', session.access_token);
          localStorage.setItem('user_id', session.user.id);
          
          // No need to await this since it can happen in background
          authService.getCurrentUser()
            .then(user => {
              // Store current user data
              localStorage.setItem('current_user', JSON.stringify(user));
            })
            .catch(err => {
              console.error('Error fetching user data during initialization:', err);
            });
        }
        
        // Now set up the auth state listener for future changes
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (event === 'SIGNED_IN') {
            // Store essential auth data
            if (session) {
              localStorage.setItem('jwt_token', session.access_token);
              localStorage.setItem('user_id', session.user.id);
              
              toast.success('Inloggad!');
              
              // If we're on the callback page, redirect home
              if (location.pathname.includes('/auth/callback')) {
                navigate('/', { replace: true });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            // Clear all auth data
            authService.clearAuthData();
            
            if (location.pathname !== '/') {
              navigate('/', { replace: true });
            }
            
            toast.info('Du har loggat ut');
          }
        });
        
        authStateSubscription = data.subscription;
        setAuthInitialized(true);
        setSessionChecked(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSessionChecked(true);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Update last seen periodically if user is logged in
    const updateLastSeenInterval = setInterval(() => {
      if (localStorage.getItem('jwt_token')) {
        authService.updateLastSeen().catch(console.error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up
    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
      clearInterval(updateLastSeenInterval);
    };
  }, [navigate, location.pathname]);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:identifier" element={<Profile />} />
          <Route path="setup-profile" element={<ProfileSetupPage />} />
          <Route path="auth/callback" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-t-4 border-crypto-blue rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-medium">Loggar in...</p>
                <p className="text-sm text-muted-foreground">Du omdirigeras automatiskt</p>
              </div>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
