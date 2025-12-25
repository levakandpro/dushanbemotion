// src/utils/getRedirectUrl.js
// Утилита для получения правильного redirect URL для Supabase auth

/**
 * Получает правильный redirect URL для Supabase auth
 * ВАЖНО: Этот URL должен быть добавлен в Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
 * @param {string} path - Путь для редиректа (например, '/auth/confirmed')
 * @returns {string} Полный URL для редиректа
 */
export function getRedirectUrl(path = '') {
  // Проверяем доступность window (на случай SSR или раннего вызова)
  if (typeof window === 'undefined') {
    // Fallback для SSR или если window недоступен
    const prodUrl = import.meta.env.VITE_SITE_URL || 'https://dushanbemotion.com'
    return `${prodUrl}${path}`
  }
  
  // ВСЕГДА используем текущий origin - браузер сам определит правильный домен
  // Это работает и на production, и на localhost
  return `${window.location.origin}${path}`
}

