
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
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
import ProfileSetup from '@/components/auth/ProfileSetup';
import NotFound from '@/pages/NotFound';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user needs profile setup
  useProfileSetup();
  
  // Subscribe to realtime updates for notifications
  useRealtime({
    table: 'notifications',
    filter: `user_id=eq.${localStorage.getItem('user_id')}`,
    queryKeys: [['notifications'], ['notificationCount']]
  });
  
  // Set up Supabase auth state listener
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        // Store user data
        if (session?.user) {
          localStorage.setItem('jwt_token', session.access_token);
          localStorage.setItem('user_id', session.user.id);
          
          toast.success('Inloggad!');
          
          // Only redirect to profile setup if not already there
          if (!location.pathname.includes('/setup-profile')) {
            // Check if user needs profile setup
            setTimeout(() => {
              authService.getCurrentUser()
                .then(user => {
                  const needsSetup = !user.username || 
                                   user.username.startsWith('user_') || 
                                   !user.displayName || 
                                   user.displayName === 'New User';
                  
                  if (needsSetup) {
                    toast.info('Profilinställning krävs', {
                      description: 'Slutför din profil för att fortsätta.',
                    });
                    navigate('/setup-profile');
                  }
                })
                .catch(err => {
                  console.error('Error checking user profile:', err);
                });
            }, 500);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear local storage and redirect to home page
        authService.clearAuthData();
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        toast.info('Du har loggat ut');
      }
    });
    
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('jwt_token', session.access_token);
        localStorage.setItem('user_id', session.user.id);
        localStorage.setItem('current_user', JSON.stringify(session.user));
      }
    });
    
    // Update last seen periodically
    const updateLastSeenInterval = setInterval(() => {
      if (localStorage.getItem('jwt_token')) {
        authService.updateLastSeen();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up
    return () => {
      subscription.unsubscribe();
      clearInterval(updateLastSeenInterval);
    };
  }, [navigate, location]);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:identifier" element={<Profile />} />
          <Route path="setup-profile" element={<ProfileSetup />} />
          <Route path="auth/callback" element={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin h-12 w-12 border-t-4 border-crypto-blue rounded-full"></div>
          </div>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
