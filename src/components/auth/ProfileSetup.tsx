
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Image, Upload, Camera, User, Check } from 'lucide-react';
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
import { authService } from '@/api/authService';

// Set up schema validation
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
  const { currentUser, isLoadingCurrentUser, refetchCurrentUser } = useUser();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  
  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: '',
      displayName: '',
      bio: '',
    },
  });

  // Set initial values if user data is available
  useEffect(() => {
    if (currentUser) {
      // Only set initial values if they're not already set by the user
      const currentUsername = form.getValues('username');
      if (!currentUsername && currentUser.username && !currentUser.username.startsWith('user_')) {
        form.setValue('username', currentUser.username);
      }
      
      const currentDisplayName = form.getValues('displayName');
      if (!currentDisplayName && currentUser.displayName && currentUser.displayName !== 'New User') {
        form.setValue('displayName', currentUser.displayName);
      }
      
      if (currentUser.bio) {
        form.setValue('bio', currentUser.bio);
      }
      
      if (currentUser.avatarUrl) {
        setAvatarPreview(currentUser.avatarUrl);
      }
      
      if (currentUser.headerUrl) {
        setHeaderPreview(currentUser.headerUrl);
      }
    }
  }, [currentUser, form]);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  // Handle header upload
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeaderFile(file);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setHeaderPreview(previewUrl);
    }
  };

  // Username availability check
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return true; // Skip check if too short
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', currentUser?.id || '') // Don't check against current user
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
  };

  const handleNextStep = () => {
    // Validate current step before moving to next
    if (currentStep === 0) {
      // Validate username and display name
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
      
      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${currentUser.id}/avatar_${Date.now()}.${fileExt}`;
        
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);
          
        if (avatarError) throw avatarError;
        
        // Get public URL
        const { data: avatarUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        avatarUrl = avatarUrlData.publicUrl;
      }
      
      // Upload header if selected
      if (headerFile) {
        const fileExt = headerFile.name.split('.').pop();
        const filePath = `${currentUser.id}/header_${Date.now()}.${fileExt}`;
        
        const { data: headerData, error: headerError } = await supabase.storage
          .from('profiles')
          .upload(filePath, headerFile);
          
        if (headerError) throw headerError;
        
        // Get public URL
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
      toast.error('Failed to upload images');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileSetupFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Upload profile images first
      const { avatarUrl, headerUrl } = await uploadImages();
      
      // Prepare the data for API
      const profileData: Partial<UserType> = {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || '',
        avatarUrl,
        headerUrl,
      };
      
      // Send to API - using the server endpoint for profile setup
      await userService.setupProfile(profileData);
      
      // Show success message
      toast.success('Profilinställning klar!', {
        description: 'Välkommen till KryptoSphere!',
      });
      
      // Refresh user data
      await refetchCurrentUser();
      
      // Viktigt: markera profilen som uppdaterad i localStorage för att undvika loop
      localStorage.setItem('profile_setup_complete', 'true');
      
      // Redirect to profile page - med en kort fördröjning för att säkerställa att data är uppdaterad
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Profilinställning misslyckades', {
        description: 'Vänligen försök igen.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const isLoggedIn = authService.isLoggedIn();
      
      if (!isLoggedIn) {
        toast.error('Du måste vara inloggad', {
          description: 'Du måste ansluta din wallet för att fortsätta.',
        });
        navigate('/', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (isLoadingCurrentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-crypto-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background rounded-lg shadow-sm border">
      {/* Progress Indicator */}
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
                <p className="text-muted-foreground mt-2">Välj hur du vill visas på KryptoSphere</p>
              </div>
              
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
                          onChange={(e) => {
                            field.onChange(e);
                            checkUsernameAvailability(e.target.value);
                          }}
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
                {/* Avatar Upload */}
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
                        onChange={handleAvatarChange}
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
                
                {/* Header Upload */}
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
                      onChange={handleHeaderChange}
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
                  disabled={isSubmitting || isUploading}
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
