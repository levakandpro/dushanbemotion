-- ============================================
-- ИСПРАВЛЕНИЕ СИСТЕМЫ СТАТИСТИКИ
-- Дата: 2024-12-23
-- ============================================

-- ============================================
-- ЧАСТЬ 1: ТАБЛИЦА ПУБЛИЧНОЙ СТАТИСТИКИ
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Только одна строка
  users_count INTEGER NOT NULL DEFAULT 0,
  online_count INTEGER NOT NULL DEFAULT 0,
  backgrounds_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Вставляем начальную строку если её нет
INSERT INTO public.site_stats (id, users_count, online_count)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS: таблица полностью публична для чтения
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read stats" ON public.site_stats;
CREATE POLICY "Anyone can read stats" ON public.site_stats
  FOR SELECT USING (true);

-- Только authenticated пользователи могут обновлять (через функции)
DROP POLICY IF EXISTS "Service can update stats" ON public.site_stats;
CREATE POLICY "Service can update stats" ON public.site_stats
  FOR UPDATE USING (false); -- Обновлять только через функции

-- ============================================
-- ЧАСТЬ 2: ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ USERS_COUNT
-- ============================================

CREATE OR REPLACE FUNCTION update_users_count()
RETURNS TRIGGER AS $$
BEGIN
  -- При вставке нового профиля увеличиваем счётчик
  IF TG_OP = 'INSERT' THEN
    UPDATE public.site_stats 
    SET 
      users_count = users_count + 1,
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  -- При удалении профиля уменьшаем счётчик
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

-- Триггер на profiles
DROP TRIGGER IF EXISTS trigger_update_users_count ON profiles;
CREATE TRIGGER trigger_update_users_count
  AFTER INSERT OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_users_count();

-- ============================================
-- ЧАСТЬ 3: ФУНКЦИЯ ПЕРЕСЧЁТА ОНЛАЙН (безопасная)
-- ============================================

-- Функция для пересчёта онлайн пользователей
CREATE OR REPLACE FUNCTION recalculate_online_count()
RETURNS INTEGER AS $$
DECLARE
  online_count INTEGER;
BEGIN
  -- Считаем пользователей онлайн за последние 2 минуты
  SELECT COUNT(*)
  INTO online_count
  FROM user_presence
  WHERE last_seen >= NOW() - INTERVAL '2 minutes';
  
  -- Обновляем в site_stats
  UPDATE public.site_stats
  SET 
    online_count = online_count,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN online_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Публичная функция для получения онлайн счётчика (без раскрытия деталей)
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

-- Даём права на выполнение функции всем
GRANT EXECUTE ON FUNCTION get_online_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_online_count() TO authenticated;

-- ============================================
-- ЧАСТЬ 4: ИСПРАВЛЕНИЕ RLS ДЛЯ USER_PRESENCE
-- ============================================

-- ВАЖНО: Убираем публичное чтение всей таблицы!
DROP POLICY IF EXISTS "Anyone can read presence" ON user_presence;

-- Пользователь может читать ТОЛЬКО свою строку
CREATE POLICY "Users can read own presence" ON user_presence
  FOR SELECT USING (auth.uid() = user_id);

-- Политики для записи уже есть, но проверим
DROP POLICY IF EXISTS "Users can upsert own presence" ON user_presence;
CREATE POLICY "Users can upsert own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ЧАСТЬ 5: ТРИГГЕР АВТОСОЗДАНИЯ PROFILES
-- ============================================

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ЧАСТЬ 6: BACKFILL СУЩЕСТВУЮЩИХ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

-- Создаём профили для существующих пользователей, у которых их нет
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Обновляем начальный счётчик пользователей
UPDATE public.site_stats
SET users_count = (SELECT COUNT(*) FROM public.profiles WHERE NOT COALESCE(is_deleted, false))
WHERE id = 1;

-- ============================================
-- ЧАСТЬ 7: ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ВСЕЙ СТАТИСТИКИ
-- ============================================

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

-- Даём права на выполнение
GRANT EXECUTE ON FUNCTION get_site_stats() TO anon, authenticated;

-- ============================================
-- ЧАСТЬ 8: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- Уже есть в предыдущей миграции, но проверим
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen 
  ON user_presence(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_not_deleted 
  ON profiles(id) WHERE NOT COALESCE(is_deleted, false);

-- ============================================
-- ЧАСТЬ 9: КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- ============================================

COMMENT ON TABLE public.site_stats IS 'Публичная таблица со счётчиками сайта. Всегда содержит одну строку (id=1)';
COMMENT ON COLUMN public.site_stats.users_count IS 'Общее количество зарегистрированных пользователей';
COMMENT ON COLUMN public.site_stats.online_count IS 'Количество пользователей онлайн (кэшированное значение)';
COMMENT ON FUNCTION get_online_count() IS 'Возвращает актуальное количество пользователей онлайн за последние 2 минуты';
COMMENT ON FUNCTION get_site_stats() IS 'Возвращает всю публичную статистику сайта';

-- ============================================
-- ГОТОВО!
-- ============================================
-- Теперь:
-- 1. profiles автоматически создаются при регистрации
-- 2. users_count обновляется автоматически через триггер
-- 3. online_count можно получить через безопасную функцию
-- 4. Клиент не может читать чужие presence напрямую
-- 5. Все счётчики доступны через get_site_stats()

