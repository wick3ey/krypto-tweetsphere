import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { dbUserToUser } from '@/lib/db-types';

// Define response type for get_nonce function
interface NonceResponse {
  nonce: string;
  message: string;
}

export const authService = {
  async getNonce(walletAddress: string) {
    try {
      // We'll use a raw query here since nonce_challenges isn't in our type definitions
      const { data, error } = await supabase
        .rpc('get_nonce', { wallet_addr: walletAddress });

      if (error) {
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
          return { nonce: '', message: '' };
        }
        
        return { nonce, message };
      }
      
      // Safely typecast data to get nonce and message
      const typedData = data as NonceResponse;
      return { nonce: typedData.nonce, message: typedData.message };
    } catch (error) {
      console.error('Error getting nonce:', error);
      return { nonce: '', message: '' };
    }
  },

  async verifySignature(walletAddress: string, signature: string) {
    try {
      // In a real implementation, verify the signature against the nonce
      // For now, we'll simulate a successful verification
      
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (userError) throw userError;
      
      let isNewUser = false;
      let userId = existingUser?.id;
      
      // If user doesn't exist, create a placeholder
      if (!existingUser) {
        isNewUser = true;
        
        // Generate a temporary username from wallet address
        const tempUsername = `user_${walletAddress.substring(0, 8).toLowerCase()}`;
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress,
            username: tempUsername,
            display_name: 'New User',
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        userId = newUser.id;
      }
      
      // Get Supabase session
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@phantom.wallet`,
        password: signature.substring(0, 20),  // Use part of signature as password
      });
      
      if (error) {
        // If user doesn't exist in auth, sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress}@phantom.wallet`,
          password: signature.substring(0, 20),
          options: {
            data: {
              wallet_address: walletAddress,
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Store session in local storage
        localStorage.setItem('jwt_token', signUpData.session?.access_token || '');
      } else {
        // Store session in local storage
        localStorage.setItem('jwt_token', data.session?.access_token || '');
      }
      
      // Store wallet address
      localStorage.setItem('wallet_address', walletAddress);
      
      // Get full user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Convert to application User type
      const user = dbUserToUser(userData);
      
      // Store user data
      localStorage.setItem('current_user', JSON.stringify(user));
      
      return { user, isNewUser };
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get user data from localStorage as a fallback
      const storedUser = localStorage.getItem('current_user');
      let cachedUser: User | null = null;
      
      if (storedUser) {
        try {
          cachedUser = JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // Get the user's wallet address
      const walletAddress = localStorage.getItem('wallet_address');
      
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }
      
      // Fetch the latest user data from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        // If no data found, return cached user or throw error
        if (cachedUser) return cachedUser;
        throw new Error('User not found');
      }
      
      // Convert to application User type
      const user = dbUserToUser(data);
      
      // Update cached user
      localStorage.setItem('current_user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('current_user');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
};
