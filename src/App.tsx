
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import Dashboard from '@/pages/Dashboard';
import Messages from '@/pages/Messages';
import NotFound from '@/pages/NotFound';
import { AuthCallback } from '@/pages/AuthCallback';
import { Welcome } from '@/pages/Welcome';
import UserProfile from '@/pages/UserProfile';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  useEffect(() => {
    // Redirect to welcome page if not logged in and not on auth callback
    if (!isLoggedIn() && !location.pathname.startsWith('/auth/callback')) {
      navigate('/welcome');
    }
  }, [isLoggedIn, navigate, location.pathname]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SocketProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="messages" element={<Messages />} />
            <Route path="user/:username" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/welcome" element={<Welcome />} />
        </Routes>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
