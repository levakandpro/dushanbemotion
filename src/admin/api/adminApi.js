// src/admin/api/adminApi.js
// Реальные запросы к Supabase для админки

import { supabase } from '../../lib/supabaseClient'
import { deleteChatFiles } from '../../services/coverService'

/**
 * Получает статистику для Dashboard
 */
export async function fetchAdminDashboard() {
  try {
    // Параллельно запрашиваем все счётчики
    const [
      usersResult,
      projectsResult,
      bazarResult,
      subscriptionsResult,
      collectionsResult,
      collabsResult,
      worksResult,
      servicesResult,
      ordersResult,
      assetsResult
    ] = await Promise.all([
      // Количество пользователей (profiles)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Количество проектов
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true }),
      
      // Количество публикаций в Media Bazar (из представления bazar_works)
      supabase
        .from('bazar_works')
        .select('id', { count: 'exact', head: true }),
      
      // Количество активных подписок (пользователи с current_plan != null и != 'free')
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('current_plan', 'is', null)
        .neq('current_plan', 'free'),

      // Количество коллекций
      supabase
        .from('collections')
        .select('id', { count: 'exact', head: true }),

      // Количество коллабов
      supabase
        .from('collabs')
        .select('id', { count: 'exact', head: true }),

      // Количество работ
      supabase
        .from('works')
        .select('id', { count: 'exact', head: true }),

      // Количество услуг
      supabase
        .from('author_services')
        .select('id', { count: 'exact', head: true }),

      // Количество заказов услуг
      supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true }),

      // Количество ассетов пользователей
      supabase
        .from('user_assets')
        .select('id', { count: 'exact', head: true })
    ])

    return {
      users: usersResult.count || 0,
      activeSubscriptions: subscriptionsResult.count || 0,
      projects: projectsResult.count || 0,
      bazarItems: bazarResult.count || 0,
      collections: collectionsResult.count || 0,
      collabs: collabsResult.count || 0,
      works: worksResult.count || 0,
      services: servicesResult.count || 0,
      orders: ordersResult.count || 0,
      assets: assetsResult.count || 0,
    }
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return {
      users: 0,
      activeSubscriptions: 0,
      projects: 0,
      bazarItems: 0,
      collections: 0,
      collabs: 0,
      works: 0,
      services: 0,
      orders: 0,
      assets: 0,
    }
  }
}

/**
 * Получает подписки (всех пользователей с тарифами)
 */
export async function fetchRecentSubscriptions(limit = 100, search = '') {
  try {
    let query = supabase
      .from('profiles')
      .select('id, display_name, username, current_plan, plan_expires_at, is_lifetime, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Поиск по имени или username
    if (search && search.length >= 2) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }

    // Определяем "новых" — зарегистрированы в последние 7 дней
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return (data || []).map(profile => ({
      id: profile.id,
      user: profile.display_name || profile.username || profile.id.slice(0, 8),
      plan: formatPlanName(profile.current_plan),
      status: getSubscriptionStatus(profile),
      expiresAt: profile.plan_expires_at,
      isLifetime: profile.is_lifetime,
      createdAt: profile.created_at,
      isNew: profile.created_at && new Date(profile.created_at) > weekAgo,
    }))
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }
}

/**
 * Получает всех пользователей для админки
 */
export async function fetchUsers(options = {}) {
  const { limit = 50, offset = 0, search = '' } = options
  
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0 }
    }

    return {
      users: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0 }
  }
}

/**
 * Получает все проекты для админки
 */
export async function fetchProjects(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('projects')
      .select('id, user_id, title, thumbnail_url, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching projects:', error)
      return { projects: [], total: 0 }
    }

    return {
      projects: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { projects: [], total: 0 }
  }
}

/**
 * Получает публикации Media Bazar для админки (из представления bazar_works)
 */
export async function fetchBazarPosts(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('bazar_works')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching bazar posts:', error)
      return { posts: [], total: 0 }
    }

    return {
      posts: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching bazar posts:', error)
    return { posts: [], total: 0 }
  }
}

/**
 * Получает все коллекции для админки
 */
export async function fetchCollections(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching collections:', error)
      return { collections: [], total: 0 }
    }

    return {
      collections: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { collections: [], total: 0 }
  }
}

