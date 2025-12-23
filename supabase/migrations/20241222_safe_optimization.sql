-- ============================================================================
-- D MOTION - БЕЗОПАСНАЯ ОПТИМИЗАЦИЯ (только проверенные таблицы)
-- ============================================================================

-- ============================================================================
-- 1. ИНДЕКСЫ ДЛЯ PROFILES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_author ON profiles(is_author) WHERE is_author = true;

-- ============================================================================
-- 2. ДОБАВЛЕНИЕ КОЛОНОК ДЛЯ СЧЁТЧИКОВ В PROFILES
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ============================================================================
-- 3. RLS ДЛЯ PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 4. ФУНКЦИЯ ДЛЯ ПОДПИСЧИКОВ
-- ============================================================================
CREATE OR REPLACE FUNCTION update_author_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ТРИГГЕР ДЛЯ ПОДПИСЧИКОВ
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_author_followers_count ON author_followers;
CREATE TRIGGER trigger_author_followers_count
AFTER INSERT OR DELETE ON author_followers
FOR EACH ROW EXECUTE FUNCTION update_author_followers_count();

-- ============================================================================
-- 6. RLS ДЛЯ AUTHOR_FOLLOWERS
-- ============================================================================
ALTER TABLE author_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view followers" ON author_followers;
DROP POLICY IF EXISTS "Users can manage own follows" ON author_followers;
CREATE POLICY "Anyone can view followers" ON author_followers FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON author_followers FOR ALL USING (auth.uid() = follower_id);

-- ============================================================================
-- 7. RLS ДЛЯ USER_PRESENCE
-- ============================================================================
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
CREATE POLICY "Anyone can read presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can insert own presence" ON user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presence" ON user_presence FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. ФУНКЦИЯ ДЛЯ АВТОСОЗДАНИЯ ПРОФИЛЯ
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автосоздания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 9. ПЕРЕСЧЁТ ПОДПИСЧИКОВ
-- ============================================================================
UPDATE profiles p SET followers_count = (
  SELECT COUNT(*) FROM author_followers WHERE author_id = p.id
);

-- ============================================================================
-- ГОТОВО!
-- ============================================================================
