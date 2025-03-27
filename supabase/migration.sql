
-- Create the profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('profiles', 'profiles', true, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Set up a policy to allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Allow everyone to view profile pictures
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'profiles');
