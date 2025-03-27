
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const nftService = {
  getMarketplace: async (filters?: any) => {
    try {
      let query = supabase
        .from('nfts')
        .select('*, owner:owner_id(*)')
        .eq('listed', true);
        
      // Tillämpa filter om de tillhandahålls
      if (filters) {
        if (filters.minPrice) {
          query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
          query = query.lte('price', filters.maxPrice);
        }
        if (filters.collection) {
          query = query.eq('collection_name', filters.collection);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      return [];
    }
  },
  
  getTrending: async () => {
    try {
      // Hämta senast listade NFTs som trendande
      const { data, error } = await supabase
        .from('nfts')
        .select('*, owner:owner_id(*)')
        .eq('listed', true)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trending NFTs:', error);
      return [];
    }
  },
  
  getUserNFTs: async (identifier: string) => {
    try {
      // Kontrollera om identifier ser ut som en UUID (antag att UUID är 36 tecken lång)
      let userId = identifier;
      
      if (identifier.length !== 36) {
        // Identifieraren är inte en UUID, så vi måste hämta användar-ID baserat på andra parametrar
        let userQuery = supabase.from('users').select('id');
        
        if (identifier.startsWith('0x')) {
          // Det är en wallet-adress
          userQuery = userQuery.eq('wallet_address', identifier);
        } else {
          // Det är ett användarnamn
          userQuery = userQuery.eq('username', identifier);
        }
        
        const { data: userData, error: userError } = await userQuery.maybeSingle();
        
        if (userError || !userData) {
          throw new Error('Användare hittades inte');
        }
        
        userId = userData.id;
      }
      
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_id', userId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  },
  
  getNFTDetails: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*, owner:owner_id(*)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      return null;
    }
  },
  
  getPersonalGallery: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_id', currentUserId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching personal gallery:', error);
      return [];
    }
  },
  
  syncNFTs: async () => {
    // Detta är en platshållare - i en verklig implementation skulle detta
    // anropa en edge-funktion som synkroniserar med en blockchain
    toast.info('NFT-synkronisering', {
      description: 'Denna funktion är under utveckling'
    });
    return { success: true };
  },
  
  listNFT: async (id: string, price: number) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          listed: true,
          price: price
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('NFT listad för försäljning');
      return data;
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Kunde inte lista NFT för försäljning');
      throw error;
    }
  },
  
  unlistNFT: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          listed: false,
          price: null
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('NFT borttagen från försäljning');
      return data;
    } catch (error) {
      console.error('Error unlisting NFT:', error);
      toast.error('Kunde inte ta bort NFT från försäljning');
      throw error;
    }
  },
  
  buyNFT: async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      // Hämta NFT-information
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .select('*, owner:owner_id(*)')
        .eq('id', id)
        .single();
        
      if (nftError || !nftData) {
        throw new Error('NFT hittades inte');
      }
      
      if (nftData.owner_id === currentUserId) {
        throw new Error('Du kan inte köpa din egen NFT');
      }
      
      if (!nftData.listed) {
        throw new Error('Denna NFT är inte till salu');
      }
      
      // I ett verkligt scenario skulle detta innebära blockchain-transaktioner
      // För nu simulerar vi köpet genom att uppdatera ägaren
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          owner_id: currentUserId,
          listed: false,
          price: null 
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Skapa en transaktion
      await supabase
        .from('transactions')
        .insert({
          user_id: currentUserId,
          type: 'buy',
          amount: nftData.price,
          token: 'ETH',
          token_symbol: 'ETH',
          token_logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
          status: 'completed',
          hash: `nft_purchase_${Date.now()}`,
          to_address: currentUserId,
          from_address: nftData.owner_id
        });
        
      // Skapa notifikationer
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: currentUserId,
            type: 'nft_bought',
            content: `Du köpte ${nftData.name} för ${nftData.price} ETH`,
            related_id: id
          },
          {
            user_id: nftData.owner_id,
            type: 'nft_sold',
            content: `Din NFT ${nftData.name} såldes för ${nftData.price} ETH`,
            related_id: id
          }
        ]);
        
      toast.success('NFT köpt framgångsrikt');
      return data;
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      toast.error('Kunde inte köpa NFT', {
        description: error.message || 'Ett fel uppstod'
      });
      throw error;
    }
  }
};
