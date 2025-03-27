
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Image, Upload, Camera, User, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { userService } from '@/api/userService';
import { User as UserType } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';

const profileSetupSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-z0-9_]+$/, {
      message: 'Username can only contain lowercase letters, numbers, and underscores',
    }),
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(50, { message: 'Display name cannot exceed 50 characters' }),
  bio: z
    .string()
    .max(160, { message: 'Bio cannot exceed 160 characters' })
    .optional(),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingCurrentUser, refetchCurrentUser, createProfile, syncAuthUser, getAuthEmail } = useUser();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: '',
      displayName: '',
      bio: '',
    },
  });

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const userId = session.user.id;
          
          const email = getAuthEmail() || session.user.email || '';
          setUserEmail(email);
          
          try {
            const result = await syncAuthUser(userId, true);
            
            if (result && !result.needsProfileSetup) {
              console.log('User already has a complete profile, redirecting to home');
              localStorage.setItem('profile_setup_complete', 'true');
              localStorage.removeItem('needs_profile_setup');
              
              if (result.user) {
                localStorage.setItem('current_user', JSON.stringify(result.user));
              }
              
              await refetchCurrentUser();
              
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
              return;
            } else if (result && result.user) {
              if (result.user.username && !result.user.username.startsWith('user_')) {
                form.setValue('username', result.user.username);
              }
              
              if (result.user.displayName && result.user.displayName !== 'New User') {
                form.setValue('displayName', result.user.displayName);
              }
              
              if (result.user.bio) {
                form.setValue('bio', result.user.bio);
              }
              
              if (result.user.avatarUrl) {
                setAvatarPreview(result.user.avatarUrl);
              }
            }
          } catch (error) {
            console.error('Error syncing user data:', error);
            setErrorMessage('Kunde inte synkronisera användarprofil. Fortsätt med profilinställningarna manuellt.');
            toast.error('Kunde inte synkronisera användarprofil', {
              description: 'Fortsätt med profilinställningarna manuellt'
            });
            
            // Fallback to current user data we have in state
            if (currentUser) {
              if (currentUser.username && !currentUser.username.startsWith('user_')) {
                form.setValue('username', currentUser.username);
              }
              
              if (currentUser.displayName && currentUser.displayName !== 'New User') {
                form.setValue('displayName', currentUser.displayName);
              }
              
              if (currentUser.bio) {
                form.setValue('bio', currentUser.bio);
              }
              
              if (currentUser.avatarUrl) {
                setAvatarPreview(currentUser.avatarUrl);
              }
            }
          }
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error checking profile status:', error);
        setDataLoaded(true);
        setErrorMessage('Ett fel uppstod vid kontroll av din profil');
      }
    };
    
    checkProfileStatus();
  }, [navigate, syncAuthUser, form, currentUser, refetchCurrentUser, getAuthEmail]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeaderFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setHeaderPreview(previewUrl);
    }
  };

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3) return true;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', currentUser?.id || '')
        .maybeSingle();
        
      const isAvailable = !data;
      setUsernameAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [currentUser?.id]);

  const handleNextStep = () => {
    if (currentStep === 0) {
      form.trigger(['username', 'displayName']).then(async (isValid) => {
        if (isValid) {
          const username = form.getValues('username');
          const isAvailable = await checkUsernameAvailability(username);
          
          if (!isAvailable) {
            form.setError('username', { 
              type: 'manual', 
              message: 'Username is already taken' 
            });
            return;
          }
          
          setCurrentStep(1);
        }
      });
    } else {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  const uploadImages = async () => {
    setIsUploading(true);
    try {
      let avatarUrl = '';
      let headerUrl = '';
      
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${currentUser.id}/avatar_${Date.now()}.${fileExt}`;
        
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);
          
        if (avatarError) throw avatarError;
        
        const { data: avatarUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        avatarUrl = avatarUrlData.publicUrl;
      }
      
      if (headerFile) {
        const fileExt = headerFile.name.split('.').pop();
        const filePath = `${currentUser.id}/header_${Date.now()}.${fileExt}`;
        
        const { data: headerData, error: headerError } = await supabase.storage
          .from('profiles')
          .upload(filePath, headerFile);
          
        if (headerError) throw headerError;
        
        const { data: headerUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        headerUrl = headerUrlData.publicUrl;
      }
      
      return { 
        avatarUrl: avatarUrl || avatarPreview, 
        headerUrl: headerUrl || headerPreview 
      };
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Kunde inte ladda upp bilder');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileSetupFormValues) => {
    if (setupCompleted) {
      console.log('Setup already completed, preventing duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setSetupCompleted(true);
      
      const { avatarUrl, headerUrl } = await uploadImages();
      
      const profileData: Partial<UserType> = {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || '',
        avatarUrl,
        headerUrl,
        id: currentUser?.id,
        email: userEmail
      };
      
      console.log('Sending profile data for setup:', profileData);
      
      await new Promise<void>((resolve, reject) => {
        try {
          createProfile(profileData);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      toast.success('Profilinställning klar!', {
        description: 'Välkommen till F3ociety!',
      });
      
      localStorage.setItem('profile_setup_complete', 'true');
      localStorage.removeItem('needs_profile_setup');
      localStorage.removeItem('current_user');
      
      await refetchCurrentUser();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Profilinställning misslyckades', {
        description: 'Vänligen försök igen.',
      });
      setSetupCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('username', value);
    
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  if (isLoadingCurrentUser || !dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <div className="animate-spin h-8 w-8 border-4 border-crypto-blue border-t-transparent rounded-full"></div>
        <div className="ml-3 text-lg">Kontrollerar din profil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background rounded-lg shadow-sm border">
      <div className="relative pt-4">
        <div className="flex justify-center mb-2 px-4">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between px-4 text-xs text-muted-foreground">
          <span>Profilinformation</span>
          <span>Bilder</span>
          <span>Bio</span>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {currentStep === 0 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Konfigurera din profil</h1>
                <p className="text-muted-foreground mt-2">Välj hur du vill visas på F3ociety</p>
              </div>
              
              {errorMessage && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4">
                  <p className="font-bold">Observera</p>
                  <p>{errorMessage}</p>
                </div>
              )}
              
              {userEmail && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md mb-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Användarnamn</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-1">@</span>
                        <Input
                          placeholder="användarnamn"
                          {...field}
                          className="flex-1"
                          onChange={handleUsernameChange}
                        />
                      </div>
                    </FormControl>
                    {isValidating && (
                      <p className="text-xs text-muted-foreground">Kontrollerar tillgänglighet...</p>
                    )}
                    {!isValidating && field.value.length >= 3 && !usernameAvailable && (
                      <p className="text-xs text-red-500">Användarnamnet är redan taget</p>
                    )}
                    {!isValidating && field.value.length >= 3 && usernameAvailable && (
                      <p className="text-xs text-green-500">Användarnamnet är tillgängligt</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visningsnamn</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ditt namn"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="button" onClick={handleNextStep}>Nästa</Button>
              </div>
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Ladda upp profilbilder</h1>
                <p className="text-muted-foreground mt-2">Lägg till en profilbild och omslagsbild</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Profilbild</label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback>
                          <User className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setAvatarFile(file);
                            
                            const previewUrl = URL.createObjectURL(file);
                            setAvatarPreview(previewUrl);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{avatarFile ? avatarFile.name : 'Ingen fil vald'}</p>
                      {avatarFile && (
                        <p className="text-xs text-muted-foreground">{Math.round(avatarFile.size / 1024)} KB</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Omslagsbild</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center relative group cursor-pointer">
                    {headerPreview ? (
                      <div className="relative">
                        <img 
                          src={headerPreview} 
                          alt="Header preview" 
                          className="w-full h-32 object-cover rounded-md" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="py-6">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Klicka för att ladda upp en omslagsbild</p>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setHeaderFile(file);
                          
                          const previewUrl = URL.createObjectURL(file);
                          setHeaderPreview(previewUrl);
                        }
                      }}
                    />
                  </div>
                  {headerFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {headerFile.name} ({Math.round(headerFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  Tillbaka
                </Button>
                <Button type="button" onClick={handleNextStep}>
                  Nästa
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Slutför din profil</h1>
                <p className="text-muted-foreground mt-2">Berätta om dig själv</p>
              </div>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Skriv en kort beskrivning om dig själv..."
                        className="h-32 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground text-right">
                      {field.value?.length || 0}/160
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  Tillbaka
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploading || setupCompleted}
                  className="flex items-center gap-1"
                >
                  {isSubmitting || isUploading ? (
                    <>Sparar...</>
                  ) : (
                    <>
                      Slutför <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ProfileSetup;
