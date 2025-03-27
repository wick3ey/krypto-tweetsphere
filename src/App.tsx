import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/api/authService';
import { useRealtime } from '@/hooks/useRealtime';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Skip profile setup check on auth callback and setup pages
  const skipProfileCheck = location.pathname.includes('/auth/callback') || 
                           location.pathname.includes('/setup-profile');
  
  // Subscribe to realtime updates for notifications if user is logged in
  const userId = localStorage.getItem('user_id');
  useRealtime({
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [['notifications'], ['notificationCount']]
  });
  
  // Set up Supabase auth state listener
  useEffect(() => {
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    
    // Start auth initialization
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
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
              if (user) {
                localStorage.setItem('current_user', JSON.stringify(user));
                
                // More robust check for profile completeness
                const needsSetup = !user.username || 
                                  user.username.startsWith('user_') || 
                                  !user.displayName || 
                                  user.displayName === 'New User';
                
                if (needsSetup) {
                  console.log('User needs profile setup based on user data check');
                  localStorage.setItem('needs_profile_setup', 'true');
                  localStorage.removeItem('profile_setup_complete');
                  
                  // Only redirect if not already on setup page
                  if (!location.pathname.includes('/setup-profile')) {
                    setTimeout(() => {
                      navigate('/setup-profile', { replace: true });
                    }, 100);
                  }
                } else {
                  // Mark profile as complete - this user doesn't need setup
                  console.log('User does NOT need profile setup based on data check');
                  localStorage.setItem('profile_setup_complete', 'true');
                  localStorage.removeItem('needs_profile_setup');
                  
                  // If on setup page but profile is complete, redirect to home
                  if (location.pathname.includes('/setup-profile')) {
                    setTimeout(() => {
                      navigate('/', { replace: true });
                    }, 100);
                  }
                }
              }
              setIsLoading(false);
            })
            .catch(err => {
              console.error('Error fetching user data during initialization:', err);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
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
              
              // Delay fetching user data to prevent Supabase deadlock
              setTimeout(() => {
                // We'll check if profile setup is needed after fetching user data
                authService.getCurrentUser()
                  .then(user => {
                    // Store current user data
                    if (user) {
                      localStorage.setItem('current_user', JSON.stringify(user));
                      
                      // Check if profile setup is needed with more robust criteria
                      const hasValidProfile = authService.hasCompleteProfile(user);
                      
                      if (!hasValidProfile) {
                        console.log('User needs to set up profile after sign in');
                        localStorage.setItem('needs_profile_setup', 'true');
                        localStorage.removeItem('profile_setup_complete');
                        
                        // Only redirect if not already on setup page
                        if (!location.pathname.includes('/setup-profile')) {
                          navigate('/setup-profile', { replace: true });
                        }
                      } else {
                        console.log('User already has a valid profile after sign in');
                        // Mark profile as complete - this user doesn't need setup
                        localStorage.setItem('profile_setup_complete', 'true');
                        localStorage.removeItem('needs_profile_setup');
                        
                        // If we're on callback page, redirect to home page
                        if (location.pathname.includes('/auth/callback')) {
                          navigate('/', { replace: true });
                        }
                      }
                    }
                  })
                  .catch(err => {
                    console.error('Error fetching user data after sign in:', err);
                  });
              }, 100);
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
        setIsLoading(false);
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

  // If user is authenticated but not on setup-profile page, check if profile setup is needed
  useEffect(() => {
    // Skip if auth is not initialized or on specific pages
    if (!authInitialized || skipProfileCheck) {
      return;
    }

    const checkProfileSetup = async () => {
      try {
        // Check if user is logged in
        const isAuthenticated = !!localStorage.getItem('jwt_token');
        if (!isAuthenticated) {
          return;
        }

        // Check if profile setup is complete from localStorage first
        const profileSetupComplete = localStorage.getItem('profile_setup_complete') === 'true';
        if (profileSetupComplete) {
          console.log('Profile setup already marked complete in localStorage');
          return;
        }
        
        // If profile setup is explicitly needed, redirect
        const needsProfileSetupFlag = localStorage.getItem('needs_profile_setup') === 'true';
        if (needsProfileSetupFlag) {
          console.log('Profile setup explicitly needed based on localStorage flag');
          // Add a small delay to prevent redirect loop
          setTimeout(() => {
            navigate('/setup-profile', { replace: true });
          }, 100);
          return;
        }

        // Fetch current user data
        const userData = await authService.getCurrentUser();
        if (!userData) {
          return;
        }

        // Comprehensive check for profile completeness
        const hasValidProfile = authService.hasCompleteProfile(userData);

        if (!hasValidProfile) {
          // Set the flag to avoid multiple checks
          console.log('Profile is incomplete based on user data check');
          localStorage.setItem('needs_profile_setup', 'true');
          localStorage.removeItem('profile_setup_complete');
          
          // Add a small delay to prevent redirect loop
          setTimeout(() => {
            navigate('/setup-profile', { replace: true });
          }, 100);
        } else {
          // Mark profile setup as complete
          console.log('Profile is complete based on user data check');
          localStorage.setItem('profile_setup_complete', 'true');
          localStorage.removeItem('needs_profile_setup');
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
      }
    };

    checkProfileSetup();
  }, [authInitialized, navigate, skipProfileCheck]);
  
  // Custom auth callback handling for when /auth/callback is loaded
  useEffect(() => {
    if (!location.pathname.includes('/auth/callback')) {
      return;
    }
    
    // Optimera auth callback-hantering för snabb omdirigering
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page detected, processing authentication...');
        
        // Tvinga omedelbar sessionkontroll
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session found on callback, redirecting to appropriate page');
          // Lagra viktig auth-data
          localStorage.setItem('jwt_token', session.access_token);
          localStorage.setItem('user_id', session.user.id);
          
          // Hämta användardata i bakgrunden
          authService.getCurrentUser()
            .then((user) => {
              // Kontrollera om användaren behöver gå till profilinställningssidan
              const needsSetup = localStorage.getItem('needs_profile_setup') === 'true' || 
                             !user.username || 
                             user.username.startsWith('user_') || 
                             !user.displayName || 
                             user.displayName === 'New User';
              
              if (needsSetup) {
                localStorage.removeItem('profile_setup_complete');
                navigate('/setup-profile', { replace: true });
              } else {
                localStorage.setItem('profile_setup_complete', 'true');
                navigate('/', { replace: true });
              }
              
              toast.success('Inloggad!');
            })
            .catch(error => {
              console.error('Error in auth callback user fetch:', error);
              navigate('/', { replace: true });
            });
          
          // Omdirigera omedelbart om vi inte kunde hämta användardata av någon anledning
          const timeoutId = setTimeout(() => {
            if (location.pathname.includes('/auth/callback')) {
              navigate('/', { replace: true });
            }
          }, 1500);
          
          return () => clearTimeout(timeoutId);
        } else {
          // Vänta en kort stund och kontrollera igen ifall sessionen håller på att etableras
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              console.log('Session found after retry, redirecting to appropriate page');
              localStorage.setItem('jwt_token', retrySession.access_token);
              localStorage.setItem('user_id', retrySession.user.id);
              
              const needsSetup = localStorage.getItem('needs_profile_setup') === 'true';
              if (needsSetup) {
                navigate('/setup-profile', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            } else {
              console.log('No session found after retry, redirecting to home anyway');
              navigate('/', { replace: true });
            }
          }, 800); // Kort timeout för slutlig kontroll
        }
      } catch (error) {
        console.error('Error during auth callback:', error);
        toast.error('Inloggning misslyckades');
        navigate('/', { replace: true });
      }
    };
    
    handleAuthCallback();
  }, [location.pathname, navigate]);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:username" element={<Profile />} />
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
