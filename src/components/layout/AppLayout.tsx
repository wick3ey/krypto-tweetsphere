
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted"></div>
      <div className="h-4 w-32 bg-muted rounded"></div>
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
          <main className="pt-16"> {/* Add padding-top to compensate for fixed header */}
            <Outlet />
          </main>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AppLayout;
