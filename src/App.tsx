
import React, { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotFound from "./pages/NotFound";
import { authService } from './api/authService';

// Simple loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

// Create a QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Lazy-load the page components
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isLoggedIn();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Setup route wrapper to ensure completed profile
const SetupProfileWrapper = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('jwt_token');
  const hasCompletedSetup = React.useRef<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const checkProfileCompletion = async () => {
      if (token) {
        try {
          // Check if profile setup is needed
          const needsSetup = await authService.checkProfileSetup();
          hasCompletedSetup.current = !needsSetup;
          
          if (needsSetup && !window.location.pathname.includes('/setup-profile')) {
            // Will redirect in the next render cycle
            hasCompletedSetup.current = false;
          }
        } catch (error) {
          console.error("Error checking profile completion:", error);
          // If we can't verify, clear auth data and assume they need to login again
          authService.clearAuthData();
          hasCompletedSetup.current = true; // Let them access the page, auth check will redirect them
        }
      } else {
        // No token means they're not logged in, so they don't need setup yet
        hasCompletedSetup.current = true;
      }
      setLoading(false);
    };
    
    checkProfileCompletion();
  }, [token]);
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  // If they have a token but haven't completed setup, redirect to setup
  if (token && hasCompletedSetup.current === false) {
    return <Navigate to="/setup-profile" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  // Clear auth data on app start to ensure users have to reconnect each time
  useEffect(() => {
    // Only clear if not on profile setup page to avoid interrupting setup process
    if (!window.location.pathname.includes('/setup-profile')) {
      console.log('Clearing auth data on app start');
      authService.clearAuthData();
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Profile setup route outside of main layout */}
                <Route path="/setup-profile" element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                } />
                
                {/* NotFound page outside of the main layout for better user experience */}
                <Route path="/404" element={<NotFound />} />
                
                {/* Main layout with primary routes */}
                <Route path="/" element={
                  <SetupProfileWrapper>
                    <AppLayout />
                  </SetupProfileWrapper>
                }>
                  <Route index element={<Index />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/:username" element={<Profile />} />
                  
                  {/* This catches all other routes */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
          
          {/* Toasters */}
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
