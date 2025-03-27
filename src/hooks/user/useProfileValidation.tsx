
import { useState } from 'react';
import { User } from '@/lib/types';

export function useProfileValidation() {
  const needsProfileSetup = () => {
    // Om profilen är markerad som klar i localStorage, förlita oss på det
    if (localStorage.getItem('profile_setup_complete') === 'true') {
      console.log('Profile setup complete flag is true, no setup needed');
      return false;
    }
    
    // Om vi explicit har markerat att profilen behöver konfigureras
    if (localStorage.getItem('needs_profile_setup') === 'true') {
      return true;
    }
    
    return false;
  };

  const isValidProfile = (user: User) => {
    if (!user) return false;
    
    // En profil anses vara giltig om:
    // 1. Den har ett användarnamn som inte är autogenererat
    // 2. Den har ett visningsnamn som inte är standardvärdet
    const isValid = !!user.username && 
           !user.username.startsWith('user_') && 
           !!user.displayName && 
           user.displayName !== 'New User';
           
    console.log('Profile completeness check:', {
      username: user.username,
      displayName: user.displayName,
      isComplete: isValid
    });
    
    return isValid;
  };

  return {
    needsProfileSetup,
    isValidProfile
  };
}
