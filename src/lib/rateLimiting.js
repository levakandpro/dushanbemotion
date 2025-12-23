// ============================================================================
// D MOTION - RATE LIMITING & ANTI-ABUSE GUARDRAILS
// ============================================================================

// ============================================================================
// 1. ADVANCED RATE LIMITER (Token Bucket Algorithm)
// ============================================================================

class TokenBucket {
  constructor(options = {}) {
    this.capacity = options.capacity || 10        // Максимум токенов
    this.refillRate = options.refillRate || 1     // Токенов в секунду
    this.tokens = this.capacity
    this.lastRefill = Date.now()
  }

  refill() {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }

  consume(tokens = 1) {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }

  getWaitTime(tokens = 1) {
    this.refill()
    
    if (this.tokens >= tokens) {
      return 0
    }
    
    const needed = tokens - this.tokens
    return Math.ceil(needed / this.refillRate * 1000)
  }
}

// ============================================================================
// 2. ENDPOINT-SPECIFIC RATE LIMITERS
// ============================================================================

const rateLimiters = {
  // Поиск: 5 запросов в 10 сек
  search: new TokenBucket({ capacity: 5, refillRate: 0.5 }),
  
  // Загрузка страниц: 20 запросов в 10 сек
  feed: new TokenBucket({ capacity: 20, refillRate: 2 }),
  
  // Лайки: 30 в минуту
  likes: new TokenBucket({ capacity: 30, refillRate: 0.5 }),
  
  // Комментарии: 10 в минуту
  comments: new TokenBucket({ capacity: 10, refillRate: 0.17 }),
  
  // Загрузка файлов: 5 в минуту
  uploads: new TokenBucket({ capacity: 5, refillRate: 0.08 }),
  
  // API общий: 100 в минуту
  api: new TokenBucket({ capacity: 100, refillRate: 1.67 })
}

/**
 * Проверяет rate limit для endpoint
 */
export function checkRateLimit(endpoint) {
  const limiter = rateLimiters[endpoint] || rateLimiters.api
  return limiter.consume()
}

/**
 * Получает время ожидания
 */
export function getRateLimitWait(endpoint) {
  const limiter = rateLimiters[endpoint] || rateLimiters.api
  return limiter.getWaitTime()
}

/**
 * Декоратор для функций с rate limiting
 */
