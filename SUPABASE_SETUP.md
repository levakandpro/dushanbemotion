# Настройка таблицы user_assets в Supabase

## Проблема
Таблица `user_assets` не существует в Supabase, из-за чего возникают ошибки 404.

## Решение

1. Откройте Supabase Dashboard → SQL Editor

2. Выполните следующий SQL код:

```sql
-- Создание таблицы user_assets для хранения активов пользователя
CREATE TABLE IF NOT EXISTS user_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('font', 'transition', 'sticker', 'effect', 'background')),
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_asset_type ON user_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_user_assets_is_favorite ON user_assets(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_assets_created_at ON user_assets(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_user_assets_updated_at
  BEFORE UPDATE ON user_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Включить Row Level Security (RLS)
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои активы
CREATE POLICY "Users can view own assets"
  ON user_assets FOR SELECT
  USING (true); -- Временно разрешаем всем для тестирования

-- Политика: пользователи могут создавать свои активы
CREATE POLICY "Users can insert own assets"
  ON user_assets FOR INSERT
  WITH CHECK (true); -- Временно разрешаем всем для тестирования

-- Политика: пользователи могут обновлять свои активы
CREATE POLICY "Users can update own assets"
  ON user_assets FOR UPDATE
  USING (true); -- Временно разрешаем всем для тестирования

-- Политика: пользователи могут удалять свои активы
CREATE POLICY "Users can delete own assets"
  ON user_assets FOR DELETE
  USING (true); -- Временно разрешаем всем для тестирования
```

3. После выполнения SQL перезагрузите страницу (F5)

4. Проверьте, что таблица создана:
   - Откройте Supabase Dashboard → Table Editor
   - Должна появиться таблица `user_assets`

## Важно

После создания таблицы:
- Шрифты будут сохраняться в базу данных при добавлении в избранное
- Они будут отображаться в панели автора → Активы → Шрифты
- Ошибки 404 исчезнут

## Если таблица все еще не работает

1. Проверьте, что вы выполнили SQL в правильной базе данных
2. Проверьте, что RLS включен: `ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;`
3. Проверьте, что политики созданы: `SELECT * FROM pg_policies WHERE tablename = 'user_assets';`
