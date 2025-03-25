
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Skapa en QueryClient med stabila inställningar
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuter
    },
  },
});

// Wrapper-komponent för layout
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <AppLayout>
                  <Profile />
                </AppLayout>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <AppLayout>
                  <Profile />
                </AppLayout>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/explore" 
              element={
                <AppLayout>
                  <Explore />
                </AppLayout>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <AppLayout>
                  <Messages />
                </AppLayout>
              } 
            />
            {/* Placeholder routes for the remaining pages */}
            <Route 
              path="/tweets" 
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              } 
            />
            <Route 
              path="/network" 
              element={
                <AppLayout>
                  <Explore />
                </AppLayout>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              } 
            />
            <Route 
              path="/hashtag/:tag" 
              element={
                <AppLayout>
                  <Explore />
                </AppLayout>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
