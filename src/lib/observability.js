// ============================================================================
// D MOTION - OBSERVABILITY (LOGS/METRICS) BASICS
// ============================================================================

// ============================================================================
// 1. STRUCTURED LOGGING
// ============================================================================

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
}

let currentLogLevel = LogLevels.INFO

// В продакшене отключаем DEBUG
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  currentLogLevel = LogLevels.WARN
}

/**
 * Структурированный логгер
 */
class Logger {
  constructor(context = 'app') {
    this.context = context
    this.metadata = {}
  }

  /**
   * Создаёт дочерний логгер с контекстом
   */
  child(childContext) {
    const logger = new Logger(`${this.context}:${childContext}`)
    logger.metadata = { ...this.metadata }
    return logger
  }

  /**
   * Добавляет метаданные
   */
  with(metadata) {
    const logger = new Logger(this.context)
    logger.metadata = { ...this.metadata, ...metadata }
    return logger
  }

  /**
   * Форматирует лог
   */
  format(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...this.metadata,
      ...data
    }
  }

  debug(message, data) {
    if (currentLogLevel <= LogLevels.DEBUG) {
      console.debug('[DEBUG]', this.format('debug', message, data))
    }
  }

  info(message, data) {
    if (currentLogLevel <= LogLevels.INFO) {
      console.info('[INFO]', this.format('info', message, data))
    }
  }

  warn(message, data) {
    if (currentLogLevel <= LogLevels.WARN) {
      console.warn('[WARN]', this.format('warn', message, data))
    }
  }

  error(message, error, data) {
    if (currentLogLevel <= LogLevels.ERROR) {
      console.error('[ERROR]', this.format('error', message, {
        ...data,
        error: error?.message,
        stack: error?.stack
      }))
    }
    
    // Отправляем в систему мониторинга
    this.sendToMonitoring('error', message, error, data)
  }

  fatal(message, error, data) {
    console.error('[FATAL]', this.format('fatal', message, {
      ...data,
      error: error?.message,
      stack: error?.stack
    }))
    
    this.sendToMonitoring('fatal', message, error, data)
  }

  /**
   * Отправляет в систему мониторинга (заглушка)
   */
  sendToMonitoring(level, message, error, data) {
    // Здесь можно интегрировать Sentry, LogRocket и т.д.
    // Пока сохраняем в localStorage для отладки
    try {
      const logs = JSON.parse(localStorage.getItem('dm_error_logs') || '[]')
      logs.push({
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        message,
        error: error?.message,
        data
      })
      // Храним последние 100 ошибок
      if (logs.length > 100) logs.shift()
      localStorage.setItem('dm_error_logs', JSON.stringify(logs))
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }
}

export const logger = new Logger('dmotion')

// ============================================================================
// 2. PERFORMANCE METRICS
// ============================================================================

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map()
    this.timers = new Map()
  }

  /**
   * Начинает таймер
   */
  startTimer(name) {
    this.timers.set(name, performance.now())
  }

  /**
   * Останавливает таймер и записывает метрику
   */
  endTimer(name) {
    const start = this.timers.get(name)
    if (!start) return 0
    
    const duration = performance.now() - start
    this.timers.delete(name)
    
    this.record(name, duration)
    return duration
  }

  /**
   * Записывает метрику
   */
  record(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: []
      })
    }
    
    const metric = this.metrics.get(name)
    metric.count++
    metric.sum += value
    metric.min = Math.min(metric.min, value)
    metric.max = Math.max(metric.max, value)
    
    // Храним последние 100 значений для percentiles
    metric.values.push(value)
    if (metric.values.length > 100) metric.values.shift()
  }

  /**
   * Инкрементирует счётчик
   */
  increment(name, value = 1) {
    const current = this.metrics.get(name)?.sum || 0
    this.metrics.set(name, {
      count: 1,
      sum: current + value,
      min: current + value,
      max: current + value,
      values: []
    })
  }

  /**
   * Получает статистику метрики
   */
  getStats(name) {
    const metric = this.metrics.get(name)
    if (!metric) return null
    
    const sorted = [...metric.values].sort((a, b) => a - b)
    
    return {
      count: metric.count,
      sum: metric.sum,
      avg: metric.sum / metric.count,
      min: metric.min,
      max: metric.max,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0
    }
  }

  /**
   * Получает все метрики
   */
  getAllStats() {
    const result = {}
    for (const name of this.metrics.keys()) {
      result[name] = this.getStats(name)
    }
    return result
  }

  /**
   * Очищает метрики
   */
  clear() {
    this.metrics.clear()
    this.timers.clear()
  }
}

export const metrics = new PerformanceMetrics()

// ============================================================================
// 3. REQUEST TRACING
// ============================================================================

class RequestTracer {
  constructor() {
    this.traces = new Map()
  }

  /**
   * Генерирует trace ID
   */
  generateTraceId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Начинает трейс
   */
  startTrace(name, metadata = {}) {
    const traceId = this.generateTraceId()
    
    this.traces.set(traceId, {
      id: traceId,
      name,
      startTime: performance.now(),
      spans: [],
      metadata
    })
    
    return traceId
  }

