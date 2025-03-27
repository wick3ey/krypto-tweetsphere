
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Simple loading fallback without animations
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center">
      <p className="text-sm text-muted-foreground">Laddar innehåll...</p>
    </div>
  </div>
);

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pl-16">
      <Header />
      <Navigation />
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <main className="pt-16 min-h-[calc(100vh-4rem)] px-4">
            <Outlet />
          </main>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AppLayout;
