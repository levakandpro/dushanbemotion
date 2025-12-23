// src/services/orderService.ts
// Сервис для работы с заказами услуг (Safe Deal)

import { supabase } from '../lib/supabaseClient'
import { deleteChatFiles } from './coverService'

const PLATFORM_COMMISSION = 0.20 // 20% комиссия для услуг

export interface ServiceOrder {
  id: string
  service_id: string
  author_id: string
  client_id: string
  price: number
  platform_fee: number
  author_earnings: number
  status: 'pending' | 'paid' | 'in_progress' | 'delivered' | 'approved' | 'disputed' | 'cancelled' | 'refunded'
  delivery_days: number
  deadline_at: string | null
  client_message: string | null
  author_response: string | null
  delivery_message: string | null
  delivery_files: any[]
  created_at: string
  paid_at: string | null
  delivered_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  refunded_at: string | null
  has_recommendation: boolean
  client_rating: number | null
  client_review: string | null
  // Joined data
  service?: any
  author?: any
  client?: any
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  attachments: any[]
  is_system: boolean
  read_at: string | null
  created_at: string
  sender?: any
}

export interface CreateOrderData {
  serviceId: string
  clientMessage?: string
}

interface PaymentInfo {
  paymentMethod?: string
  paymentScreenshot?: string
}

/**
 * Создаёт новый заказ (статус pending_payment - ожидает подтверждения оплаты)
 */
export async function createOrder(
  clientId: string,
  serviceId: string,
  clientMessage?: string,
  paymentInfo?: PaymentInfo
): Promise<ServiceOrder> {
  // Получаем данные услуги
  const { data: service, error: serviceError } = await supabase
    .from('author_services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    throw new Error('Услуга не найдена')
  }

  if (service.author_id === clientId) {
    throw new Error('Нельзя заказать свою услугу')
  }

  // Рассчитываем комиссию
  const price = service.price
  const platformFee = Math.round(price * PLATFORM_COMMISSION * 100) / 100
  const authorEarnings = price - platformFee

  // Создаём заказ со статусом pending_payment (ожидает подтверждения оплаты админом)
  const { data: order, error } = await supabase
    .from('service_orders')
    .insert({
      service_id: serviceId,
      author_id: service.author_id,
      client_id: clientId,
      price: price,
      platform_fee: platformFee,
      author_earnings: authorEarnings,
      status: 'pending_payment',
      delivery_days: service.delivery_days,
      client_message: clientMessage || null,
      payment_method: paymentInfo?.paymentMethod || null,
      payment_screenshot: paymentInfo?.paymentScreenshot || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw error
  }

  return order
}

/**
 * Оплата заказа (переводит в статус paid)
 * В реальности здесь будет интеграция с платёжной системой
 */
export async function payOrder(orderId: string, clientId: string): Promise<ServiceOrder> {
  // Проверяем что заказ принадлежит клиенту и в статусе pending
  const { data: order, error: checkError } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', orderId)
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .single()

  if (checkError || !order) {
    throw new Error('Заказ не найден или уже оплачен')
  }

  // Рассчитываем дедлайн
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + order.delivery_days)

  // Обновляем статус
  const { data: updatedOrder, error } = await supabase
    .from('service_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      deadline_at: deadline.toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error paying order:', error)
    throw error
  }

  // Добавляем системное сообщение в чат
  await addSystemMessage(orderId, `Заказ оплачен! Срок выполнения: ${order.delivery_days} дней`)

  // Увеличиваем счётчик заказов услуги
  await supabase.rpc('increment_service_orders', { service_id: order.service_id })

  return updatedOrder
}

/**
 * Автор начинает работу (переводит в статус in_progress)
 */
export async function startWork(orderId: string, authorId: string, response?: string): Promise<ServiceOrder> {
  const { data: order, error } = await supabase
    .from('service_orders')
    .update({
      status: 'in_progress',
      author_response: response || null
    })
    .eq('id', orderId)
    .eq('author_id', authorId)
    .eq('status', 'paid')
    .select()
    .single()

  if (error) {
    console.error('Error starting work:', error)
    throw error
  }

  await addSystemMessage(orderId, 'Автор начал работу над заказом')

  return order
}

/**
 * Автор сдаёт работу (переводит в статус delivered)
 */
