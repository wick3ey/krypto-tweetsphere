
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotFound from "./pages/NotFound";

// Improve lazy loading with proper error handling and fallbacks
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted"></div>
      <div className="h-4 w-32 bg-muted rounded"></div>
    </div>
  </div>
);

// Create a more stable QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      suspense: false, // Disable React Query's built-in suspense
      useErrorBoundary: true, // Use ErrorBoundary for query errors
      refetchOnMount: false, // Prevent unnecessary refetching
      refetchOnReconnect: false, // Prevent unnecessary refetching
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Main layout with all routes using standard layout */}
              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Index />
                    </Suspense>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Profile />
                    </Suspense>
                  }
                />
                <Route
                  path="/profile/:username"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Profile />
                    </Suspense>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Explore />
                    </Suspense>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Messages />
                    </Suspense>
                  }
                />
                <Route
                  path="/tweets"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Index />
                    </Suspense>
                  }
                />
                <Route
                  path="/network"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Explore />
                    </Suspense>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Index />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Index />
                    </Suspense>
                  }
                />
                <Route
                  path="/hashtag/:tag"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Explore />
                    </Suspense>
                  }
                />
                {/* Redirect for invalid URLs */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Route>
              {/* Place the 404 page outside AppLayout since it has its own layout */}
              <Route path="/404" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          
          {/* Place toasters outside routing to prevent them from disappearing on route changes */}
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
