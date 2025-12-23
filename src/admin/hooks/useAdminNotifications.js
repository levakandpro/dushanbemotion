// src/admin/hooks/useAdminNotifications.js
// Хук для уведомлений админки с звуками

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { clearAdminNotifications, fetchUnreadAdminNotificationsCount, fetchAdminNotifications } from '../api/adminApi';

// Звук уведомления (тот же что для чата)
const notificationSound = typeof Audio !== 'undefined' 
  ? new Audio('https://archive.org/download/zvuk-chiha-multyashny/zvuk-chiha-multyashny.mp3') 
  : null;

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasPlayedRef = useRef(new Set());

  const refreshUnreadCount = useCallback(async () => {
    const count = await fetchUnreadAdminNotificationsCount()
    setUnreadCount(count)
  }, [])

  // Воспроизвести звук
  const playSound = useCallback(() => {
    try {
      if (notificationSound) {
        notificationSound.volume = 0.3;
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }, []);

  // Показать браузерное уведомление
  const showBrowserNotification = useCallback((title, body, icon = '🔔') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'admin-notification',
        renotify: true
      });
    }
  }, []);

  // Добавить уведомление
  const addNotification = useCallback((notification) => {
    const id = notification.id || `notif-${Date.now()}`;
    
    // Не повторяем звук для одного и того же уведомления
    if (!hasPlayedRef.current.has(id)) {
      hasPlayedRef.current.add(id);
      playSound();
      
      // Браузерное уведомление если вкладка не активна
      if (document.visibilityState !== 'visible') {
        showBrowserNotification(notification.title, notification.message);
      }
    }

    setNotifications(prev => {
      if (prev.find(n => n.id === id)) return prev;
      return [{ ...notification, id, timestamp: Date.now() }, ...prev].slice(0, 50);
    });
  }, [playSound, showBrowserNotification]);

  // Очистить уведомление
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Очистить все
  const clearAll = useCallback(async () => {
    try {
      await clearAdminNotifications('mark_read')
    } catch (e) {
      // ignore
    }
    setNotifications([]);
    setUnreadCount(0);
    hasPlayedRef.current = new Set();
  }, []);

  // Загрузка уведомлений из БД при старте + подписка на realtime
  useEffect(() => {
    // Загружаем существующие непрочитанные уведомления из БД
    const loadInitialNotifications = async () => {
      try {
        const dbNotifications = await fetchAdminNotifications({ limit: 50, unreadOnly: true })
        const mapped = (dbNotifications || []).map(n => ({
          id: `admin-notif-${n.id}`,
          dbId: n.id,
          type: n.type || 'notification',
          icon: n.type === 'premium_payment' ? '💳' : '🔔',
          title: n.title || 'Уведомление',
          message: n.message || '',
          timestamp: new Date(n.created_at).getTime(),
          data: n
        }))
        setNotifications(mapped)
        // Помечаем что эти уже "известны" (не играть звук повторно)
        mapped.forEach(n => hasPlayedRef.current.add(n.id))
      } catch (e) {
        console.error('Error loading initial notifications:', e)
      }
    }

    loadInitialNotifications()
    refreshUnreadCount()

    // Новые пользователи
    const usersChannel = supabase
      .channel('admin-new-users')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          addNotification({
            id: `user-${payload.new.id}`,
            type: 'new_user',
            icon: '🆕',
            title: 'Новый пользователь',
            message: payload.new.display_name || payload.new.username || payload.new.email || 'Неизвестный',
            data: payload.new
          });
          
          // Отправляем в Telegram
          import('../../services/telegramService').then(({ notifyNewUser }) => {
            notifyNewUser(payload.new.display_name, payload.new.username, payload.new.email)
          }).catch(e => console.error('Telegram error:', e))
        }
      )
      .subscribe();

    // Новые заказы
    const ordersChannel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_orders' },
        (payload) => {
          addNotification({
            id: `order-${payload.new.id}`,
            type: 'new_order',
            icon: '📦',
            title: 'Новый заказ',
            message: `Заказ #${payload.new.id.slice(0, 8)} на ${payload.new.price} DMC`,
            data: payload.new
          });
        }
      )
      .subscribe();

    // Изменения статуса заказов
    const orderStatusChannel = supabase
      .channel('admin-order-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_orders' },
        (payload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          
          if (oldStatus !== newStatus) {
            const statusLabels = {
              pending_payment: '💳 Ожидает подтверждения оплаты',
              paid: '✅ Оплачен',
              in_progress: '🔨 В работе',
              delivered: '📬 Сдан',
              approved: '🎉 Завершён',
              disputed: '⚠️ Спор открыт',
              cancelled: '❌ Отменён',
              refunded: '↩️ Возврат'
            };
            
            addNotification({
              id: `order-status-${payload.new.id}-${newStatus}`,
              type: 'order_status',
              icon: statusLabels[newStatus]?.split(' ')[0] || '📋',
              title: 'Статус заказа изменён',
              message: `#${payload.new.id.slice(0, 8)}: ${statusLabels[newStatus] || newStatus}`,
              data: payload.new
            });
          }
        }
      )
      .subscribe();

    // Новые подписки
    const subsChannel = supabase
      .channel('admin-new-subs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subscriptions' },
        (payload) => {
          const planLabels = {
            free: '🆓 Free',
            basic: '💎 Basic',
            pro: '👑 Pro',
            premium: '🌟 Premium'
          };
          
          addNotification({
            id: `sub-${payload.new.id}`,
            type: 'new_subscription',
            icon: '💳',
            title: 'Новая подписка',
            message: `${planLabels[payload.new.plan_id] || payload.new.plan_id}`,
            data: payload.new
          });
        }
      )
      .subscribe();

    // Запросы на выплату
    const payoutsChannel = supabase
      .channel('admin-payouts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'author_payouts' },
        (payload) => {
          addNotification({
            id: `payout-${payload.new.id}`,
            type: 'payout_request',
            icon: '💰',
            title: 'Запрос на выплату',
            message: `${payload.new.amount} DMC`,
            data: payload.new
          });
        }
      )
      .subscribe();

    // Уведомления админки (в т.ч. оплаты PREMIUM)
    const adminNotifsChannel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const type = payload.new?.type || 'notification'
          const title = payload.new?.title || 'Уведомление'
          const message = payload.new?.message || ''

          addNotification({
            id: `admin-notif-${payload.new.id}`,
            type: type,
            icon: type === 'premium_payment' ? '💳' : '🔔',
            title,
            message,
            data: payload.new
          })

          refreshUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_notifications' },
        () => {
          refreshUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'admin_notifications' },
        () => {
          refreshUnreadCount()
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderStatusChannel);
      supabase.removeChannel(subsChannel);
      supabase.removeChannel(payoutsChannel);
      supabase.removeChannel(adminNotifsChannel);
    };
  }, [addNotification, refreshUnreadCount]);

  // Запросить разрешение на уведомления
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    dismissNotification,
    clearAll,
    requestPermission,
    playSound
  };
}

export default useAdminNotifications;

