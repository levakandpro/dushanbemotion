-- Добавляем колонку asset_data в collection_items для хранения обложек
ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS asset_data JSONB;

-- Добавляем поля для публикации коллекций в BAZAR
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public) WHERE is_public = true;
