
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { dbUserToUser } from '@/lib/db-types';

// Define response type for get_nonce function
interface NonceResponse {
  nonce: string;
  message: string;
}

// Authentication states
const AUTH_KEYS = {
  TOKEN: 'jwt_token',
  WALLET: 'wallet_address',
  USER: 'current_user'
};

export const authService = {
  async getNonce(walletAddress: string) {
    try {
      console.log('Getting nonce for wallet address:', walletAddress);
      // Call the get_nonce function to get a challenge
      const { data, error } = await supabase
        .rpc('get_nonce', { wallet_addr: walletAddress });

      if (error || !data) {
        console.error('Error getting nonce:', error);
        // Create a new nonce if we couldn't get one
        const nonce = Math.floor(Math.random() * 1000000).toString();
        const message = `Sign this message to verify your wallet ownership: ${nonce}`;
        
        const { error: insertError } = await supabase
          .rpc('create_nonce', { 
            wallet_addr: walletAddress,
            nonce_value: nonce,
            message_text: message
          });
          
        if (insertError) {
          console.error('Error creating nonce:', insertError);
          throw new Error('Failed to generate authentication challenge');
        }
        
        return { nonce, message };
      }
      
      // Safely typecast data to get nonce and message
      const typedData = data as NonceResponse;
      console.log('Successfully got nonce message:', typedData.message);
      return { nonce: typedData.nonce, message: typedData.message };
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw new Error('Failed to generate authentication challenge');
    }
  },

  async verifySignature(walletAddress: string, signature: string, message: string = '') {
    try {
      console.log('Verifying signature for wallet:', walletAddress);
      
      // Clear any existing auth data
      this.clearAuthData();
      
      // Call the Supabase Edge Function to verify the signature
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-wallet-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Verification API error:', errorData);
        throw new Error(errorData.error || 'Signature verification failed');
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No authentication token received');
      }
      
      // Store auth data
      localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
      localStorage.setItem(AUTH_KEYS.WALLET, walletAddress);
      
      // Store user data
      const user = dbUserToUser(data.user);
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
      
      console.log('Authentication successful, user:', user.username);
      
      // Also set Supabase session
      await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: '',
      });
      
      return { 
        user, 
        isNewUser: data.isNewUser, 
        needsProfileSetup: data.needsProfileSetup 
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      this.clearAuthData();
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const token = localStorage.getItem(AUTH_KEYS.TOKEN);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get the user's wallet address
      const walletAddress = localStorage.getItem(AUTH_KEYS.WALLET);
      
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }
      
      // Try to get user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user from database:', error);
        
        // Get user data from localStorage as a fallback
        const storedUser = localStorage.getItem(AUTH_KEYS.USER);
        
        if (storedUser) {
          try {
            return JSON.parse(storedUser);
          } catch (e) {
            console.error('Error parsing stored user:', e);
            throw new Error('Failed to get user data');
          }
        }
        
        throw new Error('User not found');
      }
      
      if (!data) {
        throw new Error('User not found');
      }
      
      // Convert to application User type
      const user = dbUserToUser(data);
      
      // Update cached user
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },
  
  isLoggedIn(): boolean {
    return !!localStorage.getItem(AUTH_KEYS.TOKEN);
  },
  
  async checkProfileSetup(): Promise<boolean> {
    try {
      if (!this.isLoggedIn()) {
        return false;
      }
      
      const user = await this.getCurrentUser();
      
      // Check if profile setup is needed
      return !user.username || 
             user.username.startsWith('user_') || 
             !user.displayName || 
             user.displayName === 'New User';
    } catch (error) {
      console.error('Error checking profile setup:', error);
      return false;
    }
  },

  async logout() {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      this.clearAuthData();
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear local storage even if there's an error
      this.clearAuthData();
      throw error;
    }
  },
  
  clearAuthData() {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.WALLET);
    localStorage.removeItem(AUTH_KEYS.USER);
  }
};
