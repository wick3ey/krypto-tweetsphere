
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AtSign, Image, FileText, Smile, X, Pencil } from 'lucide-react';
import { currentUser } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ComposeDialogProps {
  onSubmit: (content: string) => void;
}

const ComposeDialog = ({ onSubmit }: ComposeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    onSubmit(content);
    setContent('');
    setIsOpen(false);
    
    toast({
      title: "Inlägget publicerat!",
      description: "Ditt inlägg har publicerats framgångsrikt.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isMobile ? (
          <Button 
            className="fixed right-4 bottom-24 md:hidden rounded-full h-14 w-14 shadow-lg z-20 bg-crypto-blue hover:bg-crypto-blue/90"
            onClick={() => setIsOpen(true)}
          >
            <Pencil className="h-6 w-6" />
          </Button>
        ) : (
          <div className="w-full">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-text" onClick={() => setIsOpen(true)}>
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.displayName} />
                <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
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
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.displayName} />
              <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
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
            <Button variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
              <Image className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
              <FileText className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
              <AtSign className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-crypto-blue h-9 w-9">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Button 
            className="rounded-full bg-crypto-blue hover:bg-crypto-blue/90 text-white"
            disabled={!content.trim()}
            onClick={handleSubmit}
          >
            Publicera
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeDialog;
