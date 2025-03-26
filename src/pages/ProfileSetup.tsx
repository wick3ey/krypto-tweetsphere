
import React from 'react';
import { Navigate } from 'react-router-dom';
import ProfileSetup from '@/components/auth/ProfileSetup';

const ProfileSetupPage = () => {
  // Check if the user is authenticated
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  if (!isAuthenticated) {
    // Redirect to home if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-screen-md bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
        <ProfileSetup />
      </div>
    </div>
  );
};

export default ProfileSetupPage;
