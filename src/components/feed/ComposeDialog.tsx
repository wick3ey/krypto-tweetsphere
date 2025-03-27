import { useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/api/tweetService';
import { toast } from 'sonner';
import { X, Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyToTweetId?: string;
}

const ComposeDialog = ({ open, onOpenChange, replyToTweetId }: ComposeDialogProps) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  
  const { mutate: createTweet, isPending: isCreatingTweet } = useMutation({
    mutationFn: () => {
      return tweetService.createTweet(content);
    },
    onSuccess: () => {
      toast.success('Tweet skapad!');
      setContent('');
      setAttachments([]);
      setUploadedAttachments([]);
      setPreviewVisible(false);
      setPreviewContent('');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['userTweets', currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error('Kunde inte skapa tweet', {
        description: error.message || 'Försök igen senare.'
      });
    }
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setAttachments([...attachments, ...files]);
      
      setUploading(true);
      try {
        const uploadedUrls: string[] = [];
        
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${currentUser?.id}/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from('tweets')
            .upload(filePath, file);
            
          if (error) {
            throw error;
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('tweets')
            .getPublicUrl(filePath);
            
          uploadedUrls.push(publicUrlData.publicUrl);
        }
        
        setUploadedAttachments([...uploadedAttachments, ...uploadedUrls]);
        setPreviewVisible(true);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Kunde inte ladda upp bilden');
      } finally {
        setUploading(false);
      }
    }
  };
  
  const handleRemoveAttachment = async (index: number) => {
    try {
      const newAttachments = [...attachments];
      const newUploadedAttachments = [...uploadedAttachments];
      
      if (uploadedAttachments[index]) {
        const url = uploadedAttachments[index];
        const path = url.split('tweets/')[1];
        
        if (path) {
          await supabase.storage.from('tweets').remove([path]);
        }
      }
      
      newAttachments.splice(index, 1);
      newUploadedAttachments.splice(index, 1);
      
      setAttachments(newAttachments);
      setUploadedAttachments(newUploadedAttachments);
      
      if (newAttachments.length === 0) {
        setPreviewVisible(false);
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast.error('Kunde inte ta bort bilden');
    }
  };
  
  const handleSubmit = async () => {
    if (content.trim() === '' && uploadedAttachments.length === 0) {
      toast.error('Du måste skriva något eller lägga till en bild!');
      return;
    }
    
    createTweet();
  };
  
  const handlePreview = () => {
    setPreviewContent(content);
    setPreviewVisible(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="relative">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="text-lg font-medium">Skapa inlägg</DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || 'anonymous'}`} />
                <AvatarFallback>
                  {currentUser?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Textarea
                  placeholder="Vad händer?"
                  value={content}
                  onChange={handleInputChange}
                  className="w-full h-24 resize-none border-none focus-visible:ring-0 shadow-none"
                />
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <Input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleAddAttachment}
                      className="hidden"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="ghost" size="icon" asChild disabled={uploading}>
                        <span><Paperclip className="h-5 w-5" /></span>
                      </Button>
                    </label>
                    {uploading && <span className="text-xs text-muted-foreground ml-2">Laddar upp...</span>}
                  </div>
                  
                  <Button onClick={handleSubmit} disabled={isCreatingTweet || uploading}>
                    {isCreatingTweet ? 'Skapar...' : 'Skapa'}
                  </Button>
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="p-4 pt-0">
            {uploadedAttachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Attachment ${index + 1}`} 
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveAttachment(index)}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {previewContent && (
              <Card className="mt-4 overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.username || 'anonymous'}`} />
                      <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-bold">{currentUser?.displayName || 'Anonym'}</span>
                        <span className="text-muted-foreground">@{currentUser?.username || 'anonym'}</span>
                      </div>
                      <p className="text-sm mt-1">{previewContent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeDialog;
