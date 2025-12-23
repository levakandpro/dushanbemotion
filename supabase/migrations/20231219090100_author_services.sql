-- ============================================
-- МИГРАЦИЯ: Услуги авторов (author_services)
-- ============================================

-- 1. Таблица услуг авторов
CREATE TABLE IF NOT EXISTS author_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Основная информация
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT,
  
  -- Цена и сроки
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
  
  -- Медиа
  youtube_url TEXT,
  
  -- Статус
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  
  -- Метрики
  views_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 2. Индексы
CREATE INDEX IF NOT EXISTS idx_author_services_author_id ON author_services(author_id);
CREATE INDEX IF NOT EXISTS idx_author_services_status ON author_services(status);
CREATE INDEX IF NOT EXISTS idx_author_services_created_at ON author_services(created_at DESC);

-- 3. RLS
ALTER TABLE author_services ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Authors can manage own services" ON author_services;
DROP POLICY IF EXISTS "Public can view active services" ON author_services;

-- Авторы могут управлять своими услугами
CREATE POLICY "Authors can manage own services" ON author_services
  FOR ALL USING (auth.uid() = author_id);

-- Публичный просмотр активных услуг
CREATE POLICY "Public can view active services" ON author_services
  FOR SELECT USING (status = 'active');


-- ============================================
-- МИГРАЦИЯ: Баланс авторов (author_balances)
-- ============================================

-- 4. Таблица баланса авторов
CREATE TABLE IF NOT EXISTS author_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Баланс
  available DECIMAL(12, 2) DEFAULT 0 CHECK (available >= 0),
  pending DECIMAL(12, 2) DEFAULT 0 CHECK (pending >= 0),
  total_earned DECIMAL(12, 2) DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn DECIMAL(12, 2) DEFAULT 0 CHECK (total_withdrawn >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Индекс
CREATE INDEX IF NOT EXISTS idx_author_balances_author_id ON author_balances(author_id);

-- 6. RLS
ALTER TABLE author_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors can view own balance" ON author_balances;

CREATE POLICY "Authors can view own balance" ON author_balances
  FOR SELECT USING (auth.uid() = author_id);


-- ============================================
-- МИГРАЦИЯ: Транзакции (author_transactions)
-- ============================================

-- 7. Таблица транзакций
CREATE TABLE IF NOT EXISTS author_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Тип транзакции
  type TEXT NOT NULL CHECK (type IN ('income', 'withdrawal', 'refund', 'commission')),
  
  -- Сумма (положительная для income, отрицательная для withdrawal)
  amount DECIMAL(12, 2) NOT NULL,
  
  -- Комиссия платформы (для income)
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  
  -- Связь с заказом/услугой
  service_id UUID REFERENCES author_services(id) ON DELETE SET NULL,
  order_id UUID, -- будет ссылаться на таблицу заказов
  
  -- Описание
  title TEXT NOT NULL,
  description TEXT,
  
  -- Статус
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Индексы
CREATE INDEX IF NOT EXISTS idx_author_transactions_author_id ON author_transactions(author_id);
CREATE INDEX IF NOT EXISTS idx_author_transactions_type ON author_transactions(type);
CREATE INDEX IF NOT EXISTS idx_author_transactions_created_at ON author_transactions(created_at DESC);

-- 9. RLS
ALTER TABLE author_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors can view own transactions" ON author_transactions;

CREATE POLICY "Authors can view own transactions" ON author_transactions
  FOR SELECT USING (auth.uid() = author_id);


-- ============================================
-- МИГРАЦИЯ: Ограничения публикации коллекций
-- ============================================

-- 10. Добавляем поле published_at в collections если его нет
ALTER TABLE collections ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 11. Индекс для проверки лимита публикаций
CREATE INDEX IF NOT EXISTS idx_collections_published_at ON collections(user_id, published_at DESC);


-- ============================================
-- ФУНКЦИЯ: Создание баланса при активации автора
-- ============================================

-- 12. Триггер для автоматического создания баланса
CREATE OR REPLACE FUNCTION create_author_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_author = true AND (OLD.is_author IS NULL OR OLD.is_author = false) THEN
    INSERT INTO author_balances (author_id)
    VALUES (NEW.id)
    ON CONFLICT (author_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_author_balance ON profiles;

CREATE TRIGGER trigger_create_author_balance
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_author_balance();
