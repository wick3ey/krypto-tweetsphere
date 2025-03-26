
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
    <div className="container max-w-screen-md mx-auto py-12">
      <ProfileSetup />
    </div>
  );
};

export default ProfileSetupPage;
