// ============================================================================
// D MOTION - ERROR HANDLING & RESILIENCE GUARDRAILS
// ============================================================================

// ============================================================================
// 1. RETRY С EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Выполняет функцию с повторными попытками
 * @param {Function} fn - асинхронная функция
 * @param {object} options - опции
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => true
  } = options

  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Не ретраим если не нужно
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff с jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )
      
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, error.message)
      await sleep(delay)
    }
  }
  
  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// 2. CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 30000
    this.halfOpenRequests = options.halfOpenRequests || 1
    
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failures = 0
    this.successes = 0
    this.lastFailureTime = null
    this.halfOpenAttempts = 0
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      // Проверяем можно ли перейти в HALF_OPEN
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN'
        this.halfOpenAttempts = 0
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenAttempts >= this.halfOpenRequests) {
      throw new Error('Circuit breaker is HALF_OPEN, waiting for test requests')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.halfOpenRequests) {
        this.state = 'CLOSED'
        this.failures = 0
        this.successes = 0
      }
    } else {
      this.failures = 0
    }
  }

  onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN'
      this.halfOpenAttempts = 0
    } else if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Глобальные circuit breakers для разных сервисов
export const circuitBreakers = {
  supabase: new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }),
  r2: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 })
}

// ============================================================================
// 3. GRACEFUL DEGRADATION
// ============================================================================

/**
 * Выполняет с fallback при ошибке
 */
export async function withFallback(fn, fallbackFn, options = {}) {
  const { logError = true } = options
  
  try {
    return await fn()
  } catch (error) {
    if (logError) {
      console.error('Primary function failed, using fallback:', error.message)
    }
    return await fallbackFn(error)
  }
}

/**
 * Возвращает кэшированные данные при ошибке
 */
export function withCacheFallback(cacheKey, fn, cache = localStorage) {
  return async () => {
    try {
      const result = await fn()
      // Сохраняем в кэш при успехе
      cache.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }))
      return result
    } catch (error) {
      // Пробуем вернуть из кэша
      const cached = cache.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        console.warn(`Using cached data from ${new Date(timestamp).toISOString()}`)
        return data
      }
      throw error
    }
  }
}

// ============================================================================
// 4. TIMEOUT WRAPPER
// ============================================================================

/**
 * Выполняет с таймаутом
 */
export async function withTimeout(fn, timeoutMs = 10000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// ============================================================================
// 5. ERROR CLASSIFICATION
// ============================================================================

export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
}

/**
 * Классифицирует ошибку
 */
export function classifyError(error) {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status || error?.statusCode
  
  if (!navigator.onLine || message.includes('network') || message.includes('fetch')) {
    return ErrorTypes.NETWORK
  }
  
  if (status === 401 || status === 403 || message.includes('auth') || message.includes('unauthorized')) {
    return ErrorTypes.AUTH
  }
  
  if (status === 400 || message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION
  }
  
  if (status === 404 || message.includes('not found')) {
    return ErrorTypes.NOT_FOUND
  }
  
  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return ErrorTypes.RATE_LIMIT
  }
  
  if (status >= 500 || message.includes('server')) {
    return ErrorTypes.SERVER
  }
  
  return ErrorTypes.UNKNOWN
}

/**
 * Получает user-friendly сообщение об ошибке
 */
export function getErrorMessage(error) {
  const type = classifyError(error)
  
  const messages = {
    [ErrorTypes.NETWORK]: 'Проверьте подключение к интернету',
    [ErrorTypes.AUTH]: 'Необходима авторизация',
    [ErrorTypes.VALIDATION]: 'Проверьте введённые данные',
    [ErrorTypes.NOT_FOUND]: 'Данные не найдены',
    [ErrorTypes.RATE_LIMIT]: 'Слишком много запросов, подождите',
    [ErrorTypes.SERVER]: 'Ошибка сервера, попробуйте позже',
    [ErrorTypes.UNKNOWN]: 'Произошла ошибка'
  }
  
  return messages[type]
}

/**
 * Проверяет стоит ли ретраить ошибку
 */
export function isRetryable(error) {
  const type = classifyError(error)
  return [ErrorTypes.NETWORK, ErrorTypes.SERVER, ErrorTypes.RATE_LIMIT].includes(type)
}

// ============================================================================
// 6. GLOBAL ERROR HANDLER
// ============================================================================

const errorListeners = new Set()

export function onError(listener) {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

export function reportError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    type: classifyError(error),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : null
  }
  
  // Уведомляем слушателей
  errorListeners.forEach(listener => {
    try {
      listener(errorInfo)
    } catch (e) {
      console.error('Error in error listener:', e)
    }
  })
  
  // Логируем
  console.error('[D MOTION Error]', errorInfo)
  
  return errorInfo
}

// Глобальный обработчик необработанных ошибок
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandledrejection' })
  })
  
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), { type: 'error' })
  })
}

export default {
  withRetry,
  withFallback,
  withCacheFallback,
  withTimeout,
  circuitBreakers,
  classifyError,
  getErrorMessage,
  isRetryable,
  reportError,
  onError,
  ErrorTypes
}
