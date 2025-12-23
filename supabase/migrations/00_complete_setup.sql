-- ============================================
-- ПОЛНАЯ НАСТРОЙКА SUPABASE ДЛЯ DUSHANBE MOTION
-- ============================================
-- Выполните этот SQL в Supabase Dashboard → SQL Editor
-- ============================================

create extension if not exists pgcrypto;

-- ============================================
-- 1. ТАБЛИЦА: user_assets (Избранные шрифты и активы)
-- ============================================
CREATE TABLE IF NOT EXISTS user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('font', 'transition', 'sticker', 'effect', 'background')),
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_asset_type ON user_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_user_assets_is_favorite ON user_assets(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_assets_created_at ON user_assets(created_at DESC);

ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием (для безопасного повторного выполнения)
DROP POLICY IF EXISTS "Users can view own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can update own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON user_assets;

CREATE POLICY "Users can view own assets"
  ON user_assets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own assets"
  ON user_assets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own assets"
  ON user_assets FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own assets"
  ON user_assets FOR DELETE
  USING (true);

-- ============================================
-- 2. ТАБЛИЦА: projects (Проекты редактора)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
-- CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием (для безопасного повторного выполнения)
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. ТАБЛИЦА: profiles (Профили пользователей)
-- ============================================
-- Если таблица profiles уже существует, пропустите этот раздел
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  country TEXT,
  account_type TEXT CHECK (account_type IN ('studio', 'pro', 'solo')),
  terms_accepted BOOLEAN DEFAULT false,
  accepted_terms_at TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locale TEXT,
  current_plan TEXT,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT false,
  storage_used_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER DEFAULT 1000,
  is_deleted BOOLEAN DEFAULT false,
  achievements JSONB DEFAULT '[]'::jsonb,
  referral_code TEXT,
  referred_by TEXT,
  referral_bonus_days INTEGER DEFAULT 0,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_telegram TEXT,
  social_youtube TEXT,
  social_vk TEXT,
  social_mix TEXT,
  social_whatsapp TEXT,
  cover_theme TEXT,
  cover_images TEXT[] DEFAULT '{}',
  gender TEXT,
  avatar_gallery TEXT[] DEFAULT '{}',
  avatar_slideshow_enabled BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием (для безопасного повторного выполнения)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. ТАБЛИЦА: user_media (Медиа файлы)
-- ============================================
CREATE TABLE IF NOT EXISTS user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio')),
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_file_type ON user_media(file_type);
CREATE INDEX IF NOT EXISTS idx_user_media_created_at ON user_media(created_at DESC);

ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием (для безопасного повторного выполнения)
DROP POLICY IF EXISTS "Users can view own media" ON user_media;
DROP POLICY IF EXISTS "Users can insert own media" ON user_media;
DROP POLICY IF EXISTS "Users can delete own media" ON user_media;

CREATE POLICY "Users can view own media"
  ON user_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON user_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON user_media FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. ТАБЛИЦА: live_posts (Публикации)
-- ============================================
CREATE TABLE IF NOT EXISTS live_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  orientation TEXT CHECK (orientation IN ('vertical', 'horizontal')),
  category TEXT,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  allow_open_project BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  is_pinned BOOLEAN DEFAULT false,
  pin_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_posts_author_id ON live_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_live_posts_status ON live_posts(status);
CREATE INDEX IF NOT EXISTS idx_live_posts_created_at ON live_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_posts_is_pinned ON live_posts(is_pinned, pin_order) WHERE is_pinned = true;

ALTER TABLE live_posts ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием (для безопасного повторного выполнения)
DROP POLICY IF EXISTS "Users can view published posts" ON live_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON live_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON live_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON live_posts;

CREATE POLICY "Users can view published posts"
  ON live_posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Users can insert own posts"
  ON live_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON live_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON live_posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 6. ФУНКЦИЯ: Автоматическое обновление updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_user_assets_updated_at ON user_assets;
CREATE TRIGGER update_user_assets_updated_at
  BEFORE UPDATE ON user_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_posts_updated_at ON live_posts;
CREATE TRIGGER update_live_posts_updated_at
  BEFORE UPDATE ON live_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ГОТОВО!
-- ============================================
-- После выполнения этого SQL все необходимые таблицы будут созданы
-- Проверьте в Supabase Dashboard → Table Editor, что все таблицы появились
-- ============================================

