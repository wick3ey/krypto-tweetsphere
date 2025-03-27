
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { DbUser, DbTweet, DbComment } from '@/lib/db-types';

const SUPABASE_URL = "https://dtrlmfwgtjrjkepvgatv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cmxtZndndGpyamtlcHZnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNDM3NjUsImV4cCI6MjA1ODYxOTc2NX0.6nB2HwLdPQynPYowwoHVF17wG8G85sGXcu79AsOJe9g";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Define custom RPC types
type RPCFunctions = {
  follow_user: (args: { follower_id: string; followed_id: string }) => void;
  unfollow_user: (args: { follower_id: string; followed_id: string }) => void;
  get_nonce: (args: { wallet_addr: string }) => { nonce: string; message: string };
  create_nonce: (args: { wallet_addr: string; nonce_value: string; message_text: string }) => void;
  increment_comment_count: (args: { tweet_id: string }) => void;
  get_unread_messages_count: (args: { user_id: string }) => number;
  get_unread_notifications_count: (args: { user_id: string }) => number;
};

// Augment the SupabaseClient type with our RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc<FunctionName extends keyof RPCFunctions>(
      fn: FunctionName,
      args?: Parameters<RPCFunctions[FunctionName]>[0]
    ): Promise<{ data: ReturnType<RPCFunctions[FunctionName]> extends Promise<infer T> ? T : ReturnType<RPCFunctions[FunctionName]>; error: null } | { data: null; error: Error }>;
  }
}

// Type-safe table accessors
export const usersTable = () => supabase.from('users');
export const tweetsTable = () => supabase.from('tweets');
export const commentsTable = () => supabase.from('comments');

export type SupabaseClient = typeof supabase;
