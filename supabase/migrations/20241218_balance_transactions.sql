-- ============================================
-- МИГРАЦИЯ: Таблица транзакций баланса (balance_transactions)
-- Единый источник истины для всех денежных операций
-- ============================================

-- Создаём таблицу транзакций
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('earning', 'payout', 'adjustment')),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'completed', 'cancelled')),
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_balance_transactions_author_id ON balance_transactions(author_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_order_id ON balance_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_status ON balance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at DESC);

-- RLS
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Политики
DROP POLICY IF EXISTS "Authors can view own transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Service can insert transactions" ON balance_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON balance_transactions;

-- Автор видит свои транзакции
CREATE POLICY "Authors can view own transactions" ON balance_transactions
  FOR SELECT USING (auth.uid() = author_id);

-- Сервис может вставлять транзакции (для всех авторизованных)
CREATE POLICY "Service can insert transactions" ON balance_transactions
  FOR INSERT WITH CHECK (true);

-- Админы видят все (через service role в админке)
CREATE POLICY "Admins can view all transactions" ON balance_transactions
  FOR SELECT USING (true);

-- ============================================
-- ТАКЖЕ: Убедимся что таблица service_orders существует
-- ============================================
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  
  price DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  author_earnings DECIMAL(12,2) NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'pending_payment', 'paid', 'in_progress', 
    'delivered', 'approved', 'disputed', 'cancelled', 'refunded'
  )),
  
  delivery_days INTEGER DEFAULT 7,
  deadline_at TIMESTAMP WITH TIME ZONE,
  
  client_message TEXT,
  author_response TEXT,
  delivery_message TEXT,
  delivery_files JSONB DEFAULT '[]',
  
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_review TEXT,
  has_recommendation BOOLEAN DEFAULT false,
  
  dispute_reason TEXT,
  dispute_opened_by UUID,
  
  payment_method TEXT,
  payment_screenshot TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_author_id ON service_orders(author_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_service_id ON service_orders(service_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);

-- RLS для service_orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON service_orders;
DROP POLICY IF EXISTS "Users can insert orders" ON service_orders;
DROP POLICY IF EXISTS "Users can update own orders" ON service_orders;

CREATE POLICY "Users can view own orders" ON service_orders
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = author_id);

CREATE POLICY "Users can insert orders" ON service_orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own orders" ON service_orders
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = author_id);

-- ============================================
-- ТАКЖЕ: Таблица уведомлений админки
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  user_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;

CREATE POLICY "Anyone can insert notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view notifications" ON admin_notifications
  FOR SELECT USING (true);

CREATE POLICY "Admins can update notifications" ON admin_notifications
  FOR UPDATE USING (true);

-- ============================================
-- ГОТОВО!
-- ============================================
