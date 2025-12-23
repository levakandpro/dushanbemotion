-- ============================================
-- МИГРАЦИЯ: Система месячных выплат авторам
-- ============================================

-- 1. Добавляем поле payout_id в service_orders для привязки заказов к выплатам
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES author_payouts(id) ON DELETE SET NULL;

-- Индекс для быстрого поиска заказов по выплате
CREATE INDEX IF NOT EXISTS idx_service_orders_payout_id ON service_orders(payout_id);

-- 2. Создаём/обновляем таблицу author_payouts
CREATE TABLE IF NOT EXISTS author_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- Формат: YYYY-MM
  
  -- Суммы
  total_orders_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  author_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  
  -- Статус выплаты
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES profiles(id),
  
  -- Мета
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Один автор = одна выплата за период
  UNIQUE(author_id, period)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_author_payouts_author_id ON author_payouts(author_id);
CREATE INDEX IF NOT EXISTS idx_author_payouts_period ON author_payouts(period);
CREATE INDEX IF NOT EXISTS idx_author_payouts_status ON author_payouts(status);
CREATE INDEX IF NOT EXISTS idx_author_payouts_paid_at ON author_payouts(paid_at DESC);

-- RLS
ALTER TABLE author_payouts ENABLE ROW LEVEL SECURITY;

-- Политики
DROP POLICY IF EXISTS "Authors can view own payouts" ON author_payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON author_payouts;

-- Автор видит свои выплаты
CREATE POLICY "Authors can view own payouts" ON author_payouts
  FOR SELECT USING (auth.uid() = author_id);

-- Админы могут всё (через service role)
CREATE POLICY "Admins can manage payouts" ON author_payouts
  FOR ALL USING (true);

-- 3. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_author_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_author_payouts_updated_at ON author_payouts;
CREATE TRIGGER trigger_update_author_payouts_updated_at
  BEFORE UPDATE ON author_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_author_payouts_updated_at();

-- ============================================
-- ГОТОВО!
-- ============================================
