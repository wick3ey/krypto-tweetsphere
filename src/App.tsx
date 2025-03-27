
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/api/authService';
import { useRealtime } from '@/hooks/useRealtime';
import { useProfileSetup } from '@/hooks/useProfileSetup';

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
      if (event === 'SIGNED_OUT') {
        // Clear local storage and redirect to home page
        authService.clearAuthData();
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      }
    });
    
    // Update last seen periodically
    const updateLastSeenInterval = setInterval(() => {
      if (authService.isLoggedIn()) {
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
