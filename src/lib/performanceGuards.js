// ============================================================================
// D MOTION - ПРЕДОХРАНИТЕЛИ ПРОИЗВОДИТЕЛЬНОСТИ
// Защита от перегрузки Supabase при массовом листании
// ============================================================================

import { supabase } from './supabaseClient'

// ============================================================================
// 1. СТАБИЛЬНЫЙ РАНДОМ НА СЕССИЮ
// ============================================================================

const SESSION_SEED_KEY = 'dm_session_seed'

/**
 * Получает или создаёт seed для стабильного рандома на сессию
 */
export function getSessionSeed() {
  let seed = sessionStorage.getItem(SESSION_SEED_KEY)
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem(SESSION_SEED_KEY, seed)
  }
  return seed
}

/**
 * Детерминированный рандом на основе seed
 */
export function seededRandom(seed, index) {
  const hash = hashCode(seed + index)
  return (hash % 1000000) / 1000000
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Перемешивает массив стабильно на основе seed
 */
export function shuffleWithSeed(array, seed) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed, i) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ============================================================================
// 2. KEYSET ПАГИНАЦИЯ (без OFFSET)
// ============================================================================

/**
 * Создаёт keyset-запрос для пагинации
 * @param {string} table - имя таблицы
 * @param {object} options - опции запроса
 */
export function createKeysetQuery(table, options = {}) {
  const {
    select = '*',
    pageSize = 24,
    lastCreatedAt = null,
    lastId = null,
    orderBy = 'created_at',
    ascending = false,
    filters = {}
  } = options

  let query = supabase
    .from(table)
    .select(select)
    .order(orderBy, { ascending })
    .order('id', { ascending })
    .limit(pageSize)

  // Keyset условие: "дай следующую пачку после last_created_at + last_id"
  if (lastCreatedAt && lastId) {
    if (ascending) {
      query = query.or(`${orderBy}.gt.${lastCreatedAt},and(${orderBy}.eq.${lastCreatedAt},id.gt.${lastId})`)
    } else {
      query = query.or(`${orderBy}.lt.${lastCreatedAt},and(${orderBy}.eq.${lastCreatedAt},id.lt.${lastId})`)
    }
  }

  // Применяем фильтры
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'boolean') {
        query = query.eq(key, value)
      } else if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    }
  })

  return query
}

// ============================================================================
// 3. ДЕБАУНС С ОТМЕНОЙ ПРЕДЫДУЩИХ ЗАПРОСОВ
// ============================================================================

const abortControllers = new Map()

/**
 * Создаёт дебаунс-функцию с отменой предыдущих запросов
 */
export function createDebouncedSearch(searchFn, delay = 400) {
  let timeoutId = null
  const key = Symbol('search')

  return async (query, ...args) => {
    // Отменяем предыдущий таймаут
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Отменяем предыдущий запрос
    const prevController = abortControllers.get(key)
    if (prevController) {
      prevController.abort()
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        const controller = new AbortController()
        abortControllers.set(key, controller)

        try {
          const result = await searchFn(query, ...args, controller.signal)
          resolve(result)
        } catch (error) {
          if (error.name === 'AbortError') {
            // Запрос отменён — это нормально
            resolve(null)
          } else {
            reject(error)
          }
        } finally {
          abortControllers.delete(key)
        }
      }, delay)
    })
  }
}

// ============================================================================
// 4. БАТЧИНГ ПРОСМОТРОВ (отправка пачкой раз в 30-60 сек)
// ============================================================================

class ViewsBatcher {
  constructor(flushInterval = 30000) {
    this.views = new Map() // work_id -> count
    this.flushInterval = flushInterval
    this.timer = null
    this.isFlushing = false
  }

