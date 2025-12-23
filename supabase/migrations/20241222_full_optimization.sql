-- ============================================================================
-- D MOTION - ПОЛНАЯ ОПТИМИЗАЦИЯ БАЗЫ ДАННЫХ
-- Профессиональная настройка: индексы, триггеры, RLS, автоматические счётчики
-- ============================================================================

-- ============================================================================
-- 1. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_author ON profiles(is_author) WHERE is_author = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Works (Bazar) - ПРИМЕЧАНИЕ: bazar_works это VIEW, индексы создаются на базовой таблице
-- Если есть базовая таблица works, раскомментируйте:
-- CREATE INDEX IF NOT EXISTS idx_works_author ON works(author_id);
-- CREATE INDEX IF NOT EXISTS idx_works_created ON works(created_at DESC);

-- Work Likes
CREATE INDEX IF NOT EXISTS idx_work_likes_work ON work_likes(work_id);
CREATE INDEX IF NOT EXISTS idx_work_likes_user ON work_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_likes_unique ON work_likes(work_id, user_id);

-- Work Metrics (просмотры)
CREATE INDEX IF NOT EXISTS idx_work_metrics_work ON work_metrics(work_id);
CREATE INDEX IF NOT EXISTS idx_work_metrics_date ON work_metrics(viewed_at DESC);

