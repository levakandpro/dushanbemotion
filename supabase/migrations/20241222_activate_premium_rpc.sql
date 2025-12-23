-- ============================================
-- АКТИВАЦИЯ PREMIUM: RPC функция + RLS для админов
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor
-- ============================================

-- 1. Добавляем колонку is_admin если её нет
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. RPC функция для активации PREMIUM (SECURITY DEFINER обходит RLS)
CREATE OR REPLACE FUNCTION activate_premium(
  p_user_id UUID,
  p_plan_id TEXT DEFAULT 'premium',
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_new_expires_at TIMESTAMPTZ;
  v_base_date TIMESTAMPTZ;
BEGIN
  -- Получаем текущий профиль пользователя
  SELECT id, current_plan, plan_expires_at, is_lifetime
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;

  -- Если lifetime - не продлеваем
  IF v_profile.is_lifetime THEN
    RETURN json_build_object('success', false, 'message', 'У пользователя Lifetime');
  END IF;

  -- Вычисляем новую дату окончания
  IF v_profile.plan_expires_at IS NOT NULL AND v_profile.plan_expires_at > NOW() THEN
    v_base_date := v_profile.plan_expires_at;
  ELSE
    v_base_date := NOW();
  END IF;
  
  v_new_expires_at := v_base_date + (p_days || ' days')::INTERVAL;

  -- Обновляем профиль (SECURITY DEFINER позволяет обойти RLS)
  UPDATE profiles
  SET 
    current_plan = p_plan_id,
    plan_expires_at = v_new_expires_at,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'plan_id', p_plan_id,
    'expires_at', v_new_expires_at
  );
END;
$$;

-- 3. Даём права на выполнение
GRANT EXECUTE ON FUNCTION activate_premium TO authenticated;

-- 4. Альтернатива: RLS политика для админов (если хотите обновлять напрямую)
-- DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
-- CREATE POLICY "Admins can update any profile" ON profiles
--   FOR UPDATE USING (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
--   );

-- 5. Установите is_admin = true для вашего аккаунта:
-- UPDATE profiles SET is_admin = true WHERE id = 'ВАШ_USER_ID';
