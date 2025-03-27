
CREATE OR REPLACE FUNCTION public.handle_new_google_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    joined_date,
    following,
    followers,
    verified
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '/lovable-uploads/116624cf-7316-4305-8889-76c511a80aca.png'),
    'Hey there!',
    now(),
    '{}',
    '{}',
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', users.display_name),
    avatar_url = COALESCE(users.avatar_url, '/lovable-uploads/116624cf-7316-4305-8889-76c511a80aca.png');

  RETURN NEW;
END;
$function$;