  /**
   * Регистрирует просмотр (НЕ отправляет сразу в БД)
   */
  trackView(workId, userId = null) {
    if (!workId) return

    const key = workId
    const current = this.views.get(key) || { count: 0, userId }
    current.count++
    this.views.set(key, current)

    // Запускаем таймер если ещё не запущен
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval)
    }
  }

  /**
   * Отправляет накопленные просмотры в БД
   */
  async flush() {
    if (this.isFlushing || this.views.size === 0) return

    this.isFlushing = true
    this.timer = null

    const viewsToSend = new Map(this.views)
    this.views.clear()

    try {
      // Отправляем пачкой через RPC или batch insert
      const viewsArray = Array.from(viewsToSend.entries()).map(([workId, data]) => ({
        work_id: workId,
        user_id: data.userId,
        view_count: data.count,
        viewed_at: new Date().toISOString()
      }))

      if (viewsArray.length > 0) {
        // Используем upsert для агрегации
        await supabase.rpc('batch_increment_views', { views: viewsArray }).catch(() => {
          // Fallback: простой insert
          // supabase.from('work_views_batch').insert(viewsArray)
        })
      }
    } catch (error) {
      // При ошибке возвращаем просмотры обратно
      viewsToSend.forEach((data, key) => {
        const current = this.views.get(key) || { count: 0, userId: data.userId }
        current.count += data.count
        this.views.set(key, current)
      })
    } finally {
      this.isFlushing = false

      // Если накопились новые просмотры — запускаем таймер снова
      if (this.views.size > 0 && !this.timer) {
        this.timer = setTimeout(() => this.flush(), this.flushInterval)
      }
    }
  }

  /**
   * Принудительная отправка (при закрытии страницы)
   */
  forceFlush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.flush()
  }
}

// Глобальный экземпляр
export const viewsBatcher = new ViewsBatcher(30000)

// Отправляем при закрытии страницы
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    viewsBatcher.forceFlush()
  })
  
  // Также при visibility change (переключение вкладки)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      viewsBatcher.forceFlush()
    }
  })
}

// ============================================================================
// 5. КЭШ СТРАНИЦ В ПАМЯТИ
// ============================================================================

class PagesCache {
  constructor(maxPages = 10) {
    this.cache = new Map()
    this.maxPages = maxPages
    this.order = [] // LRU order
  }

  /**
   * Генерирует ключ кэша
   */
  getKey(table, filters, cursor) {
    return JSON.stringify({ table, filters, cursor })
  }

  /**
   * Получает страницу из кэша
   */
  get(table, filters, cursor) {
    const key = this.getKey(table, filters, cursor)
    const cached = this.cache.get(key)
    
    if (cached) {
      // Обновляем LRU порядок
      this.order = this.order.filter(k => k !== key)
      this.order.push(key)
      return cached
    }
    
    return null
  }

