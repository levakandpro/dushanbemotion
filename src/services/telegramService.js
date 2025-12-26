// src/services/telegramService.js
// Сервис для отправки уведомлений в Telegram

const TELEGRAM_BOT_TOKEN = '8176176626:AAEoxnvMJmarT4jMfLoERfTdLgdIOYgrWQE';
const TELEGRAM_CHAT_ID = '8247308735';

/**
 * Отправить сообщение в Telegram
 */
export async function sendTelegramMessage(text, parseMode = 'HTML') {
  try {
    console.log('[Telegram] Sending message...', { hasToken: !!TELEGRAM_BOT_TOKEN, hasChatId: !!TELEGRAM_CHAT_ID });
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('[Telegram] API error:', data);
      return false;
    }
    
    console.log('[Telegram] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[Telegram] Error sending message:', error);
    return false;
  }
}

/**
 * Уведомление о новой оплате PREMIUM
 */
export async function notifyPremiumPayment(userId, planId, screenshotUrl) {
  const message = `
💳 <b>НОВАЯ ОПЛАТА PREMIUM!</b>

👤 User ID: <code>${userId?.slice(0, 8) || 'N/A'}</code>
📦 Тариф: <b>${planId || 'premium'}</b>
${screenshotUrl ? `📷 <a href="${screenshotUrl}">Скриншот оплаты</a>` : ''}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}

🔗 Открой админку для подтверждения
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о новом заказе услуги
 */
export async function notifyNewOrder(orderId, price, serviceName) {
  const message = `
📦 <b>НОВЫЙ ЗАКАЗ!</b>

🆔 Заказ: <code>${orderId?.slice(0, 8) || 'N/A'}</code>
💰 Сумма: <b>${price} сомони</b>
📋 Услуга: ${serviceName || 'Не указана'}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о запросе на выплату
 */
export async function notifyPayoutRequest(authorName, amount) {
  const message = `
💰 <b>ЗАПРОС НА ВЫПЛАТУ!</b>

👤 Автор: <b>${authorName || 'Неизвестный'}</b>
💵 Сумма: <b>${amount} сомони</b>

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о новом сообщении в чате заказа
 */
export async function notifyNewChatMessage(orderId, senderName, messageText) {
  const message = `
💬 <b>НОВОЕ СООБЩЕНИЕ В ЧАТЕ!</b>

🆔 Заказ: <code>${orderId?.slice(0, 8) || 'N/A'}</code>
👤 От: <b>${senderName || 'Пользователь'}</b>
📝 ${messageText?.slice(0, 100) || '...'}${messageText?.length > 100 ? '...' : ''}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о споре
 */
export async function notifyDispute(orderId, reason) {
  const message = `
⚠️ <b>ОТКРЫТ СПОР!</b>

🆔 Заказ: <code>${orderId?.slice(0, 8) || 'N/A'}</code>
📋 Причина: ${reason || 'Не указана'}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}

🔗 Срочно проверь в админке!
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о завершении заказа
 */
export async function notifyOrderCompleted(orderId, price, authorEarnings) {
  const message = `
✅ <b>ЗАКАЗ ЗАВЕРШЁН!</b>

🆔 Заказ: <code>${orderId?.slice(0, 8) || 'N/A'}</code>
💰 Сумма: <b>${price} сомони</b>
👤 Автору: <b>${authorEarnings} сомони</b>

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Уведомление о новом пользователе
 */
export async function notifyNewUser(displayName, username, email) {
  const message = `
👤 <b>НОВЫЙ ПОЛЬЗОВАТЕЛЬ!</b>

📛 Имя: <b>${displayName || 'Не указано'}</b>
🔗 Username: @${username || 'нет'}
📧 Email: ${email || 'не указан'}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Ежедневная статистика
 */
export async function notifyDailyStats(stats) {
  const message = `
📊 <b>СТАТИСТИКА ЗА СЕГОДНЯ</b>

👥 Новых пользователей: <b>${stats.newUsers || 0}</b>
📦 Новых заказов: <b>${stats.newOrders || 0}</b>
💰 Выручка: <b>${stats.revenue || 0} сомони</b>
✅ Завершено заказов: <b>${stats.completedOrders || 0}</b>
💳 Новых PREMIUM: <b>${stats.newPremium || 0}</b>

📅 ${new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Dushanbe' })}
`;

  return sendTelegramMessage(message);
}

/**
 * Тестовое сообщение
 */
export async function sendTestMessage() {
  return sendTelegramMessage('🔔 <b>Тест!</b>\n\nУведомления D MOTION работают.');
}

export default {
  sendTelegramMessage,
  notifyPremiumPayment,
  notifyNewOrder,
  notifyPayoutRequest,
  notifyNewChatMessage,
  notifyDispute,
  notifyOrderCompleted,
  notifyNewUser,
  notifyUserLogin,
  notifyDailyStats,
  sendTestMessage
};
