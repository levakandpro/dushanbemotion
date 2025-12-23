-- Создание таблиц collections и collection_items

-- ============================================
-- ТАБЛИЦА: collections (Коллекции пользователей)
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- Уникальный индекс: один пользователь не может иметь две коллекции с одинаковым названием
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_user_title_unique ON collections(user_id, title);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- ТАБЛИЦА: collection_items (Элементы коллекций)
-- ============================================
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_asset_id ON collection_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_asset_type ON collection_items(asset_type);
CREATE INDEX IF NOT EXISTS idx_collection_items_created_at ON collection_items(created_at DESC);

-- Уникальность: один ассет может быть только один раз в коллекции
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_items_unique ON collection_items(collection_id, asset_id);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики перед созданием
DROP POLICY IF EXISTS "Users can view own collection items" ON collection_items;
DROP POLICY IF EXISTS "Users can insert own collection items" ON collection_items;
DROP POLICY IF EXISTS "Users can delete own collection items" ON collection_items;

CREATE POLICY "Users can view own collection items"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own collection items"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own collection items"
  ON collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

