-- Stats System Fix - Version 2 (Fixed for profiles without email column)
-- Date: 2024-12-23

-- PART 1: Public stats table
CREATE TABLE IF NOT EXISTS public.site_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  users_count INTEGER NOT NULL DEFAULT 0,
  online_count INTEGER NOT NULL DEFAULT 0,
  backgrounds_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_stats (id, users_count, online_count)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read stats" ON public.site_stats;
CREATE POLICY "Anyone can read stats" ON public.site_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can update stats" ON public.site_stats;
CREATE POLICY "Service can update stats" ON public.site_stats
  FOR UPDATE USING (false);

-- PART 2: Auto-update users_count trigger
CREATE OR REPLACE FUNCTION update_users_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.site_stats 
    SET 
      users_count = users_count + 1,
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.site_stats 
    SET 
      users_count = GREATEST(0, users_count - 1),
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_users_count ON profiles;
CREATE TRIGGER trigger_update_users_count
  AFTER INSERT OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_users_count();

-- PART 3: Online count functions
CREATE OR REPLACE FUNCTION recalculate_online_count()
RETURNS INTEGER AS $$
DECLARE
  online_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO online_count
  FROM user_presence
  WHERE last_seen >= NOW() - INTERVAL '2 minutes';
  
  UPDATE public.site_stats
  SET 
    online_count = online_count,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN online_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_online_count()
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO result
  FROM user_presence
  WHERE last_seen >= NOW() - INTERVAL '2 minutes';
  
  RETURN GREATEST(result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_online_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_online_count() TO authenticated;

-- PART 4: Fix RLS for user_presence
DROP POLICY IF EXISTS "Anyone can read presence" ON user_presence;

CREATE POLICY "Users can read own presence" ON user_presence
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own presence" ON user_presence;
CREATE POLICY "Users can upsert own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PART 5: Auto-create profiles trigger (WITHOUT email column)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert only id and timestamps, no email
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- PART 6: Backfill existing users (WITHOUT email)
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT 
  au.id,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Update initial users count
UPDATE public.site_stats
SET users_count = (SELECT COUNT(*) FROM public.profiles WHERE NOT COALESCE(is_deleted, false))
WHERE id = 1;

-- PART 7: Main stats function
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
  users_count INTEGER,
  online_count INTEGER,
  backgrounds_count INTEGER,
  videos_count INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.users_count,
    (SELECT COUNT(*)::INTEGER FROM user_presence WHERE last_seen >= NOW() - INTERVAL '2 minutes'),
    s.backgrounds_count,
    s.videos_count,
    s.updated_at
  FROM public.site_stats s
  WHERE s.id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_site_stats() TO anon, authenticated;

-- PART 8: Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen 
  ON user_presence(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_not_deleted 
  ON profiles(id) WHERE NOT COALESCE(is_deleted, false);

-- Done! Test with:
-- SELECT * FROM site_stats;
-- SELECT * FROM get_site_stats();
-- SELECT get_online_count();

