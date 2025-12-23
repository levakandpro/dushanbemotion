// supabase/functions/telegram-bot/index.ts
// Telegram Bot Webhook для команд

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8176176626:AAEoxnvMJmarT4jMfLoERfTdLgdIOYgrWQE'
const TELEGRAM_CHAT_ID = '8247308735'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  })
}

async function getStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // Новые пользователи за сегодня
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO)

  // Новые заказы за сегодня
  const { data: orders } = await supabase
    .from('service_orders')
    .select('price, status')
    .gte('created_at', todayISO)

  const newOrders = orders?.length || 0
  const revenue = orders?.reduce((sum, o) => sum + (o.price || 0), 0) || 0
  const completedOrders = orders?.filter(o => o.status === 'completed' || o.status === 'approved').length || 0

  // Новые PREMIUM за сегодня
  const { count: newPremium } = await supabase
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'premium_payment')
    .gte('created_at', todayISO)

  // Всего пользователей
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Активные PREMIUM
  const { count: activePremium } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .neq('current_plan', 'free')
    .not('current_plan', 'is', null)

  return {
    newUsers: newUsers || 0,
    newOrders,
    revenue,
    completedOrders,
    newPremium: newPremium || 0,
    totalUsers: totalUsers || 0,
    activePremium: activePremium || 0
  }
}

async function getOrders() {
  const { data: orders } = await supabase
    .from('service_orders')
    .select('id, price, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return orders || []
}

async function getUsers() {
  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name, username, current_plan, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return users || []
}

serve(async (req) => {
  try {
    const body = await req.json()
    const message = body.message

    if (!message?.text) {
      return new Response('OK', { status: 200 })
    }

    const chatId = message.chat.id.toString()
    const text = message.text.trim()

    // Проверяем что это наш чат
    if (chatId !== TELEGRAM_CHAT_ID) {
      await sendMessage(chatId, '⛔ Доступ запрещён')
      return new Response('OK', { status: 200 })
    }

    // Обрабатываем команды
    if (text === '/start' || text === '/help') {
      await sendMessage(chatId, `
🤖 <b>D MOTION Bot</b>

Доступные команды:

/stats — Статистика за сегодня
/orders — Последние 10 заказов
/users — Последние 10 пользователей
/premium — Активные PREMIUM подписки
/test — Тестовое сообщение
`)
    } 
    else if (text === '/stats') {
      const stats = await getStats()
      await sendMessage(chatId, `
📊 <b>СТАТИСТИКА ЗА СЕГОДНЯ</b>

👥 Новых пользователей: <b>${stats.newUsers}</b>
📦 Новых заказов: <b>${stats.newOrders}</b>
💰 Выручка: <b>${stats.revenue} сомони</b>
✅ Завершено: <b>${stats.completedOrders}</b>
💳 Новых PREMIUM: <b>${stats.newPremium}</b>

📈 <b>ВСЕГО:</b>
👥 Пользователей: ${stats.totalUsers}
💎 Активных PREMIUM: ${stats.activePremium}
`)
    }
    else if (text === '/orders') {
      const orders = await getOrders()
      if (orders.length === 0) {
        await sendMessage(chatId, '📦 Заказов пока нет')
      } else {
        const statusEmoji: Record<string, string> = {
          pending: '⏳',
          paid: '💳',
          in_progress: '🔨',
          delivered: '📬',
          completed: '✅',
          approved: '✅',
          disputed: '⚠️',
          cancelled: '❌'
        }
        const list = orders.map(o => 
          `${statusEmoji[o.status] || '📋'} <code>${o.id.slice(0, 8)}</code> — ${o.price} сом`
        ).join('\n')
        await sendMessage(chatId, `📦 <b>Последние заказы:</b>\n\n${list}`)
      }
    }
    else if (text === '/users') {
      const users = await getUsers()
      if (users.length === 0) {
        await sendMessage(chatId, '👥 Пользователей пока нет')
      } else {
        const list = users.map(u => {
          const plan = u.current_plan && u.current_plan !== 'free' ? '💎' : ''
          return `${plan} ${u.display_name || u.username || 'Без имени'}`
        }).join('\n')
        await sendMessage(chatId, `👥 <b>Последние пользователи:</b>\n\n${list}`)
      }
    }
    else if (text === '/premium') {
      const { data: premium } = await supabase
        .from('profiles')
        .select('display_name, username, current_plan, plan_expires_at')
        .neq('current_plan', 'free')
        .not('current_plan', 'is', null)
        .order('plan_expires_at', { ascending: false })
        .limit(20)

      if (!premium || premium.length === 0) {
        await sendMessage(chatId, '💎 Активных PREMIUM подписок нет')
      } else {
        const list = premium.map(u => {
          const expires = u.plan_expires_at 
            ? new Date(u.plan_expires_at).toLocaleDateString('ru-RU')
            : '∞'
          return `💎 ${u.display_name || u.username} — до ${expires}`
        }).join('\n')
        await sendMessage(chatId, `💎 <b>PREMIUM подписки:</b>\n\n${list}`)
      }
    }
    else if (text === '/test') {
      await sendMessage(chatId, '✅ Бот работает!')
    }
    else {
      await sendMessage(chatId, '❓ Неизвестная команда. Напиши /help')
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return new Response('Error', { status: 500 })
  }
})
