// src/services/billingService.ts

import { supabase } from './supabaseClient'

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus'

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: 'active' | 'canceled' | 'expired'
  current_period_end: string
  auto_renew: boolean
  created_at: string
}

export interface SubscriptionPlan {
  id: SubscriptionTier
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  description?: string
  badge?: string
  features_list?: string[]
  features: {
    projects_limit: number | null // null = unlimited
    storage_limit_gb: number
    premium_content: boolean
    priority_support: boolean
  }
}

// Дефолтные планы (fallback если в базе пусто)
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'FREE',
    price: 0,
    currency: 'TJS',
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
    name: 'PREMIUM',
    price: 160,
    currency: 'TJS',
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
    name: 'PREMIUM+',
    price: 1100,
    currency: 'TJS',
    interval: 'year',
    features: {
      projects_limit: null,
      storage_limit_gb: 200,
      premium_content: true,
      priority_support: true
    }
  }
]

// Кеш для планов
let plansCache: SubscriptionPlan[] | null = null
let plansCacheTime: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

/**
 * Получает тарифные планы из базы данных
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  // Проверяем кеш
  if (plansCache && Date.now() - plansCacheTime < CACHE_TTL) {
    return plansCache
  }

  try {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.warn('Error fetching billing_plans, using defaults:', error)
      return DEFAULT_PLANS
    }

    if (!data || data.length === 0) {
      return DEFAULT_PLANS
    }

    // Маппим данные из БД в формат SubscriptionPlan
    const plans: SubscriptionPlan[] = data.map(plan => ({
      id: plan.id as SubscriptionTier,
      name: plan.name || plan.id,
      price: plan.price || 0,
      currency: plan.currency || 'TJS',
      interval: plan.period || 'month', // period в БД -> interval в коде
      description: plan.description,
      badge: plan.badge,
      features_list: plan.features_list || [],
      features: {
        projects_limit: null,
        storage_limit_gb: 50,
        premium_content: plan.id !== 'free',
        priority_support: plan.id === 'premium_plus'
      }
    }))

    // Сохраняем в кеш
    plansCache = plans
    plansCacheTime = Date.now()

    return plans
  } catch (error) {
    console.warn('Error loading plans:', error)
    return DEFAULT_PLANS
  }
}

/**
 * Получает конкретный план по ID
 */
export async function getPlanById(planId: string): Promise<SubscriptionPlan | null> {
  const plans = await getPlans()
  return plans.find(p => p.id === planId) || null
}

/**
 * Очищает кеш планов (вызывать после обновления в админке)
 */
export function clearPlansCache(): void {
  plansCache = null
  plansCacheTime = 0
}

/**
 * Получает настройки страницы тарифов
 */
export async function getPricingSettings(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error) {
      console.warn('Error fetching pricing_settings:', error)
      return null
    }

    return data
  } catch (error) {
    console.warn('Error loading pricing settings:', error)
    return null
  }
}

// Для обратной совместимости
export const SUBSCRIPTION_PLANS = DEFAULT_PLANS

/**
 * Получает текущую подписку пользователя
 */
export async function getCurrentSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle() // Используем maybeSingle вместо single, чтобы не выбрасывать ошибку при отсутствии записи

    if (error) {
      // Если таблица не существует (ошибка 42P01, 404, или PGRST301) - просто возвращаем null без предупреждений
      if (error.code === '42P01' || 
          error.code === 'PGRST301' || 
          error.code === 'PGRST116' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found')) {
        // Таблица не существует - это нормально, используем профиль
        return null
      }
      // Другие ошибки тоже игнорируем тихо
      return null
    }

    return data
  } catch (error: any) {
    // Обрабатываем любые неожиданные ошибки (например, проблемы с сетью)
    // Игнорируем все ошибки тихо - используем профиль вместо этого
    return null
  }
}

/**
 * Инициирует подписку (создает checkout session)
 */
export async function initiateSubscription(
  userId: string,
  planId: SubscriptionTier
): Promise<{ checkout_url: string }> {
  // Здесь должна быть интеграция с Stripe/Paddle
  // Пока возвращаем мок
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
  if (!plan) {
    throw new Error('Invalid plan ID')
  }

  // TODO: Интеграция с платежной системой
  // const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  //   body: { userId, planId }
  // })

  // Мок для демонстрации
  return {
    checkout_url: `https://checkout.example.com/session?plan=${planId}&user=${userId}`
  }
}

/**
 * Отменяет подписку
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      auto_renew: false
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

/**
 * Возобновляет подписку
 */
export async function renewSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      auto_renew: true
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error renewing subscription:', error)
    throw error
  }
}

