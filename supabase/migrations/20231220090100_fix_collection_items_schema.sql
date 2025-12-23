-- Исправление схемы collection_items - удаление поля asset_data
-- Это поле было в миграции, но не применено в реальной БД

-- Удаляем колонку asset_data, если она существует
ALTER TABLE collection_items DROP COLUMN IF EXISTS asset_data;
