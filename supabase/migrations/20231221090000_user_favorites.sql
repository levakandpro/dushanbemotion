-- Миграция: user_favorites (идемпотентная)

-- 1) Enum asset_type (создать только если нет)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM ('images', 'music', 'sounds', 'stickers', 'icons', 'fonts');
  END IF;
END $$;

-- 2) Таблица избранного
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_type, asset_id)
);

-- 3) Индексы (только если нет)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id   ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type ON user_favorites(user_id, asset_type);

-- 4) RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 5) Policies (drop+create, чтобы не падало если уже есть)
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 6) profiles.author_onboarded (если нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS author_onboarded BOOLEAN DEFAULT false;
