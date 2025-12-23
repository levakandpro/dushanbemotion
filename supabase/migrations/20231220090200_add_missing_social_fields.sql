-- Добавление недостающих полей соцсетей в profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_facebook text,
  ADD COLUMN IF NOT EXISTS social_x text,
  ADD COLUMN IF NOT EXISTS social_pinterest text,
  ADD COLUMN IF NOT EXISTS social_gmail text;
