-- =====================================================
-- СИСТЕМА ЛАЙКОВ ДЛЯ КОЛЛАБОВ И РАБОТ
-- =====================================================

-- Удаляем старые функции если существуют
DROP FUNCTION IF EXISTS increment_collab_like(UUID);
DROP FUNCTION IF EXISTS decrement_collab_like(UUID);
DROP FUNCTION IF EXISTS increment_collab_view(UUID);
DROP FUNCTION IF EXISTS increment_work_like(UUID);
DROP FUNCTION IF EXISTS decrement_work_like(UUID);
DROP FUNCTION IF EXISTS get_author_total_likes(UUID);

-- Таблица лайков коллабов
CREATE TABLE IF NOT EXISTS collab_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id UUID NOT NULL REFERENCES collabs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collab_id, user_id)
);

-- Таблица лайков работ
CREATE TABLE IF NOT EXISTS work_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_id, user_id)
);

-- Добавляем колонки likes_count если их нет
ALTER TABLE collabs ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE collabs ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_collab_likes_collab ON collab_likes(collab_id);
CREATE INDEX IF NOT EXISTS idx_collab_likes_user ON collab_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_work_likes_work ON work_likes(work_id);
CREATE INDEX IF NOT EXISTS idx_work_likes_user ON work_likes(user_id);

-- =====================================================
-- RPC ФУНКЦИИ ДЛЯ ЛАЙКОВ КОЛЛАБОВ
-- =====================================================

-- Инкремент лайка коллаба
CREATE OR REPLACE FUNCTION increment_collab_like(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE collabs 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_collab_id;
END;
$$;

-- Декремент лайка коллаба
CREATE OR REPLACE FUNCTION decrement_collab_like(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE collabs 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = p_collab_id;
END;
$$;

-- Инкремент просмотра коллаба
CREATE OR REPLACE FUNCTION increment_collab_view(collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE collabs 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = collab_id;
END;
$$;

-- =====================================================
-- RPC ФУНКЦИИ ДЛЯ ЛАЙКОВ РАБОТ
-- =====================================================

-- Инкремент лайка работы
CREATE OR REPLACE FUNCTION increment_work_like(p_work_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Обновляем в work_metrics
  INSERT INTO work_metrics (work_id, likes)
  VALUES (p_work_id, 1)
  ON CONFLICT (work_id) 
  DO UPDATE SET likes = COALESCE(work_metrics.likes, 0) + 1;
END;
$$;

-- Декремент лайка работы
CREATE OR REPLACE FUNCTION decrement_work_like(p_work_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_metrics 
  SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
  WHERE work_id = p_work_id;
END;
$$;

-- =====================================================
-- ФУНКЦИЯ ПОДСЧЁТА ВСЕХ ЛАЙКОВ АВТОРА
-- =====================================================

-- Получить общее количество лайков автора (коллабы + работы)
CREATE OR REPLACE FUNCTION get_author_total_likes(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  collab_likes_count INTEGER := 0;
  work_likes_count INTEGER := 0;
BEGIN
  -- Лайки на коллабах где автор участвует
  SELECT COALESCE(SUM(c.likes_count), 0) INTO collab_likes_count
  FROM collabs c
  WHERE c.author1_id = p_user_id OR c.author2_id = p_user_id;
  
  -- Лайки на работах автора
  SELECT COALESCE(SUM(wm.likes), 0) INTO work_likes_count
  FROM work_metrics wm
  JOIN works w ON w.id = wm.work_id
  WHERE w.author_id = p_user_id;
  
  RETURN collab_likes_count + work_likes_count;
END;
$$;

-- =====================================================
-- ЛАЙКИ И ПРОСМОТРЫ КОЛЛЕКЦИЙ
-- =====================================================

-- Таблица лайков коллекций
CREATE TABLE IF NOT EXISTS collection_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);

-- Добавляем колонки если их нет
ALTER TABLE collections ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_collection_likes_collection ON collection_likes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_likes_user ON collection_likes(user_id);

-- Инкремент просмотра коллекции
DROP FUNCTION IF EXISTS increment_collection_view(UUID);
CREATE OR REPLACE FUNCTION increment_collection_view(collection_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE collections 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = collection_id;
END;
$$;

-- Триггер для автоматического обновления likes_count коллекций
CREATE OR REPLACE FUNCTION update_collection_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_collection_likes_count ON collection_likes;
CREATE TRIGGER trigger_collection_likes_count
  AFTER INSERT OR DELETE ON collection_likes
  FOR EACH ROW EXECUTE FUNCTION update_collection_likes_count();

-- =====================================================
-- RLS ПОЛИТИКИ
-- =====================================================

-- Включаем RLS
ALTER TABLE collab_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_likes ENABLE ROW LEVEL SECURITY;

-- Политики для collab_likes
CREATE POLICY "Users can view all collab likes" ON collab_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own collab likes" ON collab_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collab likes" ON collab_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для work_likes
CREATE POLICY "Users can view all work likes" ON work_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own work likes" ON work_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own work likes" ON work_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для collection_likes
CREATE POLICY "Users can view all collection likes" ON collection_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own collection likes" ON collection_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection likes" ON collection_likes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ПОДСЧЁТА
-- =====================================================

-- Триггер для автоматического обновления likes_count при добавлении лайка
CREATE OR REPLACE FUNCTION update_collab_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collabs SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.collab_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collabs SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.collab_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_collab_likes_count ON collab_likes;
CREATE TRIGGER trigger_collab_likes_count
  AFTER INSERT OR DELETE ON collab_likes
  FOR EACH ROW EXECUTE FUNCTION update_collab_likes_count();

-- Триггер для автоматического обновления likes в work_metrics
CREATE OR REPLACE FUNCTION update_work_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO work_metrics (work_id, likes)
    VALUES (NEW.work_id, 1)
    ON CONFLICT (work_id) 
    DO UPDATE SET likes = COALESCE(work_metrics.likes, 0) + 1;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE work_metrics SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE work_id = OLD.work_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_work_likes_count ON work_likes;
CREATE TRIGGER trigger_work_likes_count
  AFTER INSERT OR DELETE ON work_likes
  FOR EACH ROW EXECUTE FUNCTION update_work_likes_count();
