// src/services/statsService.js
// Сервис для получения реальной статистики сайта (prod-ready)

import { supabase } from '../lib/supabaseClient'

// ============================================
// КЭШИРОВАНИЕ СТАТИСТИКИ
// ============================================

// Кэш последних успешных значений (чтобы не показывать 0 при ошибке)
let statsCache = {
  users: 500,      // fallback значение
  online: 1,       // минимум 1
  backgrounds: 0,
  videos: 0,
  lastUpdated: 0
}

let lastFetchTime = 0
const CACHE_TTL = 60000 // 1 минута

// Флаг для предотвращения множественных одновременных запросов
let fetchPromise = null

// ============================================
// ПОЛУЧЕНИЕ СТАТИСТИКИ (безопасно и стабильно)
// ============================================

/**
 * Получает статистику сайта из безопасного источника
 * НИКОГДА не возвращает 0 при ошибке - использует кэш
 * @returns {Promise<Object>} Объект со статистикой
 */
export async function getSiteStats() {
  const now = Date.now()
  
  // Возвращаем кэш если он свежий
  if (statsCache && (now - lastFetchTime) < CACHE_TTL) {
    return { ...statsCache }
  }

  // Если уже идёт запрос, ждём его
  if (fetchPromise) {
    try {
      return await fetchPromise
    } catch (error) {
      // Если параллельный запрос упал, вернём кэш
      return { ...statsCache }
    }
  }

  // Создаём новый запрос
  fetchPromise = fetchStatsFromDatabase()

  try {
    const stats = await fetchPromise
    statsCache = stats
    lastFetchTime = now
    return { ...stats }
  } catch (error) {
    console.warn('[Stats] Ошибка получения статистики, используем кэш:', error.message)
    // При ошибке возвращаем последние успешные значения
    return { ...statsCache }
  } finally {
    fetchPromise = null
  }
}

/**
 * Внутренняя функция для запроса к БД
 * Использует безопасную SQL функцию get_site_stats()
 */
async function fetchStatsFromDatabase() {
  try {
    // Используем безопасную функцию вместо прямого подсчёта
    const { data, error } = await supabase
      .rpc('get_site_stats')

    if (error) {
      console.error('[Stats] RPC error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn('[Stats] Нет данных от get_site_stats, используем fallback')
      throw new Error('No data returned')
    }

    const row = data[0]

    return {
      users: row.users_count || 0,
      online: Math.max(row.online_count || 0, 1), // Минимум 1
      backgrounds: row.backgrounds_count || 0,
      videos: row.videos_count || 0,
      lastUpdated: Date.now()
    }
  } catch (error) {
    // Если функция не найдена, пробуем прямое чтение из site_stats
    console.warn('[Stats] Fallback к прямому чтению site_stats')
    
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('site_stats')
        .select('*')
        .eq('id', 1)
        .single()

      if (statsError) throw statsError

      // Получаем актуальный online count
      const { data: onlineData, error: onlineError } = await supabase
        .rpc('get_online_count')

      const onlineCount = onlineError ? (statsData.online_count || 1) : Math.max(onlineData || 1, 1)

      return {
        users: statsData.users_count || 0,
        online: onlineCount,
        backgrounds: statsData.backgrounds_count || 0,
        videos: statsData.videos_count || 0,
        lastUpdated: Date.now()
      }
    } catch (fallbackError) {
      console.error('[Stats] Fallback также упал:', fallbackError)
      throw fallbackError
    }
  }
}

// ============================================
// ОБНОВЛЕНИЕ ПРИСУТСТВИЯ (HEARTBEAT)
// ============================================

let heartbeatInterval = null
let lastHeartbeatTime = 0
const HEARTBEAT_INTERVAL = 45000 // 45 секунд

/**
 * Обновляет присутствие текущего пользователя
 * @param {string} userId - ID текущего пользователя
 * @returns {Promise<boolean>} true если успешно
 */
