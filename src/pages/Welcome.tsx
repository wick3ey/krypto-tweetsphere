
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAuth } from '@/hooks/useAuth';

export const Welcome = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">F3ociety</h1>
          </div>
          <div className="flex items-center space-x-4">
            <AuthDialog />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">Welcome to F3ociety</h2>
            <p className="text-xl text-muted-foreground mb-8">
              The social platform for crypto enthusiasts to connect, share insights, and discover opportunities.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <AuthDialog />
              <Button variant="outline" asChild>
                <Link to="/explore">Explore</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 bg-gradient-to-br from-crypto-blue/20 to-crypto-purple/20 flex items-center justify-center p-8">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-8 max-w-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Join the community</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Connect with like-minded individuals</h4>
                  <p className="text-muted-foreground">Build your network in the crypto community</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Share your insights and opinions</h4>
                  <p className="text-muted-foreground">Contribute to meaningful discussions</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Discover new opportunities</h4>
                  <p className="text-muted-foreground">Stay updated on the latest trends and projects</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
