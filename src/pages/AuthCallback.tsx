
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          localStorage.setItem('jwt_token', data.session.access_token);
          toast.success('Logged in successfully');
          navigate('/');
        } else {
          toast.error('Authentication failed');
          navigate('/welcome');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication error');
        navigate('/welcome');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <div className="ml-3 text-lg">Logging you in...</div>
    </div>
  );
};
