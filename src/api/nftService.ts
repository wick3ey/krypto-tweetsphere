
import apiClient from './apiClient';

export const nftService = {
  getMarketplace: async (filters?: any) => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/nfts/marketplace', { params: filters });
    return response.data;
  },
  
  getTrending: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/nfts/trending');
    return response.data;
  },
  
  getUserNFTs: async (identifier: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/nfts/user/${identifier}`);
    return response.data;
  },
  
  getNFTDetails: async (id: string) => {
    const response = await apiClient.get(`https://f3oci3ty.xyz/api/nfts/${id}`);
    return response.data;
  },
  
  getPersonalGallery: async () => {
    const response = await apiClient.get('https://f3oci3ty.xyz/api/nfts/gallery');
    return response.data;
  },
  
  syncNFTs: async () => {
    const response = await apiClient.post('https://f3oci3ty.xyz/api/nfts/sync');
    return response.data;
  },
  
  listNFT: async (id: string, price: number) => {
    const response = await apiClient.post(`https://f3oci3ty.xyz/api/nfts/${id}/list`, { price });
    return response.data;
  },
  
  unlistNFT: async (id: string) => {
    const response = await apiClient.post(`https://f3oci3ty.xyz/api/nfts/${id}/unlist`);
    return response.data;
  },
  
  buyNFT: async (id: string) => {
    const response = await apiClient.post(`https://f3oci3ty.xyz/api/nfts/${id}/buy`);
    return response.data;
  },
};
