
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignIn } from '@/components/auth/SignIn';
import { SignUp } from '@/components/auth/SignUp';
import { LogIn } from 'lucide-react';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AuthDialog = () => {
  const [open, setOpen] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check auth state on mount and when it changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      
      // Close dialog on successful sign in
      if (event === 'SIGNED_IN' && session) {
        setOpen(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      toast.success('Du har loggat ut');
      navigate('/');
    } catch (error: any) {
      toast.error('Kunde inte logga ut', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleForm = () => {
    setIsSignIn(!isSignIn);
  };

  return isLoggedIn ? (
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-full"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? 'Arbetar...' : 'Logga ut'}
    </Button>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-purple hover:to-crypto-blue text-white"
          disabled={isLoading}
        >
          <LogIn className="h-4 w-4 mr-1" />
          <span>{isLoading ? 'Laddar...' : 'Logga in'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isSignIn ? (
          <SignIn onToggleForm={toggleForm} />
        ) : (
          <SignUp onToggleForm={toggleForm} />
        )}
      </DialogContent>
    </Dialog>
  );
};
