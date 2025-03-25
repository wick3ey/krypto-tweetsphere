
import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotFound from "./pages/NotFound";

// Lazy loading av sidorna för att förbättra prestanda
const Index = React.lazy(() => import('./pages/Index'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Explore = React.lazy(() => import('./pages/Explore'));
const Messages = React.lazy(() => import('./pages/Messages'));

// Skapa en förbättrad QueryClient med stabila inställningar som minskar flicker
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuter
      suspense: false, // Inaktivera React Query's inbyggda suspense
      useErrorBoundary: true, // Använd ErrorBoundary för att fånga query-fel
    },
  },
});

// Laddningskomponent för Suspense
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted"></div>
      <div className="h-4 w-32 bg-muted rounded"></div>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Main layout med alla routes som använder standard layouten */}
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
                  {/* Redirect för eventuella felaktiga URL:er */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
                {/* Lägg 404-sidan utanför AppLayout eftersom den har egen layout */}
                <Route path="/404" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        
        {/* Placera toasters utanför routing för att undvika att de försvinner vid route-ändringar */}
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
