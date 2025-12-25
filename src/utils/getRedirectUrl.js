// src/utils/getRedirectUrl.js
// Утилита для получения правильного redirect URL для Supabase auth

/**
 * Получает правильный redirect URL для Supabase auth
 * @param {string} path - Путь для редиректа (например, '/auth/confirmed')
 * @returns {string} Полный URL для редиректа
 */
export function getRedirectUrl(path = '') {
  // Если мы на production (не localhost), используем текущий origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}${path}`
  }
  
  // Для localhost пытаемся использовать production URL из env (если есть)
  const prodUrl = import.meta.env.VITE_SITE_URL
  if (prodUrl) {
    return `${prodUrl}${path}`
  }
  
  // Fallback на текущий origin (для dev)
  return `${window.location.origin}${path}`
}

