-- Таблица для отслеживания онлайн пользователей
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска активных пользователей
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- RLS политики
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Любой может читать (для подсчёта онлайн)
CREATE POLICY "Anyone can read presence" ON user_presence
  FOR SELECT USING (true);

-- Пользователь может вставлять своё присутствие
CREATE POLICY "Users can insert own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять только своё присутствие
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id);

-- Автоматическая очистка старых записей (старше 1 часа)
-- Можно настроить через pg_cron или вручную
