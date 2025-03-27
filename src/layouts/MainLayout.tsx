
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pl-16">
      <Header />
      <Navigation />
      <main className="pt-16 min-h-[calc(100vh-4rem)] px-4">
        <Outlet />
      </main>
    </div>
  );
};
