// ============================================================================
// D MOTION - DATA INTEGRITY CONSTRAINTS & TRANSACTIONS
// ============================================================================

import { supabase } from './supabaseClient'

// ============================================================================
// 1. OPTIMISTIC UPDATES С ROLLBACK
// ============================================================================

/**
 * Выполняет оптимистичное обновление с откатом при ошибке
 */
export async function optimisticUpdate(options) {
  const {
    optimisticFn,  // Функция для немедленного обновления UI
    serverFn,      // Функция для обновления на сервере
    rollbackFn,    // Функция для отката при ошибке
    onError        // Callback при ошибке
  } = options

  // 1. Сохраняем предыдущее состояние
  const previousState = optimisticFn()

  try {
    // 2. Выполняем на сервере
    const result = await serverFn()
    return result
  } catch (error) {
    // 3. Откатываем при ошибке
    if (rollbackFn) {
      rollbackFn(previousState)
    }
    if (onError) {
      onError(error)
    }
    throw error
  }
}

// ============================================================================
// 2. ТРАНЗАКЦИИ (через RPC)
// ============================================================================

/**
 * Выполняет несколько операций как транзакцию
 * Использует Supabase RPC для атомарности
 */
export async function transaction(operations) {
  // Supabase не поддерживает клиентские транзакции напрямую
  // Используем RPC функцию на сервере
  const { data, error } = await supabase.rpc('execute_transaction', {
    operations: JSON.stringify(operations)
  })

  if (error) throw error
  return data
}

/**
 * Безопасный перевод баланса (атомарная операция)
 */
export async function transferBalance(fromUserId, toUserId, amount) {
  const { data, error } = await supabase.rpc('transfer_balance', {
    from_user: fromUserId,
    to_user: toUserId,
    amount: amount
  })

  if (error) throw error
  return data
}

// ============================================================================
// 3. ВАЛИДАЦИЯ ДАННЫХ
// ============================================================================

const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value) ? null : 'Некорректный email'
  },
  
  username: (value) => {
    if (!value || value.length < 3) return 'Минимум 3 символа'
    if (value.length > 30) return 'Максимум 30 символов'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Только буквы, цифры и _'
    return null
  },
  
  password: (value) => {
    if (!value || value.length < 6) return 'Минимум 6 символов'
    return null
  },
  
  price: (value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return 'Некорректная цена'
    if (num > 1000000) return 'Слишком большая цена'
    return null
  },
  
  title: (value) => {
    if (!value || value.trim().length < 1) return 'Введите название'
    if (value.length > 200) return 'Максимум 200 символов'
    return null
  },
  
  description: (value) => {
    if (value && value.length > 5000) return 'Максимум 5000 символов'
    return null
  },
  
  url: (value) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Некорректный URL'
    }
  }
}

/**
 * Валидирует данные по схеме
 */
export function validate(data, schema) {
  const errors = {}
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'Обязательное поле'
      continue
    }
    
    // Skip validation if empty and not required
    if (value === undefined || value === null || value === '') {
      continue
    }
    
    // Type validation
    if (rules.type && validators[rules.type]) {
      const error = validators[rules.type](value)
      if (error) {
        errors[field] = error
        continue
      }
    }
    
    // Custom validator
    if (rules.validate) {
      const error = rules.validate(value, data)
      if (error) {
        errors[field] = error
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============================================================================
// 4. SANITIZATION (очистка данных)
// ============================================================================

/**
 * Очищает строку от опасных символов
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str
  
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Очищает объект рекурсивно
 */
export function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      result[sanitizeString(key)] = sanitizeObject(value)
    }
    return result
  }
  
  return obj
}

/**
 * Удаляет запрещённые поля из объекта
 */
export function stripFields(obj, forbiddenFields) {
  const result = { ...obj }
  for (const field of forbiddenFields) {
    delete result[field]
  }
  return result
}

// ============================================================================
// 5. CONFLICT RESOLUTION (для совместного редактирования)
// ============================================================================

/**
 * Проверяет конфликт версий
 */
export async function checkVersion(table, id, expectedVersion) {
  const { data, error } = await supabase
    .from(table)
    .select('version, updated_at')
    .eq('id', id)
    .single()

  if (error) throw error
  
  if (data.version !== expectedVersion) {
    return {
      conflict: true,
      currentVersion: data.version,
      updatedAt: data.updated_at
    }
  }
  
  return { conflict: false }
}

/**
 * Обновляет с проверкой версии (optimistic locking)
 */
export async function updateWithVersion(table, id, updates, expectedVersion) {
  const { data, error } = await supabase
    .from(table)
    .update({
      ...updates,
      version: expectedVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('version', expectedVersion)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      throw new Error('Version conflict: data was modified by another user')
    }
    throw error
  }
  
  return data
}

// ============================================================================
// 6. IDEMPOTENCY (защита от дублей)
// ============================================================================

const processedRequests = new Map()

/**
 * Генерирует idempotency key
 */
export function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Выполняет операцию идемпотентно
 */
export async function idempotent(key, fn, ttlMs = 300000) {
  // Проверяем был ли уже обработан
  const cached = processedRequests.get(key)
  if (cached) {
    if (Date.now() - cached.timestamp < ttlMs) {
      return cached.result
    }
    processedRequests.delete(key)
  }
  
  // Выполняем
  const result = await fn()
  
  // Кэшируем результат
  processedRequests.set(key, {
    result,
    timestamp: Date.now()
  })
  
  // Очищаем старые
  for (const [k, v] of processedRequests.entries()) {
    if (Date.now() - v.timestamp > ttlMs) {
      processedRequests.delete(k)
    }
  }
  
  return result
}

// ============================================================================
// 7. AUDIT LOG
// ============================================================================

/**
 * Записывает действие в audit log
 */
export async function auditLog(action, details = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from('audit_log').insert({
      user_id: user?.id,
      action,
      details,
      ip_address: null, // Заполняется на сервере
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Не блокируем основную операцию
    console.error('Audit log error:', error)
  }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default {
  // Optimistic updates
  optimisticUpdate,
  
  // Transactions
  transaction,
  transferBalance,
  
  // Validation
  validate,
  validators,
  
  // Sanitization
  sanitizeString,
  sanitizeObject,
  stripFields,
  
  // Conflict resolution
  checkVersion,
  updateWithVersion,
  
  // Idempotency
  generateIdempotencyKey,
  idempotent,
  
  // Audit
  auditLog
}
