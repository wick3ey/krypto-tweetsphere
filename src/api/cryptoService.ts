
import apiClient from './apiClient';

export const cryptoService = {
  getSupportedTokens: async () => {
    const response = await apiClient.get('/crypto/supported-tokens');
    return response.data;
  },
  
  getTokenPrice: async (symbol: string) => {
    const response = await apiClient.get(`/crypto/price/${symbol}`);
    return response.data;
  },
  
  getBalance: async () => {
    const response = await apiClient.get('/crypto/balance');
    return response.data;
  },
  
  getTokenBalances: async () => {
    const response = await apiClient.get('/crypto/tokens');
    return response.data;
  },
  
  getTransactions: async (type?: string) => {
    const response = await apiClient.get('/crypto/transactions', {
      params: type ? { type } : undefined
    });
    return response.data;
  },
  
  getPnL: async (period: string = '7d') => {
    const response = await apiClient.get('/crypto/pnl', { params: { period } });
    return response.data;
  },
  
  transferCrypto: async (to: string, amount: number, token: string) => {
    const response = await apiClient.post('/crypto/transfer', { to, amount, token });
    return response.data;
  },
  
  buyCrypto: async (token: string, amount: number) => {
    const response = await apiClient.post('/crypto/buy', { token, amount });
    return response.data;
  },
  
  sellCrypto: async (token: string, amount: number) => {
    const response = await apiClient.post('/crypto/sell', { token, amount });
    return response.data;
  },
  
  swapTokens: async (fromToken: string, toToken: string, amount: number) => {
    const response = await apiClient.post('/crypto/swap', { fromToken, toToken, amount });
    return response.data;
  },
};
