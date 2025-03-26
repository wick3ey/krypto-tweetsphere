import React, { useState } from 'react';
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: '',
      displayName: '',
      bio: '',
    },
  });

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

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };

  const onSubmit = async (data: ProfileSetupFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would upload the image files to a server
      // and get back URLs. For this example, we'll simulate that.
      
      // Prepare the data for API
      const profileData: Partial<UserType> = {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || '',
        
        // Use avatarUrl instead of profileImage to match the User type
        avatarUrl: avatarPreview || 'https://f3oci3ty.xyz/placeholder-avatar.png',
        coverImage: headerPreview || undefined
      };
      
      // Send to API - using the server endpoint for profile setup
      await userService.setupProfile(profileData);
      
      // Show success message
      toast.success('Profile setup complete!', {
        description: 'Welcome to F3oci3ty!',
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Profile setup failed', {
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <span>Profile Info</span>
          <span>Photos</span>
          <span>Bio</span>
        </div>
      </div>
      
      <Form {...form}>
        <form>
          {currentStep === 0 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Set Up Your Profile</h1>
                <p className="text-muted-foreground mt-2">Choose how you'll appear on F3oci3ty</p>
              </div>
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-1">@</span>
                        <Input
                          placeholder="username"
                          {...field}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleNextStep}>
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Add Your Photos</h1>
                <p className="text-muted-foreground mt-2">Upload a profile picture and header image</p>
              </div>
              
              <div className="space-y-8">
                {/* Header Upload */}
                <div className="relative">
                  <FormLabel className="block mb-2">Header Image</FormLabel>
                  <div 
                    className={`h-36 rounded-lg overflow-hidden relative flex items-center justify-center bg-muted ${headerPreview ? 'bg-cover bg-center' : ''}`}
                    style={headerPreview ? { backgroundImage: `url(${headerPreview})` } : {}}
                  >
                    {!headerPreview && (
                      <div className="text-center">
                        <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-1">Add a header image</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeaderChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Avatar Upload */}
                <div>
                  <FormLabel className="block mb-2">Profile Picture</FormLabel>
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-background">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="Profile" />
                        ) : (
                          <AvatarFallback>
                            <User className="h-10 w-10" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
                        <Camera className="h-3.5 w-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Choose a profile picture</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload a clear photo to help people recognize you</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button onClick={handleNextStep}>
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">Tell Us About Yourself</h1>
                <p className="text-muted-foreground mt-2">Write a short bio to introduce yourself</p>
              </div>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between mt-1">
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/160
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
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
