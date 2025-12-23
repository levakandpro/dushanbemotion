-- Добавление поля bio в profiles (если его еще нет)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text;

