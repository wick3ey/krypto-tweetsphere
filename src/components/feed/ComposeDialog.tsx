
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtSign, Image, FileText, Smile, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/api/authService';

interface ComposeDialogProps {
  onSubmit: (content: string) => Promise<void>;
}

const ComposeDialog = ({ onSubmit }: ComposeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get current user data for the avatar
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem('jwt_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("ComposeDialog: Submitting tweet with content:", content);
      await onSubmit(content);
      setContent('');
      setIsOpen(false);
      
      toast.success("Inlägget publicerat!", {
        description: "Ditt inlägg har publicerats framgångsrikt.",
      });
    } catch (error) {
      console.error("ComposeDialog: Error submitting tweet:", error);
      toast.error("Kunde inte publicera inlägg", {
        description: "Ett fel uppstod. Försök igen senare.",
      });
      // Don't close the dialog if there was an error, so user can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is authenticated - but don't require it for posting
  const isAuthenticated = !!localStorage.getItem('jwt_token');
  
  const handleTriggerClick = () => {
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setContent(''); // Clear content when dialog closes
      }
    }}>
      <DialogTrigger asChild>
        {isMobile ? (
          <Button 
            className="fixed right-4 bottom-24 md:hidden rounded-full h-14 w-14 shadow-lg z-20 bg-crypto-blue hover:bg-crypto-blue/90"
            onClick={handleTriggerClick}
          >
            <Pencil className="h-6 w-6" />
          </Button>
        ) : (
          <div className="w-full">
            <div 
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-text" 
              onClick={handleTriggerClick}
            >
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage 
                  src={currentUser?.profilePicture || "https://api.dicebear.com/7.x/identicon/svg?seed=user"} 
                  alt={currentUser?.displayName || "User"} 
                />
                <AvatarFallback>{(currentUser?.displayName || "U").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-muted-foreground text-base flex-1 font-medium">
                Vad händer i kryptovärlden?
              </div>
            </div>
          </div>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background border-border/50">
        <DialogHeader className="p-4 border-b border-border/30">
          <DialogTitle className="flex items-center justify-between">
            <span>Skapa inlägg</span>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Dela dina tankar om kryptomarknaden med andra
            {!isAuthenticated && (
              <span className="ml-1 text-crypto-blue">
                (För att spara dina inlägg permanent, anslut din plånbok)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage 
                  src={currentUser?.profilePicture || "https://api.dicebear.com/7.x/identicon/svg?seed=user"} 
                  alt={currentUser?.displayName || "User"} 
                />
                <AvatarFallback>{(currentUser?.displayName || "U").charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Textarea 
                  ref={textareaRef}
                  placeholder="Vad händer i kryptovärlden?"
                  className="min-h-[120px] border-none focus-visible:ring-0 resize-none text-base p-0 bg-transparent"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                
                {content.length > 0 && (
                  <div className="text-right text-sm text-muted-foreground mt-1">
                    {content.length}/280
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border-t border-border/30">
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
                <Image className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
                <FileText className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
                <AtSign className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            
            <Button 
              type="submit"
              className="rounded-full bg-crypto-blue hover:bg-crypto-blue/90 text-white"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? "Publicerar..." : "Publicera"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeDialog;
