-- Добавление новых полей в profiles (если их еще нет)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_bonus_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS social_telegram text,
  ADD COLUMN IF NOT EXISTS social_youtube text,
  ADD COLUMN IF NOT EXISTS social_vk text,
  ADD COLUMN IF NOT EXISTS social_mix text,
  ADD COLUMN IF NOT EXISTS social_whatsapp text,
  ADD COLUMN IF NOT EXISTS cover_theme text,
  ADD COLUMN IF NOT EXISTS cover_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS avatar_gallery text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_slideshow_enabled boolean DEFAULT false;

-- Создание индекса для referral_code для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