export function withRateLimit(fn, endpoint = 'api') {
  return async (...args) => {
    if (!checkRateLimit(endpoint)) {
      const waitTime = getRateLimitWait(endpoint)
      throw new RateLimitError(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`, waitTime)
    }
    return fn(...args)
  }
}

class RateLimitError extends Error {
  constructor(message, waitTime) {
    super(message)
    this.name = 'RateLimitError'
    this.waitTime = waitTime
  }
}

// ============================================================================
// 3. ANTI-ABUSE: SPAM DETECTION
// ============================================================================

class SpamDetector {
  constructor() {
    this.actions = new Map() // userId -> action timestamps
    this.blocked = new Set()
    this.warnings = new Map() // userId -> warning count
  }

  /**
   * Записывает действие пользователя
   */
  recordAction(userId, actionType) {
    if (!userId) return
    
    const key = `${userId}:${actionType}`
    const timestamps = this.actions.get(key) || []
    timestamps.push(Date.now())
    
    // Храним только последние 100 действий
    if (timestamps.length > 100) {
      timestamps.shift()
    }
    
    this.actions.set(key, timestamps)
  }

  /**
   * Проверяет на спам
   */
  isSpamming(userId, actionType, options = {}) {
    const {
      maxActions = 10,
      windowMs = 60000,
      blockDuration = 300000 // 5 минут
    } = options
    
    if (!userId) return false
    
    // Проверяем блокировку
    if (this.blocked.has(userId)) {
      return true
    }
    
    const key = `${userId}:${actionType}`
    const timestamps = this.actions.get(key) || []
    const now = Date.now()
    
    // Считаем действия за окно
    const recentActions = timestamps.filter(t => now - t < windowMs)
    
    if (recentActions.length >= maxActions) {
      // Увеличиваем счётчик предупреждений
      const warnings = (this.warnings.get(userId) || 0) + 1
      this.warnings.set(userId, warnings)
      
      // После 3 предупреждений — блокируем
      if (warnings >= 3) {
        this.blocked.add(userId)
        setTimeout(() => this.blocked.delete(userId), blockDuration)
      }
      
      return true
    }
    
    return false
  }

  /**
   * Проверяет заблокирован ли пользователь
   */
  isBlocked(userId) {
    return this.blocked.has(userId)
  }

  /**
   * Очищает историю пользователя
   */
  clearUser(userId) {
    this.blocked.delete(userId)
    this.warnings.delete(userId)
    
    // Удаляем все действия пользователя
    for (const key of this.actions.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.actions.delete(key)
      }
    }
  }
}

export const spamDetector = new SpamDetector()

// ============================================================================
// 4. ANTI-ABUSE: DUPLICATE DETECTION
// ============================================================================

class DuplicateDetector {
  constructor(windowMs = 5000) {
    this.recent = new Map() // hash -> timestamp
    this.windowMs = windowMs
  }

  /**
   * Генерирует хэш контента
   */
  hash(content) {
    if (typeof content === 'string') {
      return content.trim().toLowerCase().replace(/\s+/g, ' ')
    }
    return JSON.stringify(content)
  }

  /**
   * Проверяет дубликат
   */
  isDuplicate(content, userId = null) {
    const hash = this.hash(content)
    const key = userId ? `${userId}:${hash}` : hash
    const now = Date.now()
    
    // Очищаем старые
    for (const [k, timestamp] of this.recent.entries()) {
      if (now - timestamp > this.windowMs) {
        this.recent.delete(k)
      }
    }
    
    if (this.recent.has(key)) {
      return true
    }
    
    this.recent.set(key, now)
    return false
  }
}

export const duplicateDetector = new DuplicateDetector(5000)

// ============================================================================
// 5. ANTI-ABUSE: SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

class SuspiciousActivityDetector {
  constructor() {
    this.patterns = new Map() // userId -> activity pattern
  }

  /**
   * Анализирует паттерн активности
   */
  analyze(userId, action) {
    if (!userId) return { suspicious: false }
    
    const pattern = this.patterns.get(userId) || {
      actions: [],
      firstSeen: Date.now(),
      flags: []
    }
    
    pattern.actions.push({
      type: action,
      timestamp: Date.now()
    })
    
    // Храним последние 1000 действий
    if (pattern.actions.length > 1000) {
      pattern.actions = pattern.actions.slice(-1000)
    }
    
    // Анализируем
    const flags = []
    
    // 1. Слишком быстрые действия (бот)
    const recentActions = pattern.actions.filter(a => Date.now() - a.timestamp < 60000)
    if (recentActions.length > 50) {
      flags.push('TOO_FAST')
    }
    
    // 2. Однотипные действия (бот)
    const actionTypes = recentActions.map(a => a.type)
    const uniqueTypes = new Set(actionTypes)
    if (recentActions.length > 20 && uniqueTypes.size === 1) {
      flags.push('REPETITIVE')
    }
    
    // 3. Ночная активность (подозрительно для региона)
    const hour = new Date().getHours()
    if (hour >= 2 && hour <= 5 && recentActions.length > 30) {
      flags.push('NIGHT_ACTIVITY')
    }
    
    pattern.flags = flags
    this.patterns.set(userId, pattern)
    
    return {
      suspicious: flags.length > 0,
      flags,
      riskScore: flags.length / 3 // 0-1
    }
  }
}

export const suspiciousDetector = new SuspiciousActivityDetector()

// ============================================================================
// 6. REQUEST THROTTLE (для тяжёлых операций)
// ============================================================================

class RequestThrottle {
  constructor() {
    this.queues = new Map() // key -> queue
    this.processing = new Map() // key -> boolean
  }

  /**
   * Выполняет с throttle (один запрос за раз)
   */
  async throttle(key, fn) {
    // Добавляем в очередь
    if (!this.queues.has(key)) {
      this.queues.set(key, [])
    }
    
    return new Promise((resolve, reject) => {
      this.queues.get(key).push({ fn, resolve, reject })
      this.processQueue(key)
    })
  }

  async processQueue(key) {
    if (this.processing.get(key)) return
    
    const queue = this.queues.get(key)
    if (!queue || queue.length === 0) return
    
    this.processing.set(key, true)
    
    const { fn, resolve, reject } = queue.shift()
    
    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.processing.set(key, false)
      
      // Обрабатываем следующий
      if (queue.length > 0) {
        setTimeout(() => this.processQueue(key), 100)
      }
    }
  }
}

export const requestThrottle = new RequestThrottle()

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
  // Rate limiting
  checkRateLimit,
  getRateLimitWait,
  withRateLimit,
  rateLimiters,
  
  // Anti-abuse
  spamDetector,
  duplicateDetector,
  suspiciousDetector,
  
  // Throttle
  requestThrottle
}