  /**
   * Добавляет span к трейсу
   */
  addSpan(traceId, spanName, metadata = {}) {
    const trace = this.traces.get(traceId)
    if (!trace) return null
    
    const spanId = `${traceId}-${trace.spans.length}`
    const span = {
      id: spanId,
      name: spanName,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      metadata
    }
    
    trace.spans.push(span)
    return spanId
  }

  /**
   * Завершает span
   */
  endSpan(traceId, spanId) {
    const trace = this.traces.get(traceId)
    if (!trace) return
    
    const span = trace.spans.find(s => s.id === spanId)
    if (span) {
      span.endTime = performance.now()
      span.duration = span.endTime - span.startTime
    }
  }

  /**
   * Завершает трейс
   */
  endTrace(traceId) {
    const trace = this.traces.get(traceId)
    if (!trace) return null
    
    trace.endTime = performance.now()
    trace.duration = trace.endTime - trace.startTime
    
    // Логируем медленные запросы
    if (trace.duration > 3000) {
      logger.warn('Slow request detected', {
        traceId,
        name: trace.name,
        duration: trace.duration,
        spans: trace.spans.map(s => ({
          name: s.name,
          duration: s.duration
        }))
      })
    }
    
    // Записываем метрику
    metrics.record(`trace:${trace.name}`, trace.duration)
    
    // Удаляем старые трейсы
    if (this.traces.size > 100) {
      const oldest = this.traces.keys().next().value
      this.traces.delete(oldest)
    }
    
    return trace
  }

  /**
   * Получает трейс
   */
  getTrace(traceId) {
    return this.traces.get(traceId)
  }
}

export const tracer = new RequestTracer()

// ============================================================================
// 4. HEALTH CHECK
// ============================================================================

/**
 * Проверяет здоровье системы
 */
export async function healthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  }

  // 1. Supabase connection
  try {
    const start = performance.now()
    const { supabase } = await import('./supabaseClient')
    const { error } = await supabase.from('profiles').select('id').limit(1)
    const duration = performance.now() - start
    
    results.checks.supabase = {
      status: error ? 'unhealthy' : 'healthy',
      latency: Math.round(duration),
      error: error?.message
    }
  } catch (e) {
    results.checks.supabase = { status: 'unhealthy', error: e.message }
  }

  // 2. LocalStorage
  try {
    localStorage.setItem('health_check', 'ok')
    localStorage.removeItem('health_check')
    results.checks.localStorage = { status: 'healthy' }
  } catch (e) {
    results.checks.localStorage = { status: 'unhealthy', error: e.message }
  }

  // 3. Network
  results.checks.network = {
    status: navigator.onLine ? 'healthy' : 'unhealthy',
    online: navigator.onLine
  }

  // 4. Memory (если доступно)
  if (performance.memory) {
    const memory = performance.memory
    results.checks.memory = {
      status: memory.usedJSHeapSize / memory.jsHeapSizeLimit < 0.9 ? 'healthy' : 'warning',
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  // Определяем общий статус
  const unhealthy = Object.values(results.checks).some(c => c.status === 'unhealthy')
  const warning = Object.values(results.checks).some(c => c.status === 'warning')
  
  results.status = unhealthy ? 'unhealthy' : warning ? 'warning' : 'healthy'
  
  return results
}

// ============================================================================
// 5. USER SESSION TRACKING
// ============================================================================

class SessionTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.pageViews = 0
    this.startTime = Date.now()
    this.events = []
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('dm_session_id')
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem('dm_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Записывает событие
   */
  trackEvent(name, data = {}) {
    this.events.push({
      name,
      data,
      timestamp: Date.now()
    })
    
    // Храним последние 100 событий
    if (this.events.length > 100) {
      this.events.shift()
    }
  }

  /**
   * Записывает просмотр страницы
   */
  trackPageView(path) {
    this.pageViews++
    this.trackEvent('page_view', { path })
  }

  /**
   * Получает статистику сессии
   */
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      pageViews: this.pageViews,
      eventsCount: this.events.length
    }
  }
}

export const sessionTracker = new SessionTracker()

// ============================================================================
// 6. PERFORMANCE OBSERVER (Web Vitals)
// ============================================================================

export function observeWebVitals(callback) {
  if (typeof PerformanceObserver === 'undefined') return

  // LCP (Largest Contentful Paint)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      callback('LCP', lastEntry.startTime)
      metrics.record('web_vital:lcp', lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {}

  // FID (First Input Delay)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        callback('FID', entry.processingStart - entry.startTime)
        metrics.record('web_vital:fid', entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch (e) {}

  // CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      callback('CLS', clsValue)
      metrics.record('web_vital:cls', clsValue)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch (e) {}
}

// Автоматически начинаем наблюдение
if (typeof window !== 'undefined') {
  observeWebVitals((name, value) => {
    logger.debug(`Web Vital: ${name}`, { value: Math.round(value) })
  })
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
  // Logging
  logger,
  LogLevels,
  
  // Metrics
  metrics,
  
  // Tracing
  tracer,
  
  // Health
  healthCheck,
  
  // Session
  sessionTracker,
  
  // Web Vitals
  observeWebVitals
}
