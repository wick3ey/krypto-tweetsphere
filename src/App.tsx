
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotFound from "./pages/NotFound";

// Simple loading fallback to prevent high resource usage during initial load
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

// Create a simpler QueryClient to reduce initialization overhead
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      suspense: false,
      useErrorBoundary: true,
    },
  },
});

// Lazy-load the page components with low priority to improve initial load time
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Main layout with all routes using standard layout */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/tweets" element={<Index />} />
                  <Route path="/network" element={<Explore />} />
                  <Route path="/notifications" element={<Index />} />
                  <Route path="/settings" element={<Index />} />
                  <Route path="/hashtag/:tag" element={<Explore />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
                {/* Place the 404 page outside AppLayout since it has its own layout */}
                <Route path="/404" element={<NotFound />} />
              </Routes>
            </Suspense>
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
