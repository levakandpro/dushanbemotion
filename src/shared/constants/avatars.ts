// src/shared/constants/avatars.ts

// Дефолтные аватары
export const DEFAULT_AVATAR_MALE =
  'https://archive.org/download/lucid-origin-ultrarealistic-cinematic-fullframe-closeup-of-kin-1/Lucid_Origin_Ultrarealistic_cinematic_fullframe_closeup_of_Kin_1.jpg';

export const DEFAULT_AVATAR_FEMALE =
  'https://archive.org/download/lucid-origin-arabic-woman-wearing-a-traditional-burka-with-str-0/Lucid_Origin_Arabic_woman_wearing_a_traditional_burka_with_str_0.jpg';

// URL для манифеста аватаров
export const AVATARS_MANIFEST_URL =
  import.meta.env.VITE_AVATARS_MANIFEST_URL ||
  'https://avatars-manifest.natopchane.workers.dev/avatars';

/**
 * Получить URL аватара на основе профиля
 */
export function getAvatarUrl(profile: {
  current_plan?: string | null
  avatar_slideshow_enabled?: boolean
  avatar_gallery?: string[]
  avatar_url?: string | null
  gender?: string | null
}): string {
  // Премиум слайдшоу
  if (
    profile.current_plan === 'premium' &&
    profile.avatar_slideshow_enabled === true &&
    profile.avatar_gallery &&
    profile.avatar_gallery.length > 0
  ) {
    // Возвращаем первый элемент для статичного отображения
    // Слайдшоу будет обрабатываться компонентом AvatarPremiumSlideshow
    return profile.avatar_gallery[0]
  }

  // Обычный аватар
  if (profile.avatar_url) {
    return profile.avatar_url
  }

  // Дефолтный аватар
  if (profile.gender === 'female') {
    return DEFAULT_AVATAR_FEMALE
  }

  return DEFAULT_AVATAR_MALE
}

