
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isLoggedIn = () => {
    return !!session;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    navigate('/welcome');
  };

  return {
    session,
    isLoggedIn,
    signOut
  };
}