export async function deliverOrder(
  orderId: string, 
  authorId: string, 
  deliveryMessage: string,
  deliveryFiles?: any[]
): Promise<ServiceOrder> {
  const { data: order, error } = await supabase
    .from('service_orders')
    .update({
      status: 'delivered',
      delivery_message: deliveryMessage,
      delivery_files: deliveryFiles || [],
      delivered_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('author_id', authorId)
    .in('status', ['paid', 'in_progress'])
    .select()
    .single()

  if (error) {
    console.error('Error delivering order:', error)
    throw error
  }

  await addSystemMessage(orderId, 'Автор сдал работу. Проверьте результат и примите заказ.')

  return order
}

/**
 * Клиент принимает работу (переводит в статус approved)
 * Деньги переводятся автору
 */
export async function approveOrder(
  orderId: string, 
  clientId: string,
  rating?: number,
  review?: string
): Promise<ServiceOrder> {
  const { data: order, error } = await supabase
    .from('service_orders')
    .update({
      status: 'approved',
      completed_at: new Date().toISOString(),
      client_rating: rating || null,
      client_review: review || null
    })
    .eq('id', orderId)
    .eq('client_id', clientId)
    .eq('status', 'delivered')
    .select()
    .single()

  if (error) {
    console.error('Error approving order:', error)
    throw error
  }

  // ЕДИНЫЙ ИСТОЧНИК: пишем ТОЛЬКО в balance_transactions
  await supabase
    .from('balance_transactions')
    .insert({
      author_id: order.author_id,
      order_id: orderId,
      type: 'earning',
      amount: order.author_earnings,
      status: 'pending', // V1: в ожидании ежемесячной выплаты
      description: 'Заказ выполнен'
    })

  // Уведомление в админку
  await supabase
    .from('admin_notifications')
    .insert({
      type: 'payment',
      title: 'Заказ завершён',
      message: `Автору начислено ${order.author_earnings} TJS`,
      user_id: order.author_id,
      metadata: { amount: order.author_earnings, order_id: orderId }
    })

  await addSystemMessage(orderId, `Заказ завершён! Клиент принял работу${rating ? ` и поставил оценку ${rating}⭐` : ''}.`)

  // Обновляем рейтинг услуги если есть оценка
  if (rating) {
    await updateServiceRating(order.service_id)
  }

  // Очищаем файлы чата из R2
  await deleteChatFiles(orderId)

  return order
}

/**
 * Открыть спор
 */
export async function openDispute(orderId: string, userId: string, reason: string): Promise<ServiceOrder> {
  // Проверяем что пользователь участник заказа
  const { data: order, error: checkError } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', orderId)
    .or(`client_id.eq.${userId},author_id.eq.${userId}`)
    .in('status', ['paid', 'in_progress', 'delivered'])
    .single()

  if (checkError || !order) {
    throw new Error('Заказ не найден или спор невозможен')
  }

  const { data: updatedOrder, error } = await supabase
    .from('service_orders')
    .update({ 
      status: 'disputed',
      dispute_reason: reason,
      dispute_opened_by: userId
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error opening dispute:', error)
    throw error
  }

  const role = userId === order.client_id ? 'Клиент' : 'Автор'
  await addSystemMessage(orderId, `${role} открыл спор: ${reason}`)

  return updatedOrder
}

/**
 * Отмена заказа (до оплаты)
 */
export async function cancelOrder(orderId: string, userId: string): Promise<ServiceOrder> {
  const { data: order, error } = await supabase
    .from('service_orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .or(`client_id.eq.${userId},author_id.eq.${userId}`)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) {
    console.error('Error cancelling order:', error)
    throw error
  }

  return order
}

/**
 * Возврат денег клиенту
 */
export async function refundOrder(orderId: string): Promise<ServiceOrder> {
  const { data: order, error: checkError } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', orderId)
    .in('status', ['disputed', 'paid', 'in_progress'])
    .single()

  if (checkError || !order) {
    throw new Error('Заказ не найден или возврат невозможен')
  }

  const { data: updatedOrder, error } = await supabase
    .from('service_orders')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error refunding order:', error)
    throw error
  }

  // Возвращаем деньги клиенту (добавляем на баланс)
  await supabase.rpc('add_user_balance', { 
    user_id: order.client_id, 
    amount: order.price 
  })

  await addSystemMessage(orderId, 'Заказ отменён. Деньги возвращены клиенту.')

  // Очищаем файлы чата из R2
  await deleteChatFiles(orderId)

  return updatedOrder
}

// =============================================
// СООБЩЕНИЯ ЗАКАЗА
// =============================================

/**
 * Получить сообщения заказа
 */
export async function getOrderMessages(orderId: string): Promise<OrderMessage[]> {
  const { data, error } = await supabase
    .from('order_messages')
    .select(`
      *,
      sender:profiles!order_messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw error
  }

  return data || []
}

/**
 * Отправить сообщение в заказ
 */
export async function sendOrderMessage(
  orderId: string, 
  senderId: string, 
  message: string,
  attachments?: any[]
): Promise<OrderMessage> {
  // Фильтруем запрещённый контент
  const filteredMessage = filterProhibitedContent(message)

  const { data, error } = await supabase
    .from('order_messages')
    .insert({
      order_id: orderId,
      sender_id: senderId,
      message: filteredMessage,
      attachments: attachments || []
    })
    .select(`
      *,
      sender:profiles!order_messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw error
  }

  return data
}

/**
 * Добавить системное сообщение
 */
async function addSystemMessage(orderId: string, message: string): Promise<void> {
  await supabase
    .from('order_messages')
    .insert({
      order_id: orderId,
      sender_id: '00000000-0000-0000-0000-000000000000', // System user
      message: message,
      is_system: true
    })
}

/**
 * Отметить сообщения как прочитанные
 */
export async function markMessagesAsRead(orderId: string, userId: string): Promise<void> {
  await supabase
    .from('order_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .neq('sender_id', userId)
    .is('read_at', null)
}

// =============================================
// РЕКОМЕНДАЦИИ (РЕКОМЕНДУЮ)
// =============================================

/**
 * Добавить рекомендацию (только для approved заказов)
 */
export async function addRecommendation(
  orderId: string, 
  clientId: string,
  comment?: string
): Promise<void> {
  // Получаем заказ
  const { data: order, error: orderError } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', orderId)
    .eq('client_id', clientId)
    .eq('status', 'approved')
    .single()

  if (orderError || !order) {
    throw new Error('Заказ не найден или не завершён')
  }

  if (order.has_recommendation) {
    throw new Error('Рекомендация уже добавлена')
  }

  // Добавляем рекомендацию
  const { error } = await supabase
    .from('service_recommendations')
    .insert({
      service_id: order.service_id,
      order_id: orderId,
      client_id: clientId,
      author_id: order.author_id,
      comment: comment || null
    })

  if (error) {
    console.error('Error adding recommendation:', error)
    throw error
  }

  // Обновляем флаг в заказе
  await supabase
    .from('service_orders')
    .update({ has_recommendation: true })
    .eq('id', orderId)
}

/**
 * Получить рекомендации услуги
 */
export async function getServiceRecommendations(serviceId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('service_recommendations')
    .select(`
      *,
      client:profiles!service_recommendations_client_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recommendations:', error)
    return []
  }

  return data || []
}

// =============================================
// ПОЛУЧЕНИЕ ЗАКАЗОВ
// =============================================

/**
 * Получить заказ по ID
 */
export async function getOrderById(orderId: string): Promise<ServiceOrder | null> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      service:author_services(*),
      author:profiles!service_orders_author_id_fkey(id, username, display_name, avatar_url),
      client:profiles!service_orders_client_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  return data
}

/**
 * Получить заказы клиента
 */
export async function getClientOrders(clientId: string): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      service:author_services(id, title, emoji),
      author:profiles!service_orders_author_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client orders:', error)
    return []
  }

  return data || []
}

/**
 * Получить заказы автора
 */
export async function getAuthorOrders(authorId: string): Promise<ServiceOrder[]> {
  console.log('[orderService] getAuthorOrders for:', authorId)
  
  // Сначала получим заказы без джойнов
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })

  console.log('[orderService] Raw result:', { data, error, dataLength: data?.length })

  if (error) {
    console.error('Error fetching author orders:', JSON.stringify(error, null, 2))
    return []
  }

  if (!data || data.length === 0) {
    console.log('[orderService] No orders found for author')
    return []
  }

  // Теперь обогащаем данные
  const enrichedOrders = await Promise.all(data.map(async (order) => {
    // Получаем услугу
    const { data: service } = await supabase
      .from('author_services')
      .select('id, title, emoji')
      .eq('id', order.service_id)
      .single()

    // Получаем клиента
    const { data: client } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', order.client_id)
      .single()

    return { ...order, service, client }
  }))

  console.log('[orderService] Enriched orders:', enrichedOrders)
  return enrichedOrders
}

// =============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================

/**
 * Фильтрация запрещённого контента
 */
function filterProhibitedContent(text: string): string {
  // Паттерны для фильтрации
  const patterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // телефоны
    /[\w.-]+@[\w.-]+\.\w+/g, // email
    /@[\w]+/g, // telegram
    /t\.me\/[\w]+/g, // telegram links
    /wa\.me\/[\d]+/g, // whatsapp
    /whatsapp/gi,
    /telegram/gi,
    /viber/gi,
    /оплат[аи]\s*(вне|мимо|без)/gi,
    /напрямую/gi,
    /договор[ие]мся\s*отдельно/gi,
  ]

  let filtered = text
  patterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '[удалено]')
  })

  return filtered
}

/**
 * Обновить рейтинг услуги
 */
async function updateServiceRating(serviceId: string): Promise<void> {
  const { data: orders } = await supabase
    .from('service_orders')
    .select('client_rating')
    .eq('service_id', serviceId)
    .eq('status', 'approved')
    .not('client_rating', 'is', null)

  if (orders && orders.length > 0) {
    const avgRating = orders.reduce((sum, o) => sum + o.client_rating, 0) / orders.length
    
    await supabase
      .from('author_services')
      .update({ rating: Math.round(avgRating * 10) / 10 })
      .eq('id', serviceId)
  }
}

/**
 * Получить статистику услуги
 */
export async function getServiceStats(serviceId: string): Promise<{
  ordersCount: number
  recommendationsCount: number
  avgRating: number
}> {
  const [ordersResult, recommendationsResult] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, client_rating')
      .eq('service_id', serviceId)
      .eq('status', 'approved'),
    supabase
      .from('service_recommendations')
      .select('id')
      .eq('service_id', serviceId)
  ])

  const orders = ordersResult.data || []
  const recommendations = recommendationsResult.data || []

  const ratings = orders.filter(o => o.client_rating).map(o => o.client_rating)
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
    : 0

  return {
    ordersCount: orders.length,
    recommendationsCount: recommendations.length,
    avgRating: Math.round(avgRating * 10) / 10
  }
}