/**
 * Получает все коллабы для админки
 */
export async function fetchCollabs(options = {}) {
  const { limit = 50, offset = 0, status = 'all' } = options
  
  try {
    let query = supabase
      .from('collabs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching collabs:', error)
      return { collabs: [], total: 0 }
    }

    return {
      collabs: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching collabs:', error)
    return { collabs: [], total: 0 }
  }
}

/**
 * Получает все работы для админки
 */
export async function fetchWorks(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('works')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching works:', error)
      return { works: [], total: 0 }
    }

    return {
      works: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching works:', error)
    return { works: [], total: 0 }
  }
}

/**
 * Получает все услуги для админки
 */
export async function fetchServices(options = {}) {
  const { limit = 50, offset = 0, status = 'all' } = options
  
  try {
    let query = supabase
      .from('author_services')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching services:', error)
      return { services: [], total: 0 }
    }

    return {
      services: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching services:', error)
    return { services: [], total: 0 }
  }
}

/**
 * Получает список тарифных планов из БД
 */
export async function fetchPlans() {
  try {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching billing_plans:', error)
      return getDefaultPlans()
    }

    if (!data || data.length === 0) {
      return getDefaultPlans()
    }

    // Маппим period -> interval для совместимости с фронтендом
    return data.map(plan => ({
      ...plan,
      interval: plan.period || plan.interval || 'month'
    }))
  } catch (error) {
    console.error('Error fetching plans:', error)
    return getDefaultPlans()
  }
}

/**
 * Получает подписки из user_plans (история подписок)
 */
export async function fetchUserPlans(options = {}) {
  const { limit = 50, offset = 0, status = 'all' } = options
  
  try {
    let query = supabase
      .from('user_plans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching user_plans:', error)
      return { plans: [], total: 0 }
    }

    return {
      plans: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching user_plans:', error)
    return { plans: [], total: 0 }
  }
}

/**
 * Обновляет тарифный план
 */
export async function updatePlan(planId, updates) {
  try {
    // Маппим interval -> period для совместимости
    const dbUpdates = { ...updates }
    if (dbUpdates.interval) {
      dbUpdates.period = dbUpdates.interval
      delete dbUpdates.interval
    }

    const { data, error } = await supabase
      .from('billing_plans')
      .update(dbUpdates)
      .eq('id', planId)
      .select()

    if (error) {
      console.error('Error updating plan:', error)
      throw error
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error updating plan:', error)
    throw error
  }
}

/**
 * Создаёт новый тарифный план
 */
export async function createPlan(plan) {
  try {
    // Маппим interval -> period
    const dbPlan = { ...plan }
    if (dbPlan.interval) {
      dbPlan.period = dbPlan.interval
      delete dbPlan.interval
    }

    const { data, error } = await supabase
      .from('billing_plans')
      .insert(dbPlan)
      .select()
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating plan:', error)
    throw error
  }
}

/**
 * Удаляет тарифный план
 */
export async function deletePlan(planId) {
  try {
    const { error } = await supabase
      .from('billing_plans')
      .delete()
      .eq('id', planId)

    if (error) {
      console.error('Error deleting plan:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting plan:', error)
    throw error
  }
}

// Дефолтные планы (fallback)
function getDefaultPlans() {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: {
        projects_limit: 5,
        storage_limit_gb: 1,
        premium_content: false,
        priority_support: false
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: {
        projects_limit: null,
        storage_limit_gb: 50,
        premium_content: true,
        priority_support: false
      }
    },
    {
      id: 'premium_plus',
      name: 'Premium+',
      price: 99.99,
      currency: 'USD',
      interval: 'year',
      features: {
        projects_limit: null,
        storage_limit_gb: 200,
        premium_content: true,
        priority_support: true
      }
    }
  ]
}

/**
 * Получает ассеты пользователей
 */
export async function fetchUserAssets(options = {}) {
  const { limit = 50, offset = 0, type = 'all' } = options
  
  try {
    let query = supabase
      .from('user_assets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type !== 'all') {
      query = query.eq('asset_type', type)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching user_assets:', error)
      return { assets: [], total: 0 }
    }

    return {
      assets: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching user_assets:', error)
    return { assets: [], total: 0 }
  }
}

// fetchServiceOrders - см. ниже в секции SAFE DEAL API

/**
 * Получает транзакции авторов
 */
export async function fetchAuthorTransactions(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('author_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching author_transactions:', error)
      return { transactions: [], total: 0 }
    }

    return {
      transactions: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching author_transactions:', error)
    return { transactions: [], total: 0 }
  }
}

// fetchAuthorBalances - см. ниже в секции SAFE DEAL API

/**
 * Получает метрики работ
 */
export async function fetchWorkMetrics(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    const { data, error, count } = await supabase
      .from('work_metrics')
      .select('*', { count: 'exact' })
      .order('views', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching work_metrics:', error)
      return { metrics: [], total: 0 }
    }

    return {
      metrics: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching work_metrics:', error)
    return { metrics: [], total: 0 }
  }
}

/**
 * Получает настройки страницы тарифов
 */
export async function fetchPricingSettings() {
  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error) {
      console.error('Error fetching pricing_settings:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching pricing_settings:', error)
    return null
  }
}

