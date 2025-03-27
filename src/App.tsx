
import React, { Suspense, lazy } from 'react';
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
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  // Pre-fetch current user data if token exists
  React.useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      queryClient.prefetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => authService.getCurrentUser(),
        staleTime: 5 * 60 * 1000,
      });
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
                <Route path="/setup-profile" element={<ProfileSetup />} />
                
                {/* NotFound page outside of the main layout for better user experience */}
                <Route path="/404" element={<NotFound />} />
                
                {/* Main layout with primary routes */}
                <Route path="/" element={<AppLayout />}>
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
