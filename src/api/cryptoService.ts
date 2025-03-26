
import apiClient from './apiClient';

export const cryptoService = {
  getSupportedTokens: async () => {
    try {
      const response = await apiClient.get('https://f3oci3ty.xyz/api/crypto/supported-tokens');
      return response.data;
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return [];
    }
  },
  
  getTokenPrice: async (symbol: string) => {
    try {
      const response = await apiClient.get(`https://f3oci3ty.xyz/api/crypto/price/${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return { price: 0, change24h: 0 };
    }
  },
  
  getBalance: async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping balance fetch");
        return { balance: 0 };
      }
      
      const response = await apiClient.get('https://f3oci3ty.xyz/api/crypto/balance');
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn("Authentication token expired or invalid");
      }
      console.error('Error fetching balance:', error);
      return { balance: 0 };
    }
  },
  
  getTokenBalances: async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping token balances fetch");
        return [];
      }
      
      const response = await apiClient.get('https://f3oci3ty.xyz/api/crypto/tokens');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn("Authentication token expired or invalid");
      }
      console.error('Error fetching token balances:', error);
      return [];
    }
  },
  
  getTransactions: async (type?: string) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping transactions fetch");
        return [];
      }
      
      const response = await apiClient.get('https://f3oci3ty.xyz/api/crypto/transactions', {
        params: type ? { type } : undefined
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn("Authentication token expired or invalid");
      }
      console.error('Error fetching transactions:', error);
      return [];
    }
  },
  
  getPnL: async (period: string = '7d') => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.log("User not authenticated, skipping PnL data fetch");
        return [];
      }
      
      const response = await apiClient.get('https://f3oci3ty.xyz/api/crypto/pnl', { 
        params: { period } 
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn("Authentication token expired or invalid");
      }
      console.error('Error fetching PnL data:', error);
      return [];
    }
  },
  
  transferCrypto: async (to: string, amount: number, token: string, memo?: string) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/crypto/transfer', { 
        toAddress: to, 
        amount, 
        token,
        memo 
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring crypto:', error);
      throw error;
    }
  },
  
  buyCrypto: async (token: string, amount: number, paymentMethod?: string) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/crypto/buy', { 
        token, 
        amount,
        paymentMethod 
      });
      return response.data;
    } catch (error) {
      console.error('Error buying crypto:', error);
      throw error;
    }
  },
  
  sellCrypto: async (token: string, amount: number, payoutMethod?: string) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/crypto/sell', { 
        token, 
        amount,
        payoutMethod 
      });
      return response.data;
    } catch (error) {
      console.error('Error selling crypto:', error);
      throw error;
    }
  },
  
  swapTokens: async (fromToken: string, toToken: string, amount: number) => {
    try {
      const response = await apiClient.post('https://f3oci3ty.xyz/api/crypto/swap', { 
        fromToken, 
        toToken, 
        amount 
      });
      return response.data;
    } catch (error) {
      console.error('Error swapping tokens:', error);
      throw error;
    }
  },
};
