
import { supabase } from '@/integrations/supabase/client';
import { TokenBalance, Transaction, PnLData } from '@/lib/types';

export const cryptoService = {
  getSupportedTokens: async () => {
    try {
      // För denna demo, returnera en hårdkodad lista av stödda tokens
      // I en verklig implementation skulle detta hämta från en tabell i Supabase
      return [
        { symbol: 'ETH', name: 'Ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
        { symbol: 'BTC', name: 'Bitcoin', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
        { symbol: 'SOL', name: 'Solana', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
        { symbol: 'USDC', name: 'USD Coin', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
        { symbol: 'USDT', name: 'Tether', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }
      ];
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return [];
    }
  },
  
  getTokenPrice: async (symbol: string) => {
    try {
      // För denna demo, returnera simulerade priser
      // I en verklig implementation skulle detta hämta från en extern API
      const prices: Record<string, any> = {
        'ETH': { price: 3500 + Math.random() * 200, change24h: Math.random() * 10 - 5 },
        'BTC': { price: 58000 + Math.random() * 1000, change24h: Math.random() * 8 - 4 },
        'SOL': { price: 140 + Math.random() * 20, change24h: Math.random() * 15 - 7 },
        'USDC': { price: 1 + Math.random() * 0.01 - 0.005, change24h: Math.random() * 0.2 - 0.1 },
        'USDT': { price: 1 + Math.random() * 0.01 - 0.005, change24h: Math.random() * 0.2 - 0.1 }
      };
      
      return prices[symbol] || { price: 0, change24h: 0 };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return { price: 0, change24h: 0 };
    }
  },
  
  getBalance: async () => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över balance fetch");
        return { balance: 0 };
      }
      
      // Hämta alla token-balancer och summera dem
      const { data, error } = await supabase
        .from('token_balances')
        .select('value_usd')
        .eq('user_id', currentUserId);
        
      if (error) throw error;
      
      const totalBalance = data?.reduce((sum, token) => sum + (token.value_usd || 0), 0) || 0;
      return { balance: totalBalance };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return { balance: 0 };
    }
  },
  
  getTokenBalances: async () => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över token balances fetch");
        return [];
      }
      
      const { data, error } = await supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', currentUserId);
        
      if (error) throw error;
      
      // Omvandla data till TokenBalance-format
      return (data || []).map((token): TokenBalance => ({
        token: token.token,
        symbol: token.symbol,
        amount: token.amount,
        valueUSD: token.value_usd,
        logo: token.logo || '',
        change24h: token.change_24h || 0
      }));
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  },
  
  getTransactions: async (type?: string) => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över transactions fetch");
        return [];
      }
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false });
        
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Omvandla data till Transaction-format
      return (data || []).map((tx): Transaction => ({
        id: tx.id,
        type: tx.type as any,
        amount: tx.amount,
        token: tx.token,
        tokenSymbol: tx.token_symbol,
        tokenLogo: tx.token_logo || '',
        timestamp: tx.timestamp,
        status: tx.status as any,
        hash: tx.hash || '',
        fee: tx.fee
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },
  
  getPnL: async (period: string = '7d') => {
    try {
      // Kontrollera om användaren är autentiserad
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("Användare inte autentiserad, hoppar över PnL data fetch");
        return [];
      }
      
      // För denna demo, returnera simulerade PnL-data
      // I en verklig implementation skulle detta beräknas från transaktioner och prishistorik
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
      const result: PnLData[] = [];
      
      let baseValue = 10000;
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        
        // Simulera en värdeförändring
        const change = (Math.random() * 400) - 200;
        baseValue += change;
        
        result.push({
          date: date.toISOString().split('T')[0],
          value: baseValue,
          change: change,
          changePercent: (change / (baseValue - change)) * 100
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching PnL data:', error);
      return [];
    }
  },
  
  transferCrypto: async (to: string, amount: number, token: string, memo?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      // I ett verkligt scenario skulle detta anropa en edge-funktion som utför blockchain-transaktionen
      // För nu, simulera en lyckad transaktion genom att skapa ett transaktionsobjekt
      
      // Hämta token-information
      const tokenInfo = await cryptoService.getTokenPrice(token);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUserId,
          type: 'transfer',
          amount: amount,
          token: token,
          token_symbol: token,
          token_logo: `https://cryptologos.cc/logos/${token.toLowerCase()}-${token.toLowerCase()}-logo.png`,
          status: 'completed',
          hash: `tx_${Date.now()}`,
          to_address: to,
          fee: 0.001
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Uppdatera token-balansen
      await cryptoService.updateTokenBalance(currentUserId, token, -amount, tokenInfo.price);
      
      return data;
    } catch (error) {
      console.error('Error transferring crypto:', error);
      throw error;
    }
  },
  
  buyCrypto: async (token: string, amount: number, paymentMethod?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      // Hämta token-information
      const tokenInfo = await cryptoService.getTokenPrice(token);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUserId,
          type: 'buy',
          amount: amount,
          token: token,
          token_symbol: token,
          token_logo: `https://cryptologos.cc/logos/${token.toLowerCase()}-${token.toLowerCase()}-logo.png`,
          status: 'completed',
          hash: `buy_${Date.now()}`
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Uppdatera token-balansen
      await cryptoService.updateTokenBalance(currentUserId, token, amount, tokenInfo.price);
      
      return data;
    } catch (error) {
      console.error('Error buying crypto:', error);
      throw error;
    }
  },
  
  sellCrypto: async (token: string, amount: number, payoutMethod?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      // Hämta token-information
      const tokenInfo = await cryptoService.getTokenPrice(token);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUserId,
          type: 'sell',
          amount: amount,
          token: token,
          token_symbol: token,
          token_logo: `https://cryptologos.cc/logos/${token.toLowerCase()}-${token.toLowerCase()}-logo.png`,
          status: 'completed',
          hash: `sell_${Date.now()}`
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Uppdatera token-balansen
      await cryptoService.updateTokenBalance(currentUserId, token, -amount, tokenInfo.price);
      
      return data;
    } catch (error) {
      console.error('Error selling crypto:', error);
      throw error;
    }
  },
  
  swapTokens: async (fromToken: string, toToken: string, amount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        throw new Error('Användare är inte inloggad');
      }
      
      // Hämta token-information
      const fromTokenInfo = await cryptoService.getTokenPrice(fromToken);
      const toTokenInfo = await cryptoService.getTokenPrice(toToken);
      
      // Beräkna konverteringsbeloppet baserat på priserna
      const toAmount = (amount * fromTokenInfo.price) / toTokenInfo.price;
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUserId,
          type: 'swap',
          amount: amount,
          token: `${fromToken}/${toToken}`,
          token_symbol: fromToken,
          token_logo: `https://cryptologos.cc/logos/${fromToken.toLowerCase()}-${fromToken.toLowerCase()}-logo.png`,
          status: 'completed',
          hash: `swap_${Date.now()}`
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Uppdatera token-balanserna
      await cryptoService.updateTokenBalance(currentUserId, fromToken, -amount, fromTokenInfo.price);
      await cryptoService.updateTokenBalance(currentUserId, toToken, toAmount, toTokenInfo.price);
      
      return {
        ...data,
        toAmount,
        toToken
      };
    } catch (error) {
      console.error('Error swapping tokens:', error);
      throw error;
    }
  },
  
  // Hjälpfunktion för att uppdatera token-balanser
  updateTokenBalance: async (userId: string, token: string, amountChange: number, price: number) => {
    try {
      // Kontrollera om token-balans redan finns
      const { data: existingBalance, error: fetchError } = await supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('token', token)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (existingBalance) {
        // Uppdatera befintlig balans
        const newAmount = existingBalance.amount + amountChange;
        const newValueUsd = newAmount * price;
        
        const { error: updateError } = await supabase
          .from('token_balances')
          .update({
            amount: newAmount,
            value_usd: newValueUsd,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBalance.id);
          
        if (updateError) throw updateError;
      } else if (amountChange > 0) {
        // Skapa en ny balans endast om ändringsbeloppet är positivt
        const { error: insertError } = await supabase
          .from('token_balances')
          .insert({
            user_id: userId,
            token: token,
            symbol: token,
            amount: amountChange,
            value_usd: amountChange * price,
            logo: `https://cryptologos.cc/logos/${token.toLowerCase()}-${token.toLowerCase()}-logo.png`,
            change_24h: 0
          });
          
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating token balance:', error);
      throw error;
    }
  }
};