export async function updatePresence(userId) {
  if (!userId) {
    console.warn('[Presence] updatePresence вызван без userId')
    return false
  }

  try {
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('[Presence] Ошибка обновления присутствия:', error)
      return false
    }

    lastHeartbeatTime = Date.now()
    return true
  } catch (error) {
    console.error('[Presence] Ошибка updatePresence:', error)
    return false
  }
}

/**
 * Запускает автоматический heartbeat для пользователя
 * @param {string} userId - ID пользователя
 */
export function startPresenceHeartbeat(userId) {
  if (!userId) {
    console.warn('[Presence] startPresenceHeartbeat без userId')
    return
  }

  // Останавливаем предыдущий heartbeat если был
  stopPresenceHeartbeat()

  // Сразу обновляем присутствие
  updatePresence(userId)

  // Запускаем периодическое обновление
  heartbeatInterval = setInterval(() => {
    // Проверяем, не скрыта ли вкладка
    if (document.visibilityState === 'visible') {
      updatePresence(userId)
    }
  }, HEARTBEAT_INTERVAL)

  // Обновляем при возвращении на вкладку
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const timeSinceLastBeat = Date.now() - lastHeartbeatTime
      // Если прошло больше половины интервала, обновляем сразу
      if (timeSinceLastBeat > HEARTBEAT_INTERVAL / 2) {
        updatePresence(userId)
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Обновляем при уходе со страницы (best effort)
  const handleBeforeUnload = () => {
    // Используем sendBeacon для надёжной отправки
    const url = `${supabase.supabaseUrl}/rest/v1/user_presence`
    const payload = JSON.stringify({
      user_id: userId,
      last_seen: new Date().toISOString()
    })
    
    try {
      navigator.sendBeacon(url, new Blob([payload], {
        type: 'application/json'
      }))
    } catch (e) {
      // Игнорируем ошибки при закрытии
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  // Сохраняем функции очистки для stopPresenceHeartbeat
  heartbeatInterval._cleanupFns = [
    () => document.removeEventListener('visibilitychange', handleVisibilityChange),
    () => window.removeEventListener('beforeunload', handleBeforeUnload)
  ]

  console.log('[Presence] Heartbeat запущен для пользователя', userId)
}

/**
 * Останавливает автоматический heartbeat
 */
export function stopPresenceHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    
    // Вызываем cleanup функции
    if (heartbeatInterval._cleanupFns) {
      heartbeatInterval._cleanupFns.forEach(fn => fn())
    }
    
    heartbeatInterval = null
    console.log('[Presence] Heartbeat остановлен')
  }
}

// ============================================
// ПОДПИСКА НА ОБНОВЛЕНИЯ (POLLING)
// ============================================

/**
 * Подписка на периодические обновления статистики
 * @param {Function} callback - Функция обратного вызова
 * @returns {Function} Функция отписки
 */
export function subscribeToStats(callback) {
  // Сразу получаем текущую статистику
  getSiteStats().then(callback).catch(err => {
    console.warn('[Stats] Ошибка начальной загрузки:', err)
    callback(statsCache) // Возвращаем кэш
  })

  // Обновляем каждые 30 секунд
  const interval = setInterval(async () => {
    try {
      const stats = await getSiteStats()
      callback(stats)
    } catch (error) {
      console.warn('[Stats] Ошибка в подписке:', error)
      // Ничего не делаем - getSiteStats уже вернёт кэш
    }
  }, 30000)

  // Функция отписки
  return () => {
    clearInterval(interval)
  }
}

// ============================================
// ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ
// ============================================

/**
 * Принудительно обновляет статистику, игнорируя кэш
 * @returns {Promise<Object>} Свежая статистика
 */
export async function refreshStats() {
  lastFetchTime = 0 // Сбрасываем время кэша
  return getSiteStats()
}

// ============================================
// ЭКСПОРТ
// ============================================

export default {
  getSiteStats,
  updatePresence,
  startPresenceHeartbeat,
  stopPresenceHeartbeat,
  subscribeToStats,
  refreshStats
}
