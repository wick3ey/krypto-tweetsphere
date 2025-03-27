
-- Create the nonce_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nonce_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  nonce TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to get a nonce for a wallet address
CREATE OR REPLACE FUNCTION public.get_nonce(wallet_addr TEXT)
RETURNS TABLE (nonce TEXT, message TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT nc.nonce, nc.message
  FROM public.nonce_challenges nc
  WHERE nc.wallet_address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a nonce for a wallet address
CREATE OR REPLACE FUNCTION public.create_nonce(wallet_addr TEXT, nonce_value TEXT, message_text TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.nonce_challenges (wallet_address, nonce, message)
  VALUES (wallet_addr, nonce_value, message_text)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    nonce = nonce_value,
    message = message_text,
    created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add increment_comment_count function if it doesn't exist
CREATE OR REPLACE FUNCTION public.increment_comment_count(tweet_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tweets
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = tweet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

