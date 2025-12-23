-- Исправление структуры таблицы collection_items
-- Проблема: Supabase не видит колонку asset_id в кэше схемы

-- Пересоздаём таблицу с правильными полями
DROP TABLE IF EXISTS collection_items CASCADE;

CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_asset_id ON collection_items(asset_id);
CREATE INDEX idx_collection_items_asset_type ON collection_items(asset_type);
CREATE INDEX idx_collection_items_created_at ON collection_items(created_at DESC);

-- Уникальность: один ассет может быть только один раз в коллекции
CREATE UNIQUE INDEX idx_collection_items_unique ON collection_items(collection_id, asset_id);

-- RLS
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Политики
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