/**
 * Обновляет настройки страницы тарифов
 */
export async function updatePricingSettings(settings) {
  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main')
      .select()
      .single()

    if (error) {
      console.error('Error updating pricing_settings:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating pricing_settings:', error)
    throw error
  }
}

/**
 * Получает список админов
 */
export async function fetchAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching admin_users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching admin_users:', error)
    return []
  }
}

/**
 * Добавляет нового админа
 */
export async function addAdminUser(email, role = 'helper') {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({ email: email.toLowerCase().trim(), role })
      .select()
      .single()

    if (error) {
      console.error('Error adding admin:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error adding admin:', error)
    throw error
  }
}

/**
 * Обновляет роль админа
 */
export async function updateAdminRole(id, role) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin role:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating admin role:', error)
    throw error
  }
}

/**
 * Удаляет админа
 */
export async function deleteAdminUser(id) {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting admin:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting admin:', error)
    throw error
  }
}

/**
 * Проверяет является ли email админом
 */
export async function checkIsAdmin(email) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// === Вспомогательные функции ===

function formatPlanName(plan) {
  if (!plan) return 'Free'
  const names = {
    'free': 'Free',
    'premium': 'Premium',
    'premium_plus': 'Premium+',
  }
  return names[plan] || plan
}

function getSubscriptionStatus(profile) {
  if (!profile.current_plan || profile.current_plan === 'free') {
    return 'free'
  }
  
  if (profile.is_lifetime) {
    return 'lifetime'
  }
  
  if (profile.plan_expires_at) {
    const expiresAt = new Date(profile.plan_expires_at)
    if (expiresAt < new Date()) {
      return 'expired'
    }
  }
  
  return 'active'
}

// ============================================
// SAFE DEAL API
// ============================================

/**
 * Получает заказы услуг для админки
 */
