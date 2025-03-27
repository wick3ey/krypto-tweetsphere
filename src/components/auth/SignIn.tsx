
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/api/authService';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';

export const SignIn = ({ onToggleForm }: { onToggleForm: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Fyll i både e-post och lösenord');
      return;
    }
    
    try {
      setIsLoading(true);
      await authService.signInWithEmail(email, password);
      toast.success('Inloggad!');
      navigate('/');
    } catch (error: any) {
      console.error('Inloggningsfel:', error);
      
      // Visa användaranpassade felmeddelanden baserat på felkod
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Fel e-post eller lösenord', {
          description: 'Kontrollera dina uppgifter och försök igen'
        });
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('E-post inte bekräftad', {
          description: 'Vänligen bekräfta din e-post innan du loggar in'
        });
      } else {
        toast.error('Kunde inte logga in', {
          description: error.message || 'Kontrollera dina uppgifter och försök igen'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      toast.info('Omdirigerar till Google...');
      
      // Get current URL to determine environment
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      const redirectTo = isLocalhost
        ? `${window.location.origin}/auth/callback` // Use local origin for development
        : 'https://f3oci3ty.xyz/auth/callback'; // Use production domain for live site
      
      console.log('Signing in with Google, redirectTo:', redirectTo);
      
      const result = await authService.signInWithGoogle();
      
      if (result.error) {
        throw result.error;
      }
      
      // Google redirection happens here, no need to handle navigation
      // But we'll set a timeout to reset the button state if redirection doesn't happen
      setTimeout(() => {
        setGoogleLoading(false);
      }, 5000); // 5 seconds timeout
      
    } catch (error: any) {
      console.error('Google-inloggningsfel:', error);
      toast.error('Kunde inte logga in med Google', {
        description: error.message || 'Försök igen senare'
      });
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Logga in</CardTitle>
        <CardDescription className="text-center">
          Välj en inloggningsmetod
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="namn@exempel.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading || googleLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading || googleLoading}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || googleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loggar in...
              </>
            ) : (
              'Logga in med e-post'
            )}
          </Button>
        </form>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">eller</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={isLoading || googleLoading}
        >
          {googleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Förbereder Google-inloggning...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Fortsätt med Google
            </>
          )}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="link" 
          onClick={onToggleForm}
          disabled={isLoading || googleLoading}
        >
          Inget konto? Registrera dig
        </Button>
      </CardFooter>
    </Card>
  );
};
