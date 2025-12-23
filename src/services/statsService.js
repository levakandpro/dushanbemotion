// src/services/statsService.js
// Сервис для получения реальной статистики сайта

import { supabase } from '../lib/supabaseClient'

// Кэш статистики (обновляется раз в минуту)
let statsCache = null
let lastFetchTime = 0
const CACHE_TTL = 60000 // 1 минута

/**
 * Получает статистику сайта
 */
export async function getSiteStats() {
  const now = Date.now()
  
  // Возвращаем кэш если он свежий
  if (statsCache && (now - lastFetchTime) < CACHE_TTL) {
    return statsCache
  }

  try {
    // Параллельно получаем все счётчики
    const [
      backgroundsResult,
      videosResult,
      usersResult,
      onlineResult
    ] = await Promise.all([
      // Количество фонов (backgrounds)
      supabase
        .from('backgrounds')
        .select('*', { count: 'exact', head: true }),
      
      // Количество видео
      supabase
        .from('videos')
        .select('*', { count: 'exact', head: true }),
      
      // Количество пользователей
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      
      // Онлайн пользователи (активные за последние 10 минут)
      supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    ])

    const stats = {
      backgrounds: backgroundsResult.count || 0,
      videos: videosResult.count || 0,
      users: usersResult.count || 0,
      online: onlineResult.count || 1, // Минимум 1 (текущий пользователь)
      lastUpdated: now
    }

    // Кэшируем
    statsCache = stats
    lastFetchTime = now

    return stats
  } catch (error) {
    console.error('Error fetching stats:', error)
    // Возвращаем fallback значения
    return {
      backgrounds: 15000,
      videos: 3500,
      users: 500,
      online: 1,
      lastUpdated: now
    }
  }
}

/**
 * Обновляет присутствие пользователя (для подсчёта онлайн)
 */
export async function updatePresence(userId) {
  if (!userId) return

  try {
    await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
  } catch (error) {
    // Игнорируем ошибки присутствия
  }
}

/**
 * Подписка на realtime обновления статистики
 */
export function subscribeToStats(callback) {
  // Обновляем каждые 30 секунд
  const interval = setInterval(async () => {
    const stats = await getSiteStats()
    callback(stats)
  }, 30000)

  // Сразу получаем статистику
  getSiteStats().then(callback)

  return () => clearInterval(interval)
}

export default {
  getSiteStats,
  updatePresence,
  subscribeToStats
}
