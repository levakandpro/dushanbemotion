-- ============================================
-- ФИНАЛЬНАЯ МИГРАЦИЯ: profiles для D MOTION
-- ============================================

-- 1. Добавляем колонки если их нет
-- role: 'user' | 'author' (по умолчанию 'user')
-- is_author: boolean (по умолчанию false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_author BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS author_onboarded BOOLEAN DEFAULT false;

-- 2. CHECK constraint для role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IS NULL OR role IN ('user', 'author'));

-- 3. Исправляем CHECK constraint для account_type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
  CHECK (account_type IS NULL OR account_type IN ('studio', 'pro', 'solo'));

-- 4. Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Удаляем старые политики (чтобы избежать конфликтов)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

-- 6. Создаём новые RLS политики
-- SELECT: пользователь может читать свой профиль
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- INSERT: пользователь может создать свой профиль
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