export async function fetchServiceOrders(options = {}) {
  const { limit = 50, offset = 0, status = null } = options
  
  try {
    let query = supabase
      .from('service_orders')
      .select(`
        *,
        author:profiles!service_orders_author_id_fkey(id, display_name, username, avatar_url),
        client:profiles!service_orders_client_id_fkey(id, display_name, username, avatar_url),
        service:author_services(id, title)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return { orders: [], total: 0 }
    }

    return { orders: data || [], total: count || 0 }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], total: 0 }
  }
}

/**
 * Удаляет заказ (для админа)
 */
export async function deleteOrder(orderId) {
  try {
    // Удаляем файлы чата из R2
    await deleteChatFiles(orderId)

    // Удаляем сообщения заказа
    await supabase
      .from('order_messages')
      .delete()
      .eq('order_id', orderId)

    // Удаляем сам заказ
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', orderId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting order:', error)
    throw error
  }
}

/**
 * Обновляет статус заказа
 */
export async function updateOrderStatus(orderId, status, notes = null) {
  try {
    // Сначала получаем текущий заказ
    const { data: currentOrder } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    const updates = { status }
    
    // Подтверждение оплаты админом
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
      // Устанавливаем дедлайн
      if (currentOrder?.delivery_days) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + currentOrder.delivery_days)
        updates.deadline_at = deadline.toISOString()
      }
    } else if (status === 'approved') {
      updates.approved_at = new Date().toISOString()
      updates.completed_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      if (notes) updates.cancel_reason = notes
    } else if (status === 'refunded') {
      // Возврат денег клиенту (при решении спора в пользу клиента)
      updates.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    
    // Если approved - добавляем в баланс автора и удаляем файлы чата
    if (status === 'approved' && data) {
      await addAuthorEarnings(data.author_id, data.id, data.author_earnings)
      await deleteChatFiles(orderId) // Удаляем файлы чата из R2
    }

    // Если cancelled или refunded - удаляем файлы чата
    if ((status === 'cancelled' || status === 'refunded') && data) {
      await deleteChatFiles(orderId) // Удаляем файлы чата из R2
    }

    // Уведомление админу
    if (status === 'paid') {
      await createAdminNotification('payment', 'Оплата подтверждена', `Заказ #${orderId.slice(0, 8)} подтверждён`, { order_id: orderId })
    }

    return data
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

/**
 * Добавляет заработок автору
 * ЕДИНЫЙ ИСТОЧНИК: пишем ТОЛЬКО в balance_transactions
 */
export async function addAuthorEarnings(authorId, orderId, amount) {
  try {
    // Пишем ТОЛЬКО в balance_transactions
    const { error } = await supabase
      .from('balance_transactions')
      .insert({
        author_id: authorId,
        order_id: orderId,
        type: 'earning',
        amount: amount,
        status: 'pending', // V1: в ожидании ежемесячной выплаты
        description: 'Заказ одобрен'
      })

    if (error) throw error

    // Уведомление админу
    await createAdminNotification('payment', 'Заработок начислен', `Автору начислено ${amount} TJS`, { order_id: orderId, author_id: authorId, amount })

  } catch (error) {
    console.error('Error adding earnings:', error)
  }
}

/**
 * Получает уведомления для админки
 */
export async function fetchAdminNotifications(options = {}) {
  const { limit = 50, unreadOnly = false } = options
  
  try {
    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Создаёт уведомление для админа + отправляет в Telegram
 */
export async function createAdminNotification(type, title, message, metadata = {}) {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        type,
        title,
        message,
        metadata,
        order_id: metadata.order_id || null,
        user_id: metadata.user_id || metadata.author_id || null
      })

    if (error) console.error('Error creating notification:', error)
    
    // Отправляем в Telegram для важных уведомлений
    if (type === 'premium_payment') {
      // Используем динамический импорт для совместимости со всеми устройствами
      import('../../services/telegramService')
        .then(({ notifyPremiumPayment }) => {
          return notifyPremiumPayment(
            metadata.user_id,
            metadata.plan_id || 'premium',
            metadata.payment_screenshot
          )
        })
        .then((result) => {
          console.log('[AdminAPI] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[AdminAPI] Telegram notification error:', e)
        })
    }
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

/**
 * Отмечает уведомление прочитанным
 */
export async function markNotificationRead(notificationId) {
  try {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
  } catch (error) {
    console.error('Error marking notification read:', error)
  }
}

/**
 * Возвращает количество непрочитанных уведомлений админки
 */
export async function fetchUnreadAdminNotificationsCount() {
  try {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error fetching unread notifications count:', error)
    return 0
  }
}

/**
 * Очищает уведомления (по умолчанию: помечает все прочитанными)
 */
export async function clearAdminNotifications(mode = 'mark_read') {
  try {
    if (mode === 'delete') {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)

    if (error) throw error
  } catch (error) {
    console.error('Error clearing notifications:', error)
    throw error
  }
}

/**
 * Получает балансы авторов
 * ЕДИНЫЙ ИСТОЧНИК: вычисляем из balance_transactions
 */
export async function fetchAuthorBalances(options = {}) {
  const { limit = 50, offset = 0 } = options
  
  try {
    // Получаем все транзакции
    const { data: transactions, error: txError } = await supabase
      .from('balance_transactions')
      .select('author_id, type, amount, status')

    if (txError) throw txError

    // Группируем по авторам и вычисляем балансы
    const authorBalances = {}
    
    for (const tx of (transactions || [])) {
      if (!authorBalances[tx.author_id]) {
        authorBalances[tx.author_id] = {
          author_id: tx.author_id,
          pending_balance: 0,
          available_balance: 0,
          total_earned: 0,
          total_withdrawn: 0
        }
      }
      
      const bal = authorBalances[tx.author_id]
      
      if (tx.type === 'earning') {
        bal.total_earned += tx.amount
        if (tx.status === 'available') {
          bal.available_balance += tx.amount
        } else {
          bal.pending_balance += tx.amount
        }
      } else if (tx.type === 'payout' && tx.status === 'completed') {
        bal.total_withdrawn += tx.amount
        bal.pending_balance -= tx.amount
      }
    }

    // Коррекция отрицательных значений
    Object.values(authorBalances).forEach(bal => {
      bal.pending_balance = Math.max(0, bal.pending_balance)
      bal.available_balance = Math.max(0, bal.available_balance)
    })

    // Получаем профили авторов
    const authorIds = Object.keys(authorBalances)
    if (authorIds.length === 0) {
      return { balances: [], total: 0 }
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', authorIds)

    // Собираем результат
    const profilesMap = {}
    for (const p of (profiles || [])) {
      profilesMap[p.id] = p
    }

    const balancesList = Object.values(authorBalances)
      .map(bal => ({
        ...bal,
        author: profilesMap[bal.author_id] || null
      }))
      .filter(bal => bal.total_earned > 0) // Только с заработком
      .sort((a, b) => b.pending_balance - a.pending_balance) // Сортируем по pending

    // Пагинация
    const total = balancesList.length
    const paginated = balancesList.slice(offset, offset + limit)

    return { balances: paginated, total }
  } catch (error) {
    console.error('Error fetching balances:', error)
    return { balances: [], total: 0 }
  }
}

/**
 * Получает выплаты
 */
export async function fetchPayouts(options = {}) {
  const { limit = 50, offset = 0, status = null } = options
  
  try {
    let query = supabase
      .from('author_payouts')
      .select(`
        *,
        author:profiles(id, display_name, username, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching payouts:', error)
      return { payouts: [], total: 0 }
    }

    return { payouts: data || [], total: count || 0 }
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return { payouts: [], total: 0 }
  }
}

/**
 * Создаёт выплату автору
 */
export async function createPayout(authorId, amount, method = 'bank_transfer', details = {}) {
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
        period_end: periodEnd.toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    // Уведомление
    await createAdminNotification('payout_request', 'Запрос на выплату', `Запрос на выплату ${amount} TJS`, { author_id: authorId, amount })

    return data
  } catch (error) {
    console.error('Error creating payout:', error)
    throw error
  }
}

/**
 * Обрабатывает выплату
 * ЕДИНЫЙ ИСТОЧНИК: пишем ТОЛЬКО в balance_transactions
 */
export async function processPayout(payoutId, status, processedBy, notes = '') {
  try {
    const { data: payout, error: fetchError } = await supabase
      .from('author_payouts')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('author_payouts')
      .update({
        status,
        processed_at: new Date().toISOString(),
        processed_by: processedBy,
        notes
      })
      .eq('id', payoutId)

    if (error) throw error

    // Если выплата завершена - записываем ТОЛЬКО в balance_transactions
    if (status === 'completed') {
      await supabase
        .from('balance_transactions')
        .insert({
          author_id: payout.author_id,
          type: 'payout',
          amount: payout.amount, // Положительная сумма, тип payout
          status: 'completed',
          description: 'Выплата #' + payoutId.slice(0, 8)
        })
    }

    return true
  } catch (error) {
    console.error('Error processing payout:', error)
    throw error
  }
}

/**
 * Получает предупреждения пользователей
 */
export async function fetchUserWarnings(userId = null) {
  try {
    let query = supabase
      .from('user_warnings')
      .select(`
        *,
        user:profiles(id, display_name, username)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching warnings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching warnings:', error)
    return []
  }
}

/**
 * Создаёт предупреждение пользователю
 */
export async function createUserWarning(userId, type, reason, evidence = '', severity = 'warning', action = 'warning') {
  try {
    const { data, error } = await supabase
      .from('user_warnings')
      .insert({
        user_id: userId,
        type,
        reason,
        evidence,
        severity,
        action_taken: action
      })
      .select()
      .single()

    if (error) throw error

    // Уведомление админу
    await createAdminNotification('warning', 'Предупреждение выдано', reason, { user_id: userId, type, severity })

    return data
  } catch (error) {
    console.error('Error creating warning:', error)
    throw error
  }
}

/**
 * Получает рекомендации (РЕКОМЕНДУЮ)
 */
export async function fetchRecommendations(serviceId = null) {
  try {
    let query = supabase
      .from('service_recommendations')
      .select(`
        *,
        user:profiles(id, display_name, username, avatar_url),
        service:author_services(id, title)
      `)
      .order('created_at', { ascending: false })

    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching recommendations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return []
  }
}

/**
 * Получает статистику Safe Deal для дашборда
 * 
 * КАНОН: Источник данных - заказы (service_orders)
 * - Ожидают выплаты = завершённые заказы без payout_id
 */
export async function fetchSafeDealStats() {
  try {
    const [
      ordersResult,
      pendingResult,
      completedResult,
      disputesResult,
      // Заказы ожидающие выплаты (approved + payout_id IS NULL)
      pendingPayoutsResult,
      unreadNotifications
    ] = await Promise.all([
      supabase.from('service_orders').select('id', { count: 'exact', head: true }),
      supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_payment', 'paid', 'in_progress', 'delivered']),
      supabase.from('service_orders').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ['dispute', 'disputed']),
      // Ожидают выплаты = завершённые заказы без выплаты
      supabase.from('service_orders').select('author_earnings').eq('status', 'approved').is('payout_id', null),
      supabase.from('admin_notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)
    ])

    // Сумма ожидающих выплаты (из заказов)
    const pendingPayoutsSum = (pendingPayoutsResult.data || []).reduce((sum, o) => sum + (o.author_earnings || 0), 0)
    const pendingPayoutsCount = (pendingPayoutsResult.data || []).length

    // Всего заработано авторами (из завершённых заказов)
    const { data: completedOrders } = await supabase
      .from('service_orders')
      .select('author_earnings')
      .eq('status', 'approved')
    const totalEarnings = (completedOrders || []).reduce((sum, o) => sum + (o.author_earnings || 0), 0)

    return {
      totalOrders: ordersResult.count || 0,
      pendingOrders: pendingResult.count || 0,
      completedOrders: completedResult.count || 0,
      disputes: disputesResult.count || 0,
      totalEarnings,
      pendingPayouts: pendingPayoutsCount,
      pendingPayoutsSum,
      unreadNotifications: unreadNotifications.count || 0
    }
  } catch (error) {
    console.error('Error fetching SafeDeal stats:', error)
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      disputes: 0,
      totalEarnings: 0,
      pendingPayouts: 0,
      pendingPayoutsSum: 0,
      unreadNotifications: 0
    }
  }
}

/**
 * Фильтрует сообщение на запрещённый контент
 */
export async function filterMessage(message) {
  try {
    const { data: patterns } = await supabase
      .from('blocked_patterns')
      .select('pattern, type')
      .eq('is_active', true)

    if (!patterns) return { blocked: false }

    const lowerMessage = message.toLowerCase()
    
    for (const p of patterns) {
      if (lowerMessage.includes(p.pattern.toLowerCase())) {
        return { blocked: true, reason: p.type, pattern: p.pattern }
      }
    }

    return { blocked: false }
  } catch (error) {
    console.error('Error filtering message:', error)
    return { blocked: false }
  }
}

// ============================================
// СИСТЕМА МЕСЯЧНЫХ ВЫПЛАТ
// ============================================

/**
 * Получает список доступных периодов (месяцев с завершёнными заказами)
 */
export async function fetchPayoutPeriods() {
  try {
    // Получаем все завершённые заказы
    const { data: orders, error } = await supabase
      .from('service_orders')
      .select('completed_at')
      .eq('status', 'approved')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error) throw error

    // Извлекаем уникальные периоды (YYYY-MM)
    const periodsSet = new Set()
    for (const order of (orders || [])) {
      if (order.completed_at) {
        const date = new Date(order.completed_at)
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        periodsSet.add(period)
      }
    }

    // Добавляем текущий месяц если его нет
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    periodsSet.add(currentPeriod)

    // Сортируем по убыванию
    const periods = Array.from(periodsSet).sort((a, b) => b.localeCompare(a))

    return periods
  } catch (error) {
    console.error('Error fetching payout periods:', error)
    return []
  }
}

/**
 * Получает данные по выплатам за период
 */
export async function fetchPayoutsByPeriod(period) {
  try {
    // Получаем завершённые заказы за период БЕЗ выплаты
    const { data: unpaidOrders, error: ordersError } = await supabase
      .from('service_orders')
      .select(`
        id, author_id, price, platform_fee, author_earnings, completed_at, payout_id,
        author:profiles!service_orders_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('status', 'approved')
      .is('payout_id', null)

    if (ordersError) throw ordersError

    // Фильтруем по периоду
    const periodOrders = (unpaidOrders || []).filter(order => {
      if (!order.completed_at) return false
      const date = new Date(order.completed_at)
      const orderPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return orderPeriod === period
    })

    // Группируем по авторам
    const authorData = {}
    for (const order of periodOrders) {
      if (!authorData[order.author_id]) {
        authorData[order.author_id] = {
          author_id: order.author_id,
          author: order.author,
          total_orders_amount: 0,
          platform_fee: 0,
          author_earnings: 0,
          orders_count: 0,
          orders: [],
          status: 'pending',
          paid_at: null
        }
      }
      authorData[order.author_id].total_orders_amount += order.price || 0
      authorData[order.author_id].platform_fee += order.platform_fee || 0
      authorData[order.author_id].author_earnings += order.author_earnings || 0
      authorData[order.author_id].orders_count += 1
      authorData[order.author_id].orders.push(order)
    }

    // Получаем уже выплаченные за этот период
    const { data: paidPayouts } = await supabase
      .from('author_payouts')
      .select(`
        *,
        author:profiles!author_payouts_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('period', period)
      .eq('status', 'paid')

    // Добавляем выплаченных в результат
    for (const payout of (paidPayouts || [])) {
      if (!authorData[payout.author_id]) {
        authorData[payout.author_id] = {
          author_id: payout.author_id,
          author: payout.author,
          total_orders_amount: payout.total_orders_amount,
          platform_fee: payout.platform_fee,
          author_earnings: payout.author_earnings,
          orders_count: payout.orders_count,
          orders: [],
          status: 'paid',
          paid_at: payout.paid_at,
          payout_id: payout.id
        }
      } else {
        // Уже есть новые заказы, но выплата была
        authorData[payout.author_id].previous_payout = payout
      }
    }

    // Считаем итоги
    const authors = Object.values(authorData)
    const totals = {
      total_to_pay: authors.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.author_earnings, 0),
      total_platform_fee: authors.reduce((sum, a) => sum + a.platform_fee, 0),
      total_paid: authors.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.author_earnings, 0),
      authors_count: authors.length,
      pending_count: authors.filter(a => a.status === 'pending' && a.orders_count > 0).length,
      paid_count: authors.filter(a => a.status === 'paid').length
    }

    return {
      period,
      authors: authors.sort((a, b) => b.author_earnings - a.author_earnings),
      totals
    }
  } catch (error) {
    console.error('Error fetching payouts by period:', error)
    return { period, authors: [], totals: { total_to_pay: 0, total_platform_fee: 0, total_paid: 0 } }
  }
}

/**
 * Отмечает выплату автору как выполненную
 * ГАРАНТИИ:
 * - Один заказ не может попасть в две выплаты
 * - Сумма фиксируется один раз и не меняется
 * - После выплаты заказы привязываются к payout_id
 */
export async function markAuthorPaid(authorId, period, paidBy) {
  try {
    // 1. Проверяем что выплата за этот период ещё не была сделана
    const { data: existingPayout } = await supabase
      .from('author_payouts')
      .select('id, status, paid_at')
      .eq('author_id', authorId)
      .eq('period', period)
      .eq('status', 'paid')
      .maybeSingle()

    if (existingPayout) {
      throw new Error(`Выплата за ${period} уже была произведена ${new Date(existingPayout.paid_at).toLocaleDateString('ru-RU')}`)
    }

    // 2. Получаем заказы автора за период БЕЗ выплаты (payout_id IS NULL)
    const { data: orders, error: ordersError } = await supabase
      .from('service_orders')
      .select('id, price, platform_fee, author_earnings, completed_at')
      .eq('author_id', authorId)
      .eq('status', 'approved')
      .is('payout_id', null)

    if (ordersError) throw ordersError

    // 3. Фильтруем по периоду
    const periodOrders = (orders || []).filter(order => {
      if (!order.completed_at) return false
      const date = new Date(order.completed_at)
      const orderPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return orderPeriod === period
    })

    if (periodOrders.length === 0) {
      throw new Error('Нет заказов для выплаты за этот период')
    }

    // 4. Считаем суммы (фиксируем на момент выплаты)
    const totals = periodOrders.reduce((acc, order) => ({
      total_orders_amount: acc.total_orders_amount + (order.price || 0),
      platform_fee: acc.platform_fee + (order.platform_fee || 0),
      author_earnings: acc.author_earnings + (order.author_earnings || 0),
      orders_count: acc.orders_count + 1
    }), { total_orders_amount: 0, platform_fee: 0, author_earnings: 0, orders_count: 0 })

    // 5. Создаём запись выплаты (INSERT, не UPSERT - защита от дублей)
    const { data: payout, error: payoutError } = await supabase
      .from('author_payouts')
      .insert({
        author_id: authorId,
        period: period,
        total_orders_amount: totals.total_orders_amount,
        platform_fee: totals.platform_fee,
        author_earnings: totals.author_earnings,
        orders_count: totals.orders_count,
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: paidBy
      })
      .select()
      .single()

    if (payoutError) {
      // Если ошибка уникальности - выплата уже существует
      if (payoutError.code === '23505') {
        throw new Error('Выплата за этот период уже существует')
      }
      throw payoutError
    }

    // 6. Привязываем заказы к выплате (атомарно)
    const orderIds = periodOrders.map(o => o.id)
    const { error: updateError } = await supabase
      .from('service_orders')
      .update({ payout_id: payout.id })
      .in('id', orderIds)
      .is('payout_id', null) // Дополнительная защита - обновляем только те, у которых ещё нет payout_id

    if (updateError) throw updateError

    // 7. Уведомление
    await createAdminNotification(
      'payout_completed',
      'Выплата произведена',
      `Автору выплачено ${totals.author_earnings} TJS за ${period}`,
      { author_id: authorId, amount: totals.author_earnings, period }
    )

    return payout
  } catch (error) {
    console.error('Error marking author paid:', error)
    throw error
  }
}

/**
 * Получает данные для CSV экспорта за период
 */
export async function fetchPayoutCSVData(period) {
  try {
    // Получаем все заказы за период (и оплаченные и нет)
    const { data: orders, error } = await supabase
      .from('service_orders')
      .select(`
        id, price, platform_fee, author_earnings, completed_at, payout_id,
        author:profiles!service_orders_author_id_fkey(id, display_name, username),
        service:author_services(title)
      `)
      .eq('status', 'approved')
      .order('completed_at', { ascending: true })

    if (error) throw error

    // Фильтруем по периоду
    const periodOrders = (orders || []).filter(order => {
      if (!order.completed_at) return false
      const date = new Date(order.completed_at)
      const orderPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return orderPeriod === period
    })

    // Формируем данные для CSV
    const csvData = periodOrders.map(order => ({
      period,
      author_name: order.author?.display_name || order.author?.username || 'Unknown',
      author_id: order.author_id,
      order_id: order.id,
      service_title: order.service?.title || 'Услуга',
      completed_at: order.completed_at,
      order_amount: order.price,
      platform_fee: order.platform_fee,
      author_earnings: order.author_earnings,
      is_paid: order.payout_id ? 'Да' : 'Нет'
    }))

    return csvData
  } catch (error) {
    console.error('Error fetching CSV data:', error)
    return []
  }
}

/**
 * Получает баланс автора для страницы автора
 */
export async function fetchAuthorPayoutBalance(authorId) {
  try {
    // В ожидании = завершённые заказы без выплаты
    const { data: pendingOrders } = await supabase
      .from('service_orders')
      .select('author_earnings')
      .eq('author_id', authorId)
      .eq('status', 'approved')
      .is('payout_id', null)

    const pending = (pendingOrders || []).reduce((sum, o) => sum + (o.author_earnings || 0), 0)

    // Выплачено = сумма всех выплат
    const { data: payouts } = await supabase
      .from('author_payouts')
      .select('author_earnings, period, paid_at')
      .eq('author_id', authorId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    const paid = (payouts || []).reduce((sum, p) => sum + (p.author_earnings || 0), 0)

    // Всего заработано
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