  /**
   * Сохраняет страницу в кэш
   */
  set(table, filters, cursor, data) {
    const key = this.getKey(table, filters, cursor)
    
    // Удаляем старые если превышен лимит
    while (this.order.length >= this.maxPages) {
      const oldKey = this.order.shift()
      this.cache.delete(oldKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    this.order.push(key)
  }

  /**
   * Очищает кэш для таблицы
   */
  invalidate(table) {
    const keysToDelete = []
    this.cache.forEach((_, key) => {
      if (key.includes(`"table":"${table}"`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.order = this.order.filter(k => k !== key)
    })
  }

  /**
   * Полная очистка
   */
  clear() {
    this.cache.clear()
    this.order = []
  }
}

export const pagesCache = new PagesCache(10)

// ============================================================================
// 6. RATE LIMITING (защита от частых запросов)
// ============================================================================

class RateLimiter {
  constructor() {
    this.requests = new Map() // endpoint -> timestamps[]
  }

  /**
   * Проверяет можно ли делать запрос
   * @param {string} endpoint - идентификатор запроса
   * @param {number} maxRequests - максимум запросов
   * @param {number} windowMs - окно в миллисекундах
   */
  canRequest(endpoint, maxRequests = 10, windowMs = 10000) {
    const now = Date.now()
    const timestamps = this.requests.get(endpoint) || []
    
    // Удаляем старые
    const recent = timestamps.filter(t => now - t < windowMs)
    
    if (recent.length >= maxRequests) {
      return false
    }
    
    recent.push(now)
    this.requests.set(endpoint, recent)
    return true
  }

  /**
   * Время до следующего разрешённого запроса
   */
  getWaitTime(endpoint, maxRequests = 10, windowMs = 10000) {
    const now = Date.now()
    const timestamps = this.requests.get(endpoint) || []
    const recent = timestamps.filter(t => now - t < windowMs)
    
    if (recent.length < maxRequests) {
      return 0
    }
    
    const oldest = Math.min(...recent)
    return windowMs - (now - oldest)
  }
}

export const rateLimiter = new RateLimiter()

// ============================================================================
// 7. ЗАЩИТА ОТ БЕСКОНЕЧНОГО СКРОЛЛА
// ============================================================================

class ScrollGuard {
  constructor() {
    this.isLoading = false
    this.lastLoadTime = 0
    this.minInterval = 500 // Минимум 500мс между загрузками
  }

  /**
   * Проверяет можно ли загружать следующую страницу
   */
  canLoadMore() {
    if (this.isLoading) return false
    
    const now = Date.now()
    if (now - this.lastLoadTime < this.minInterval) {
      return false
    }
    
    return true
  }

  /**
   * Начало загрузки
   */
  startLoading() {
    this.isLoading = true
  }

  /**
   * Конец загрузки
   */
  endLoading() {
    this.isLoading = false
    this.lastLoadTime = Date.now()
  }
}

export const scrollGuard = new ScrollGuard()

// ============================================================================
// 8. ГЛАВНЫЙ ХУК ДЛЯ БИБЛИОТЕКИ
// ============================================================================

/**
 * Загружает страницу с учётом всех предохранителей
 */
export async function fetchLibraryPage(table, options = {}) {
  const {
    select = '*',
    pageSize = 24,
    cursor = null, // { lastCreatedAt, lastId }
    filters = {},
    shuffle = false,
    cacheEnabled = true
  } = options

  // 1. Проверяем rate limit
  if (!rateLimiter.canRequest(`library_${table}`, 20, 10000)) {
    const waitTime = rateLimiter.getWaitTime(`library_${table}`, 20, 10000)
    throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`)
  }

  // 2. Проверяем scroll guard
  if (!scrollGuard.canLoadMore()) {
    return null
  }

  // 3. Проверяем кэш
  if (cacheEnabled) {
    const cached = pagesCache.get(table, filters, cursor)
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 минута
      return cached.data
    }
  }

  scrollGuard.startLoading()

  try {
    // 4. Создаём keyset запрос
    const query = createKeysetQuery(table, {
      select,
      pageSize,
      lastCreatedAt: cursor?.lastCreatedAt,
      lastId: cursor?.lastId,
      filters
    })

    const { data, error } = await query

    if (error) throw error

    let result = data || []

    // 5. Стабильный рандом если нужен
    if (shuffle && result.length > 0) {
      const seed = getSessionSeed()
      result = shuffleWithSeed(result, seed + (cursor?.lastId || ''))
    }

    // 6. Сохраняем в кэш
    if (cacheEnabled && result.length > 0) {
      pagesCache.set(table, filters, cursor, result)
    }

    return result
  } finally {
    scrollGuard.endLoading()
  }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
  // Рандом
  getSessionSeed,
  shuffleWithSeed,
  seededRandom,
  
  // Пагинация
  createKeysetQuery,
  fetchLibraryPage,
  
  // Дебаунс
  createDebouncedSearch,
  
  // Батчинг
  viewsBatcher,
  
  // Кэш
  pagesCache,
  
  // Защита
  rateLimiter,
  scrollGuard
}
