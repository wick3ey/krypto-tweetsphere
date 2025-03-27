
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
  const navigate = useNavigate();
  
  // Check auth state on mount and when it changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success('Du har loggat ut');
      navigate('/');
    } catch (error: any) {
      toast.error('Kunde inte logga ut', {
        description: error.message
      });
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
    >
      Logga ut
    </Button>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-purple hover:to-crypto-blue text-white"
        >
          <LogIn className="h-4 w-4 mr-1" />
          <span>Logga in</span>
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
