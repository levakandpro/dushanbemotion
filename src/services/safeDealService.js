// src/services/safeDealService.js
// Сервис Safe Deal для клиентской части

import { supabase } from '../lib/supabaseClient'

// ============================================
// ЗАКАЗЫ
// ============================================

/**
 * Создаёт новый заказ услуги
 */
export async function createOrder(serviceId, clientId, authorId, price, message = '') {
  try {
    // Рассчитываем комиссию (20% для услуг)
    const platformFee = Math.round(price * 0.20 * 100) / 100 // 20% комиссия платформы
    const authorEarnings = price - platformFee

    const { data, error } = await supabase
      .from('service_orders')
      .insert({
        service_id: serviceId,
        client_id: clientId,
        author_id: authorId,
        price: price,
        platform_fee: platformFee,
        author_earnings: authorEarnings,
        client_message: message,
        status: 'pending',
        delivery_days: 7 // по умолчанию
      })
      .select()
      .single()

    if (error) throw error
    
    // Отправляем уведомление в Telegram
    if (data) {
      import('./telegramService')
        .then(({ notifyNewOrder }) => {
          return notifyNewOrder(data.id, price, 'Новая услуга')
        })
        .then((result) => {
          console.log('[safeDealService] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[safeDealService] Telegram notification error:', e)
        })
    }
    
    return data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

/**
 * Получает заказы пользователя (как клиент или автор)
 */
export async function getUserOrders(userId, role = 'all') {
  try {
    let query = supabase
      .from('service_orders')
      .select(`
        *,
        service:author_services(id, title, cover_url),
        author:profiles!service_orders_author_id_fkey(id, display_name, username, avatar_url),
        client:profiles!service_orders_client_id_fkey(id, display_name, username, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (role === 'client') {
      query = query.eq('client_id', userId)
    } else if (role === 'author') {
      query = query.eq('author_id', userId)
    } else {
      query = query.or(`client_id.eq.${userId},author_id.eq.${userId}`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

/**
 * Получает один заказ по ID
 */
export async function getOrder(orderId) {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        *,
        service:author_services(id, title, cover_url, description),
        author:profiles!service_orders_author_id_fkey(id, display_name, username, avatar_url),
        client:profiles!service_orders_client_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

/**
 * Обновляет статус заказа (для автора/клиента)
 */
export async function updateOrderStatus(orderId, status, userId) {
  try {
    const updates = { status }
    
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    // Если заказ одобрен — начисляем автору
    if (status === 'completed' && data) {
      await addToAuthorBalance(data.author_id, data.author_earnings, orderId)
      
      // Уведомление в Telegram о завершении заказа
      import('./telegramService')
        .then(({ notifyOrderCompleted }) => {
          return notifyOrderCompleted(orderId, data.price, data.author_earnings)
        })
        .then((result) => {
          console.log('[safeDealService] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[safeDealService] Telegram notification error:', e)
        })
    }
    
    // Уведомление о споре
    if (status === 'disputed' && data) {
      import('./telegramService')
        .then(({ notifyDispute }) => {
          return notifyDispute(orderId, 'Клиент открыл спор')
        })
        .then((result) => {
          console.log('[safeDealService] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[safeDealService] Telegram notification error:', e)
        })
    }

    return data
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

/**
 * Отмечает заказ как оплаченный
 */
export async function markOrderPaid(orderId, paymentMethod, screenshot = null) {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        payment_screenshot: screenshot
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking order paid:', error)
    throw error
  }
}

// ============================================
// ЧАТ ЗАКАЗА
// ============================================

/**
 * Получает сообщения заказа
 */
export async function getOrderMessages(orderId) {
  try {
    const { data, error } = await supabase
      .from('order_messages')
      .select(`
        *,
        sender:profiles(id, display_name, username, avatar_url)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

/**
 * Отправляет сообщение в чат заказа
 */
export async function sendOrderMessage(orderId, senderId, message, fileUrl = null) {
  try {
    // Проверяем на запрещённый контент
    const filterResult = await filterMessageContent(message)
    
    if (filterResult.blocked) {
      // Сохраняем отфильтрованное сообщение
      await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: senderId,
          message: '[Сообщение заблокировано: ' + filterResult.reason + ']',
          message_type: 'system',
          is_filtered: true,
          filter_reason: filterResult.reason
        })

      // Создаём предупреждение
      await createWarning(senderId, 'contact_attempt', 
        'Попытка передать контактные данные: ' + filterResult.pattern,
        message)

      return { blocked: true, reason: filterResult.reason }
    }

    // Отправляем сообщение
    const { data, error } = await supabase
      .from('order_messages')
      .insert({
        order_id: orderId,
        sender_id: senderId,
        message: message,
        message_type: fileUrl ? 'file' : 'text',
        file_url: fileUrl
      })
      .select(`
        *,
        sender:profiles(id, display_name, username, avatar_url)
      `)
      .single()

    if (error) throw error
    
    // Отправляем уведомление в Telegram
    if (data) {
      const senderName = data.sender?.display_name || data.sender?.username || 'Пользователь'
      import('./telegramService')
        .then(({ notifyNewChatMessage }) => {
          return notifyNewChatMessage(orderId, senderName, message)
        })
        .then((result) => {
          console.log('[safeDealService] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[safeDealService] Telegram notification error:', e)
        })
    }
    
    return { blocked: false, message: data }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * Фильтрует сообщение на запрещённый контент
 */
async function filterMessageContent(message) {
  try {
    const { data: patterns } = await supabase
      .from('blocked_patterns')
      .select('pattern, type')
      .eq('is_active', true)

    if (!patterns) return { blocked: false }

    const lowerMessage = message.toLowerCase()
    
    // Проверяем паттерны
    for (const p of patterns) {
      if (lowerMessage.includes(p.pattern.toLowerCase())) {
        return { 
          blocked: true, 
          reason: getFilterReasonText(p.type), 
          pattern: p.pattern 
        }
      }
    }

    // Проверяем номера телефонов (регулярка)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g
    if (phoneRegex.test(message)) {
      return { blocked: true, reason: 'Номер телефона', pattern: 'phone number' }
    }

    // Проверяем email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    if (emailRegex.test(message)) {
      return { blocked: true, reason: 'Email адрес', pattern: 'email' }
    }

    return { blocked: false }
  } catch (error) {
    console.error('Error filtering message:', error)
    return { blocked: false }
  }
}

function getFilterReasonText(type) {
  const reasons = {
    'phone': 'Номер телефона',
    'email': 'Email адрес',
    'messenger': 'Мессенджер',
    'phrase': 'Запрещённая фраза'
  }
  return reasons[type] || 'Запрещённый контент'
}

/**
 * Подписка на новые сообщения (realtime)
 */
export function subscribeToOrderMessages(orderId, callback) {
  const channel = supabase
    .channel(`order-messages-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`
      },
      async (payload) => {
        // Получаем полные данные с профилем
        const { data } = await supabase
          .from('order_messages')
          .select(`*, sender:profiles(id, display_name, username, avatar_url)`)
          .eq('id', payload.new.id)
          .single()
        
        if (data) callback(data)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================
// БАЛАНС АВТОРА
// ============================================

/**
 * Получает баланс автора
 */
export async function getAuthorBalance(authorId) {
  try {
    // ЕДИНЫЙ ИСТОЧНИК: вычисляем баланс из balance_transactions
    const { data: transactions, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('author_id', authorId)

    if (error) throw error

    const txList = transactions || []
    
    // Считаем суммы из транзакций
    let pending_balance = 0   // В ожидании выплаты
    let available_balance = 0 // Доступно к выводу
    let total_earned = 0      // Всего заработано
    let total_withdrawn = 0   // Выведено

    for (const tx of txList) {
      if (tx.type === 'earning') {
        total_earned += tx.amount
        // V1: все заработки идут в pending (в ожидании ежемесячной выплаты)
        if (tx.status === 'available') {
          available_balance += tx.amount
        } else {
          // по умолчанию все earning в pending
          pending_balance += tx.amount
        }
      } else if (tx.type === 'payout' && tx.status === 'completed') {
        total_withdrawn += tx.amount
        pending_balance -= tx.amount // выплачено из pending
      }
    }

    // Коррекция: pending не может быть отрицательным
    pending_balance = Math.max(0, pending_balance)
    available_balance = Math.max(0, available_balance)

    return {
      available_balance,
      pending_balance,
      total_earned,
      total_withdrawn
    }
  } catch (error) {
    console.error('Error fetching balance:', error)
    return {
      available_balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0
    }
  }
}

/**
 * Добавляет заработок в баланс автора
 */
async function addToAuthorBalance(authorId, amount, orderId) {
  try {
    // ЕДИНЫЙ ИСТОЧНИК: пишем ТОЛЬКО в balance_transactions
    // Баланс вычисляется из этих записей
    const { error } = await supabase
      .from('balance_transactions')
      .insert({
        author_id: authorId,
        order_id: orderId,
        type: 'earning',
        amount: amount,
        status: 'pending', // V1: в ожидании ежемесячной выплаты
        description: 'Заказ выполнен'
      })

    if (error) throw error

    // Уведомление в админку
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'payment',
        title: 'Заказ завершён',
        message: `Автору начислено ${amount} TJS`,
        user_id: authorId,
        metadata: { amount, order_id: orderId }
      })

  } catch (error) {
    console.error('Error adding to balance:', error)
  }
}

/**
 * Получает историю транзакций автора
 */
export async function getAuthorTransactions(authorId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

/**
 * Получает выплаты автора
 */
export async function getAuthorPayouts(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_payouts')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return []
  }
}

/**
 * Получает баланс автора для системы ежемесячных выплат
 * 
 * КАНОН РАСЧЁТА:
 * - В ожидании = завершённые заказы (status=approved) БЕЗ выплаты (payout_id=null)
 * - Выплачено = сумма всех author_payouts со статусом 'paid'
 * - Всего заработано = В ожидании + Выплачено
 * 
 * ИСТОЧНИК ДАННЫХ: service_orders и author_payouts
 * НЕ balance_transactions!
 */
export async function getAuthorPayoutBalance(authorId) {
  try {
    // В ожидании = завершённые заказы без выплаты
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('service_orders')
      .select('author_earnings')
      .eq('author_id', authorId)
      .eq('status', 'approved')
      .is('payout_id', null)

    if (pendingError) {
      console.error('Error fetching pending orders:', pendingError)
    }

    const pending = (pendingOrders || []).reduce((sum, o) => sum + (o.author_earnings || 0), 0)

    // Выплачено = сумма всех выплат
    const { data: payouts, error: payoutsError } = await supabase
      .from('author_payouts')
      .select('author_earnings, period, paid_at')
      .eq('author_id', authorId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
    }

    const paid = (payouts || []).reduce((sum, p) => sum + (p.author_earnings || 0), 0)

    // Всего заработано = в ожидании + выплачено
    const total = pending + paid

    return {
      pending_balance: pending,
      total_paid: paid,
      total_earned: total,
      payouts_history: payouts || []
    }
  } catch (error) {
    console.error('Error fetching author payout balance:', error)
    return {
      pending_balance: 0,
      total_paid: 0,
      total_earned: 0,
      payouts_history: []
    }
  }
}

/**
 * Запрашивает выплату
 */
export async function requestPayout(authorId, amount, method, details) {
  try {
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await supabase
      .from('author_payouts')
      .insert({
        author_id: authorId,
        amount,
        payout_method: method,
        payout_details: details,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Уведомление в админку
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'payout_request',
        title: 'Запрос на выплату',
        message: `Автор запросил выплату ${amount} TJS`,
        user_id: authorId,
        payout_id: data.id,
        metadata: { amount, method }
      })
    
    // Уведомление в Telegram
    import('./telegramService')
      .then(({ notifyPayoutRequest }) => {
        return notifyPayoutRequest('Автор', amount)
      })
      .then((result) => {
        console.log('[safeDealService] Telegram notification sent:', result)
      })
      .catch((e) => {
        console.error('[safeDealService] Telegram notification error:', e)
      })

    return data
  } catch (error) {
    console.error('Error requesting payout:', error)
    throw error
  }
}

// ============================================
// РЕЙТИНГ И РЕКОМЕНДАЦИИ
// ============================================

/**
 * Добавляет рейтинг услуге
 */
export async function rateService(serviceId, userId, rating, comment = '') {
  try {
    const { data, error } = await supabase
      .from('service_ratings')
      .upsert({
        service_id: serviceId,
        user_id: userId,
        rating,
        comment
      }, { onConflict: 'service_id,user_id' })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error rating service:', error)
    throw error
  }
}

/**
 * Добавляет РЕКОМЕНДУЮ (только после завершённого заказа)
 */
export async function recommendService(serviceId, orderId, userId, comment = '') {
  try {
    // Проверяем что заказ завершён
    const { data: order } = await supabase
      .from('service_orders')
      .select('status, client_id')
      .eq('id', orderId)
      .single()

    if (!order || order.status !== 'completed' || order.client_id !== userId) {
      throw new Error('Можно рекомендовать только после завершённого заказа')
    }

    // Проверяем что ещё не рекомендовал
    const { data: existing } = await supabase
      .from('service_recommendations')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (existing) {
      throw new Error('Вы уже оставили рекомендацию для этого заказа')
    }

    const { data, error } = await supabase
      .from('service_recommendations')
      .insert({
        service_id: serviceId,
        order_id: orderId,
        user_id: userId,
        comment
      })
      .select()
      .single()

    if (error) throw error

    // Обновляем флаг в заказе
    await supabase
      .from('service_orders')
      .update({ has_recommendation: true })
      .eq('id', orderId)

    return data
  } catch (error) {
    console.error('Error recommending service:', error)
    throw error
  }
}

/**
 * Получает рекомендации услуги
 */
export async function getServiceRecommendations(serviceId) {
  try {
    const { data, error } = await supabase
      .from('service_recommendations')
      .select(`
        *,
        user:profiles(id, display_name, username, avatar_url)
      `)
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return []
  }
}

/**
 * Получает средний рейтинг услуги
 */
export async function getServiceRating(serviceId) {
  try {
    const { data, error } = await supabase
      .from('service_ratings')
      .select('rating')
      .eq('service_id', serviceId)

    if (error) throw error
    
    if (!data || data.length === 0) {
      return { average: 0, count: 0 }
    }

    const sum = data.reduce((acc, r) => acc + r.rating, 0)
    return {
      average: Math.round((sum / data.length) * 10) / 10,
      count: data.length
    }
  } catch (error) {
    console.error('Error fetching rating:', error)
    return { average: 0, count: 0 }
  }
}

// ============================================
// ПРЕДУПРЕЖДЕНИЯ
// ============================================

/**
 * Создаёт предупреждение пользователю
 */
async function createWarning(userId, type, reason, evidence = '') {
  try {
    await supabase
      .from('user_warnings')
      .insert({
        user_id: userId,
        type,
        reason,
        evidence,
        severity: 'warning',
        action_taken: 'warning'
      })

    // Уведомление в админку
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'warning',
        title: 'Нарушение правил',
        message: reason,
        user_id: userId,
        metadata: { type, evidence }
      })
  } catch (error) {
    console.error('Error creating warning:', error)
  }
}

/**
 * Получает предупреждения пользователя
 */
export async function getUserWarnings(userId) {
  try {
    const { data, error } = await supabase
      .from('user_warnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching warnings:', error)
    return []
  }
}

// ============================================
// УСЛУГИ
// ============================================

/**
 * Получает услугу для заказа
 */
export async function getServiceForOrder(serviceId) {
  try {
    const { data, error } = await supabase
      .from('author_services')
      .select(`
        *,
        author:profiles(id, display_name, username, avatar_url)
      `)
      .eq('id', serviceId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching service:', error)
    return null
  }
}

