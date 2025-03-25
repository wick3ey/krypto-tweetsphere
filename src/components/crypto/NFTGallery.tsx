
import { useState } from 'react';
import { Image, Rocket, Grid, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nfts = [
  {
    id: '1',
    name: 'Crypto Punk #3429',
    collection: 'CryptoPunks',
    imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto-punk-1',
    price: 32.5,
    currency: 'ETH',
  },
  {
    id: '2',
    name: 'Bored Ape #9821',
    collection: 'BAYC',
    imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=bored-ape-1',
    price: 85.2,
    currency: 'ETH',
  },
  {
    id: '3',
    name: 'Doodle #4291',
    collection: 'Doodles',
    imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=doodle-1',
    price: 9.8,
    currency: 'ETH',
  },
  {
    id: '4',
    name: 'Azuki #7123',
    collection: 'Azuki',
    imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=azuki-1',
    price: 15.3,
    currency: 'ETH',
  }
];

const NFTGallery = () => {
  const [activeNFT, setActiveNFT] = useState(nfts[0].id);
  
  return (
    <div className="crypto-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-crypto-blue" />
          <h3 className="font-semibold text-lg">Featured NFTs</h3>
        </div>
        
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
          <Grid className="h-3.5 w-3.5" />
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {nfts.map((nft) => (
          <div 
            key={nft.id}
            className={cn(
              "relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer",
              activeNFT === nft.id 
                ? "border-crypto-blue/50 shadow-md shadow-crypto-blue/20" 
                : "border-border/50 hover:border-border"
            )}
            onClick={() => setActiveNFT(nft.id)}
          >
            <div className="aspect-square overflow-hidden bg-muted/30">
              <img 
                src={nft.imageUrl} 
                alt={nft.name} 
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  activeNFT === nft.id ? "scale-110" : "scale-100"
                )}
              />
            </div>
            
            <div className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2",
              "transition-opacity duration-300",
              activeNFT === nft.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <p className="text-xs font-medium text-white truncate">{nft.name}</p>
              
              <div className="flex justify-between items-center mt-1">
                <Badge variant="outline" className="text-[10px] text-white border-white/20">
                  {nft.collection}
                </Badge>
                
                <p className="text-xs text-white flex items-center">
                  <span className="mr-1">{nft.price}</span>
                  <span className="text-crypto-blue">{nft.currency}</span>
                </p>
              </div>
            </div>
            
            {activeNFT === nft.id && (
              <Badge 
                className="absolute top-2 right-2 bg-crypto-blue text-white text-[10px] animate-pulse"
              >
                <Rocket className="h-3 w-3 mr-0.5" />
                Featured
              </Badge>
            )}
          </div>
        ))}
      </div>
      
      <Button variant="default" size="sm" className="w-full text-xs flex justify-center items-center gap-1">
        Explore NFT Marketplace
        <ExternalLink className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
};

export default NFTGallery;