-- Collections
CREATE INDEX IF NOT EXISTS idx_collections_author ON collections(author_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collections_views ON collections(views_count DESC);

-- Collection Items
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_order ON collection_items(collection_id, order_index);

-- Collection Likes
CREATE INDEX IF NOT EXISTS idx_collection_likes_collection ON collection_likes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_likes_user ON collection_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_likes_unique ON collection_likes(collection_id, user_id);

-- Collection Views
CREATE INDEX IF NOT EXISTS idx_collection_views_collection ON collection_views(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_views_date ON collection_views(viewed_at DESC);

-- Author Followers (подписки)
CREATE INDEX IF NOT EXISTS idx_author_followers_author ON author_followers(author_id);
CREATE INDEX IF NOT EXISTS idx_author_followers_follower ON author_followers(follower_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_author_followers_unique ON author_followers(author_id, follower_id);

-- Author Services
CREATE INDEX IF NOT EXISTS idx_author_services_author ON author_services(author_id);
CREATE INDEX IF NOT EXISTS idx_author_services_active ON author_services(is_active) WHERE is_active = true;

-- Service Orders
CREATE INDEX IF NOT EXISTS idx_service_orders_buyer ON service_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_author ON service_orders(author_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created ON service_orders(created_at DESC);

-- Service Ratings
CREATE INDEX IF NOT EXISTS idx_service_ratings_service ON service_ratings(service_id);
CREATE INDEX IF NOT EXISTS idx_service_ratings_author ON service_ratings(author_id);

-- Collabs
CREATE INDEX IF NOT EXISTS idx_collabs_author ON collabs(author_id);
CREATE INDEX IF NOT EXISTS idx_collabs_public ON collabs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collabs_views ON collabs(views_count DESC);

-- Collab Likes
CREATE INDEX IF NOT EXISTS idx_collab_likes_collab ON collab_likes(collab_id);
CREATE INDEX IF NOT EXISTS idx_collab_likes_user ON collab_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_likes_unique ON collab_likes(collab_id, user_id);

-- User Presence (онлайн)
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- User Favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(item_type);

-- Admin Notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

-- Live Posts
CREATE INDEX IF NOT EXISTS idx_live_comments_post ON live_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_live_post_likes_post ON live_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_live_post_views_post ON live_post_views(post_id);

-- ============================================================================
-- 2. ФУНКЦИИ ДЛЯ АВТОМАТИЧЕСКИХ СЧЁТЧИКОВ
-- ============================================================================

-- Функция для обновления счётчика лайков работы
-- ПРИМЕЧАНИЕ: bazar_works это VIEW, нужно обновлять базовую таблицу works
-- CREATE OR REPLACE FUNCTION update_work_likes_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF TG_OP = 'INSERT' THEN
--     UPDATE works SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.work_id;
--     RETURN NEW;
--   ELSIF TG_OP = 'DELETE' THEN
--     UPDATE works SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.work_id;
--     RETURN OLD;
--   END IF;
--   RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления счётчика просмотров работы
-- CREATE OR REPLACE FUNCTION update_work_views_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   UPDATE works SET views_count = COALESCE(views_count, 0) + 1 WHERE id = NEW.work_id;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления счётчика лайков коллекции
CREATE OR REPLACE FUNCTION update_collection_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления счётчика просмотров коллекции
CREATE OR REPLACE FUNCTION update_collection_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collections SET views_count = COALESCE(views_count, 0) + 1 WHERE id = NEW.collection_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления счётчика подписчиков автора
CREATE OR REPLACE FUNCTION update_author_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления счётчика лайков коллаба
CREATE OR REPLACE FUNCTION update_collab_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collabs SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.collab_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collabs SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.collab_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления рейтинга сервиса
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE author_services 
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM service_ratings WHERE service_id = NEW.service_id),
    reviews_count = (SELECT COUNT(*) FROM service_ratings WHERE service_id = NEW.service_id)
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКИХ СЧЁТЧИКОВ
-- ============================================================================

-- Удаляем старые триггеры если есть
DROP TRIGGER IF EXISTS trigger_work_likes_count ON work_likes;
DROP TRIGGER IF EXISTS trigger_work_views_count ON work_metrics;
DROP TRIGGER IF EXISTS trigger_collection_likes_count ON collection_likes;
DROP TRIGGER IF EXISTS trigger_collection_views_count ON collection_views;
DROP TRIGGER IF EXISTS trigger_author_followers_count ON author_followers;
DROP TRIGGER IF EXISTS trigger_collab_likes_count ON collab_likes;
DROP TRIGGER IF EXISTS trigger_service_rating ON service_ratings;

-- Триггер для лайков работ - закомментирован, bazar_works это VIEW
-- CREATE TRIGGER trigger_work_likes_count
-- AFTER INSERT OR DELETE ON work_likes
-- FOR EACH ROW EXECUTE FUNCTION update_work_likes_count();

-- Триггер для просмотров работ - закомментирован, bazar_works это VIEW
-- CREATE TRIGGER trigger_work_views_count
-- AFTER INSERT ON work_metrics
-- FOR EACH ROW EXECUTE FUNCTION update_work_views_count();

-- Триггер для лайков коллекций
CREATE TRIGGER trigger_collection_likes_count
AFTER INSERT OR DELETE ON collection_likes
FOR EACH ROW EXECUTE FUNCTION update_collection_likes_count();

-- Триггер для просмотров коллекций
CREATE TRIGGER trigger_collection_views_count
AFTER INSERT ON collection_views
FOR EACH ROW EXECUTE FUNCTION update_collection_views_count();

-- Триггер для подписчиков
CREATE TRIGGER trigger_author_followers_count
AFTER INSERT OR DELETE ON author_followers
FOR EACH ROW EXECUTE FUNCTION update_author_followers_count();

-- Триггер для лайков коллабов
CREATE TRIGGER trigger_collab_likes_count
AFTER INSERT OR DELETE ON collab_likes
FOR EACH ROW EXECUTE FUNCTION update_collab_likes_count();

-- Триггер для рейтинга сервисов
CREATE TRIGGER trigger_service_rating
AFTER INSERT OR UPDATE ON service_ratings
FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- ============================================================================
-- 4. ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ КОЛОНОК ДЛЯ СЧЁТЧИКОВ
-- ============================================================================

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS works_count INTEGER DEFAULT 0;

-- Bazar Works - это VIEW, колонки добавляются в базовую таблицу
-- ALTER TABLE works ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
-- ALTER TABLE works ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
-- ALTER TABLE works ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0;

-- Collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

-- Collabs
ALTER TABLE collabs ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE collabs ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE collabs ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0;

-- Author Services
ALTER TABLE author_services ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE author_services ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE author_services ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;

-- ============================================================================
-- 5. RLS ПОЛИТИКИ БЕЗОПАСНОСТИ
-- ============================================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Bazar Works - это VIEW, RLS настраивается на базовой таблице
-- Если есть базовая таблица works:
-- ALTER TABLE works ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public works are viewable" ON works FOR SELECT USING (is_public = true OR author_id = auth.uid());
-- CREATE POLICY "Authors can manage own works" ON works FOR ALL USING (author_id = auth.uid());

-- Work Likes
ALTER TABLE work_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view likes" ON work_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON work_likes;
CREATE POLICY "Anyone can view likes" ON work_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON work_likes FOR ALL USING (auth.uid() = user_id);

-- Work Metrics
ALTER TABLE work_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view metrics" ON work_metrics;
DROP POLICY IF EXISTS "Anyone can insert metrics" ON work_metrics;
CREATE POLICY "Anyone can view metrics" ON work_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert metrics" ON work_metrics FOR INSERT WITH CHECK (true);

-- Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public collections are viewable" ON collections;
DROP POLICY IF EXISTS "Authors can manage own collections" ON collections;
CREATE POLICY "Public collections are viewable" ON collections FOR SELECT USING (is_public = true OR author_id = auth.uid());
CREATE POLICY "Authors can manage own collections" ON collections FOR ALL USING (author_id = auth.uid());

-- Collection Likes
ALTER TABLE collection_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view collection likes" ON collection_likes;
DROP POLICY IF EXISTS "Users can manage own collection likes" ON collection_likes;
CREATE POLICY "Anyone can view collection likes" ON collection_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own collection likes" ON collection_likes FOR ALL USING (auth.uid() = user_id);

-- Collection Views
ALTER TABLE collection_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view collection views" ON collection_views;
DROP POLICY IF EXISTS "Anyone can insert collection views" ON collection_views;
CREATE POLICY "Anyone can view collection views" ON collection_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collection views" ON collection_views FOR INSERT WITH CHECK (true);

-- Author Followers
ALTER TABLE author_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view followers" ON author_followers;
DROP POLICY IF EXISTS "Users can manage own follows" ON author_followers;
CREATE POLICY "Anyone can view followers" ON author_followers FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON author_followers FOR ALL USING (auth.uid() = follower_id);

-- Author Services
ALTER TABLE author_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active services are viewable" ON author_services;
DROP POLICY IF EXISTS "Authors can manage own services" ON author_services;
CREATE POLICY "Active services are viewable" ON author_services FOR SELECT USING (is_active = true OR author_id = auth.uid());
CREATE POLICY "Authors can manage own services" ON author_services FOR ALL USING (author_id = auth.uid());

-- Service Orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON service_orders;
DROP POLICY IF EXISTS "Users can create orders" ON service_orders;
DROP POLICY IF EXISTS "Participants can update orders" ON service_orders;
CREATE POLICY "Users can view own orders" ON service_orders FOR SELECT USING (buyer_id = auth.uid() OR author_id = auth.uid());
CREATE POLICY "Users can create orders" ON service_orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Participants can update orders" ON service_orders FOR UPDATE USING (buyer_id = auth.uid() OR author_id = auth.uid());

-- Service Ratings
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view ratings" ON service_ratings;
DROP POLICY IF EXISTS "Buyers can create ratings" ON service_ratings;
CREATE POLICY "Anyone can view ratings" ON service_ratings FOR SELECT USING (true);
CREATE POLICY "Buyers can create ratings" ON service_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Collabs
ALTER TABLE collabs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public collabs are viewable" ON collabs;
DROP POLICY IF EXISTS "Authors can manage own collabs" ON collabs;
CREATE POLICY "Public collabs are viewable" ON collabs FOR SELECT USING (is_public = true OR author_id = auth.uid());
CREATE POLICY "Authors can manage own collabs" ON collabs FOR ALL USING (author_id = auth.uid());

-- Collab Likes
ALTER TABLE collab_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view collab likes" ON collab_likes;
DROP POLICY IF EXISTS "Users can manage own collab likes" ON collab_likes;
CREATE POLICY "Anyone can view collab likes" ON collab_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own collab likes" ON collab_likes FOR ALL USING (auth.uid() = user_id);

-- User Presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
CREATE POLICY "Anyone can read presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can insert own presence" ON user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presence" ON user_presence FOR UPDATE USING (auth.uid() = user_id);

-- User Favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);

-- Admin Notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
CREATE POLICY "Admins can view notifications" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update notifications" ON admin_notifications FOR UPDATE USING (true);

-- ============================================================================
-- 6. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО СОЗДАНИЯ ПРОФИЛЯ ПРИ РЕГИСТРАЦИИ
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автосоздания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 7. ФУНКЦИЯ ДЛЯ ОЧИСТКИ СТАРЫХ ДАННЫХ (АВТОМАТИЧЕСКАЯ)
-- ============================================================================

-- Очистка старых записей присутствия (старше 24 часов)
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM user_presence WHERE last_seen < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Очистка старых просмотров (старше 30 дней, оставляем только счётчики)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM work_metrics WHERE viewed_at < NOW() - INTERVAL '30 days';
  DELETE FROM collection_views WHERE viewed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. СИНХРОНИЗАЦИЯ СУЩЕСТВУЮЩИХ СЧЁТЧИКОВ
-- ============================================================================

-- Пересчёт лайков работ - bazar_works это VIEW, обновляем базовую таблицу
-- UPDATE works w SET likes_count = (SELECT COUNT(*) FROM work_likes WHERE work_id = w.id);

-- Пересчёт просмотров работ - bazar_works это VIEW
-- UPDATE works w SET views_count = (SELECT COUNT(*) FROM work_metrics WHERE work_id = w.id);

-- Пересчёт лайков коллекций
UPDATE collections c SET likes_count = (
  SELECT COUNT(*) FROM collection_likes WHERE collection_id = c.id
);

-- Пересчёт просмотров коллекций
UPDATE collections c SET views_count = (
  SELECT COUNT(*) FROM collection_views WHERE collection_id = c.id
);

-- Пересчёт подписчиков авторов
UPDATE profiles p SET followers_count = (
  SELECT COUNT(*) FROM author_followers WHERE author_id = p.id
);

-- Пересчёт лайков коллабов
UPDATE collabs c SET likes_count = (
  SELECT COUNT(*) FROM collab_likes WHERE collab_id = c.id
);

-- ============================================================================
-- ГОТОВО! Все счётчики теперь автоматические
-- ============================================================================
