
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Improved loading fallback with reduced animation to prevent resource issues
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
      <p className="text-sm text-muted-foreground mt-2">Laddar innehåll...</p>
    </div>
  </div>
);

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header />
      <Navigation />
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <main className="pt-16 min-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AppLayout;
