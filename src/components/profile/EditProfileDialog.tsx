
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: User;
  onProfileUpdated: (profile: User) => void;
}

const EditProfileDialog = ({ 
  open, 
  onOpenChange, 
  profile, 
  onProfileUpdated 
}: EditProfileDialogProps) => {
  const { updateProfile, isUpdatingProfile } = useUser();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [headerUrl, setHeaderUrl] = useState(profile?.headerUrl || '');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Very basic validation
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    // TODO: Handle file uploads for avatar and header images
    // For now, we're just using the URLs
    
    const updatedProfile: Partial<User> = {
      displayName,
      username,
      bio,
      avatarUrl,
      headerUrl
    };
    
    updateProfile(updatedProfile, {
      onSuccess: (data) => {
        onProfileUpdated(data);
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update profile', {
          description: error.message
        });
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" type="button" className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      // Create a temp URL for preview
                      setAvatarUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                <Camera className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="header">Header Image</Label>
            <div className="relative h-32 w-full bg-secondary/50 rounded-lg overflow-hidden">
              {headerUrl && (
                <img 
                  src={headerUrl} 
                  alt="Header" 
                  className="w-full h-full object-cover"
                />
              )}
              <Button 
                variant="outline" 
                type="button" 
                className="absolute bottom-2 right-2 bg-background/80"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setHeaderFile(file);
                      // Create a temp URL for preview
                      setHeaderUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                <Camera className="h-4 w-4 mr-2" />
                Upload Header
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              maxLength={15}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={160}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdatingProfile}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
