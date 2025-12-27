// src/admin/screens/SafeDealScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchServiceOrders,
  fetchSafeDealStats,
  fetchAdminNotifications,
  updateOrderStatus,
  deleteOrder,
  markNotificationRead,
  createAdminNotification,
  // Новая система выплат
  fetchPayoutPeriods,
  fetchPayoutsByPeriod,
  markAuthorPaid,
  fetchPayoutCSVData
} from '../api/adminApi';
import { useAuth } from "../../lib/useAuth";
import { supabase } from '../../lib/supabaseClient';
import Loader from "../../components/ui/Loader";

export default function SafeDealScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview'); // overview, orders, payouts, notifications
  
  // Проверяем флаг для автоматического открытия вкладки уведомлений
  useEffect(() => {
    if (window.__openSafeDealNotifications) {
      setTab('notifications');
      window.__openSafeDealNotifications = false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [premiumApproving, setPremiumApproving] = useState(false);
  
  // Состояния для системы выплат
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [payoutData, setPayoutData] = useState({ authors: [], totals: {} });
  const [payoutLoading, setPayoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, notifs] = await Promise.all([
        fetchSafeDealStats(),
        fetchAdminNotifications({ limit: 100 })
      ]);
      const premiumPayments = notifs?.filter(n => n.type === 'premium_payment' && !n.is_read) || [];
      console.log('🔔 SafeDeal notifications:', notifs?.length, 'total');
      console.log('💳 Premium payments (unread):', premiumPayments.length);
      if (premiumPayments.length > 0) {
        console.log('💳 Premium payments details:', premiumPayments.map(n => ({ 
          id: n.id, 
          title: n.title, 
          user_id: n.user_id, 
          created_at: n.created_at,
          has_screenshot: !!n.metadata?.payment_screenshot
        })));
      }
      setStats(statsData);
      setNotifications(notifs);

      if (tab === 'orders') {
        const { orders: o } = await fetchServiceOrders({ status: orderFilter === 'all' ? null : orderFilter });
        setOrders(o);
      } else if (tab === 'payouts') {
        // Загружаем периоды
        const periodsData = await fetchPayoutPeriods();
        setPeriods(periodsData);
        if (periodsData.length > 0 && !selectedPeriod) {
          setSelectedPeriod(periodsData[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, orderFilter, selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Изменить статус на "${newStatus}"?`)) return;
    try {
      await updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('⚠️ Удалить заказ? Это действие нельзя отменить!')) return;
    try {
      await deleteOrder(orderId);
      loadData();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  // Загрузка данных выплат при смене периода
  useEffect(() => {
    if (selectedPeriod && tab === 'payouts') {
      setPayoutLoading(true);
      fetchPayoutsByPeriod(selectedPeriod)
        .then(data => setPayoutData(data))
        .finally(() => setPayoutLoading(false));
    }
  }, [selectedPeriod, tab]);

  // Отметить выплату автору
  const handleMarkPaid = async (authorId, authorName, amount) => {
    if (!window.confirm(`Отметить выплату ${fmtMoney(amount)} автору ${authorName}?\n\nЭто действие зафиксирует сумму и привяжет заказы к выплате.`)) return;
    try {
      await markAuthorPaid(authorId, selectedPeriod, user?.id);
      // Перезагружаем данные
      const data = await fetchPayoutsByPeriod(selectedPeriod);
      setPayoutData(data);
      alert('✅ Выплата отмечена!');
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  // Скачать CSV
  const handleDownloadCSV = async () => {
    try {
      const data = await fetchPayoutCSVData(selectedPeriod);
      if (data.length === 0) {
        alert('Нет данных для экспорта');
        return;
      }
      
      // Формируем CSV
      const headers = ['Период', 'Автор', 'ID заказа', 'Услуга', 'Дата завершения', 'Сумма заказа', 'Комиссия', 'Чистыми автору', 'Выплачено'];
      const rows = data.map(row => [
        row.period,
        row.author_name,
        row.order_id,
        row.service_title,
        row.completed_at ? new Date(row.completed_at).toLocaleDateString('ru-RU') : '',
        row.order_amount,
        row.platform_fee,
        row.author_earnings,
        row.is_paid
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payouts_${selectedPeriod}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  // Форматирование периода
  const formatPeriod = (period) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const fmt = (n) => (n || 0).toLocaleString('ru-RU');
  const fmtMoney = (n) => `${fmt(n)} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const addDays = (date, days) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  const handleApprovePremiumPayment = async (notif) => {
    if (premiumApproving) return
    const userId = notif?.user_id || notif?.metadata?.user_id
    const planId = notif?.metadata?.plan_id || 'premium'
    if (!userId) {
      alert('Не найден user_id в уведомлении')
      return
    }

    if (!window.confirm(`Активировать ${planId} пользователю ${userId.slice(0, 8)} на 30 дней?`)) return

    try {
      setPremiumApproving(true)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, current_plan, plan_expires_at, is_lifetime')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        throw profileError || new Error('Профиль не найден')
      }

      if (profile.is_lifetime) {
        await markNotificationRead(notif.id)
        alert('У пользователя Lifetime — продление не требуется')
        return
      }

      const now = new Date()
      const currentExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      const baseDate = currentExpires && currentExpires > now ? currentExpires : now
      const newExpiresAt = addDays(baseDate, 30)

      console.log('🔄 Activating premium via RPC:', { userId, planId })
      
      // Сначала пробуем через RPC (обходит RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('activate_premium', {
        p_user_id: userId,
        p_plan_id: planId,
        p_days: 30
      })
      
      if (rpcError) {
        console.error('❌ RPC failed, trying direct update:', rpcError)
        
        // Fallback: прямое обновление (может не сработать из-за RLS)
        const { data: updateData, error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            current_plan: planId,
            plan_expires_at: newExpiresAt.toISOString()
          })
          .eq('id', userId)
          .select()

        console.log('✅ Direct update result:', { updateData, updateProfileError })

        if (updateProfileError || !updateData || updateData.length === 0) {
          // Показываем SQL для ручного выполнения
          const sql = `UPDATE profiles SET current_plan = '${planId}', plan_expires_at = '${newExpiresAt.toISOString()}' WHERE id = '${userId}';`
          console.error('❌ Direct update failed. Run this SQL in Supabase:', sql)
          
          // Копируем SQL в буфер обмена
          try {
            await navigator.clipboard.writeText(sql)
            alert(`⚠️ RLS блокирует обновление.\n\nSQL скопирован в буфер обмена!\n\nВставьте в Supabase SQL Editor и выполните.`)
          } catch (e) {
            alert(`⚠️ RLS блокирует обновление.\n\nВыполните в Supabase SQL Editor:\n\n${sql}`)
          }
          throw new Error('RLS блокирует. Выполните SQL вручную.')
        }
      } else {
        console.log('✅ RPC success:', rpcData)
      }

      // Пытаемся обновить заявку user_plans если есть
      const userPlanId = notif?.metadata?.user_plan_id
      if (userPlanId) {
        try {
          await supabase
            .from('user_plans')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', userPlanId)
        } catch (e) {
          console.warn('Could not update user_plans status:', e)
        }
      }

      await markNotificationRead(notif.id)

      // Сохраняем полную историю оплаты для доказательств
      await createAdminNotification(
        'premium_approved',
        '✅ PREMIUM активирован',
        `Пользователю ${userId.slice(0, 8)} активирован ${planId} до ${newExpiresAt.toLocaleDateString('ru-RU')}`,
        { 
          user_id: userId, 
          plan_id: planId,
          expires_at: newExpiresAt.toISOString(),
          approved_at: new Date().toISOString(),
          // Сохраняем скрин оплаты для истории
          payment_screenshot: notif?.metadata?.payment_screenshot || null,
          payment_method: notif?.metadata?.payment_method || null,
          original_notification_id: notif.id
        }
      )

      await loadData()
      alert('✅ PREMIUM активирован')
    } catch (e) {
      alert('Ошибка: ' + (e?.message || 'Не удалось подтвердить'))
    } finally {
      setPremiumApproving(false)
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Ожидает',
      'pending_payment': 'Ожидает подтверждения',
      'paid': 'Оплачен',
      'in_progress': 'В работе',
      'delivered': 'Доставлен',
      'approved': 'Завершён',
      'cancelled': 'Отменён',
      'dispute': 'Спор',
      'disputed': 'Спор',
      'refunded': 'Возврат'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9500',
      'pending_payment': '#ff9500',
      'paid': '#007aff',
      'in_progress': '#5856d6',
      'delivered': '#34c759',
      'approved': '#30d158',
      'cancelled': '#ff3b30',
      'dispute': '#ff2d55',
      'disputed': '#ff2d55',
      'refunded': '#6c757d'
    };
    return colors[status] || '#86868b';
  };

  return (
    <div className="dm-safedeal">
      {/* Табы */}
      <div className="dm-safedeal__tabs">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
          Обзор
          {stats?.unreadNotifications > 0 && <span className="dm-safedeal__badge">{stats.unreadNotifications}</span>}
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Заказы
          {stats?.pendingOrders > 0 && <span className="dm-safedeal__badge">{stats.pendingOrders}</span>}
        </button>
        <button className={tab === 'payouts' ? 'active' : ''} onClick={() => setTab('payouts')}>
          Выплаты
        </button>
        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
          Уведомления
          {notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length > 0 && (
            <span className="dm-safedeal__badge dm-safedeal__badge--premium">
              {notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length} 💳
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : (
        <>
          {/* ОБЗОР */}
          {tab === 'overview' && stats && (
            <div className="dm-safedeal__overview">
              {/* ВАЖНО: Ожидающие оплаты PREMIUM - показываем первым */}
              {notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length > 0 && (
                <div className="dm-safedeal__premium-alert">
                  <div className="dm-safedeal__premium-alert-icon">💳</div>
                  <div className="dm-safedeal__premium-alert-text">
                    <strong>{notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length} оплат ожидают подтверждения!</strong>
                    <span>Проверьте скрины и подтвердите PREMIUM</span>
                  </div>
                  <button 
                    className="dm-safedeal__premium-alert-btn"
                    onClick={() => setTab('notifications')}
                  >
                    Перейти →
                  </button>
                </div>
              )}

              <div className="dm-safedeal__stats">
                <div className="dm-safedeal__stat dm-safedeal__stat--premium">
                  <div className="dm-safedeal__stat-value">{notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length}</div>
                  <div className="dm-safedeal__stat-label">💳 Ожидают PREMIUM</div>
                </div>
                <div className="dm-safedeal__stat">
                  <div className="dm-safedeal__stat-value">{fmt(stats.totalOrders)}</div>
                  <div className="dm-safedeal__stat-label">Всего заказов</div>
                </div>
                <div className="dm-safedeal__stat dm-safedeal__stat--warning">
                  <div className="dm-safedeal__stat-value">{fmt(stats.pendingOrders)}</div>
                  <div className="dm-safedeal__stat-label">В процессе</div>
                </div>
                <div className="dm-safedeal__stat dm-safedeal__stat--success">
                  <div className="dm-safedeal__stat-value">{fmt(stats.completedOrders)}</div>
                  <div className="dm-safedeal__stat-label">Завершено</div>
                </div>
                <div className="dm-safedeal__stat dm-safedeal__stat--danger">
                  <div className="dm-safedeal__stat-value">{fmt(stats.disputes)}</div>
                  <div className="dm-safedeal__stat-label">Споры</div>
                </div>
                <div className="dm-safedeal__stat dm-safedeal__stat--accent">
                  <div className="dm-safedeal__stat-value">{fmtMoney(stats.totalEarnings)}</div>
                  <div className="dm-safedeal__stat-label">Заработано авторами</div>
                </div>
              </div>

              {/* ОЖИДАЮЩИЕ ПОДТВЕРЖДЕНИЯ PREMIUM */}
              {notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length > 0 && (
                <div className="dm-safedeal__section dm-safedeal__section--premium">
                  <h3>💳 Ожидают подтверждения PREMIUM ({notifications.filter(n => n.type === 'premium_payment' && !n.is_read).length})</h3>
                  <div className="dm-safedeal__notif-list">
                    {notifications.filter(n => n.type === 'premium_payment' && !n.is_read).map(n => (
                      <div 
                        key={n.id} 
                        className="dm-safedeal__notif dm-safedeal__notif--unread dm-safedeal__notif--premium"
                      >
                        <div className="dm-safedeal__notif-icon">💳</div>
                        <div className="dm-safedeal__notif-content">
                          <div className="dm-safedeal__notif-title">{n.title}</div>
                          <div className="dm-safedeal__notif-message">{n.message}</div>
                          <div className="dm-safedeal__notif-time">{fmtDate(n.created_at)}</div>
                          <div className="dm-safedeal__notif-actions" onClick={(e) => e.stopPropagation()}>
                            {n.metadata?.payment_screenshot && (
                              <button
                                type="button"
                                onClick={() => window.open(n.metadata.payment_screenshot, '_blank', 'noopener,noreferrer')}
                              >
                                📷 Скрин оплаты
                              </button>
                            )}
                            <button
                              type="button"
                              className="dm-safedeal__btn--approve"
                              onClick={() => handleApprovePremiumPayment(n)}
                              disabled={premiumApproving}
                            >
                              {premiumApproving ? 'Подтверждаем...' : '✅ Подтвердить PREMIUM (30 дней)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Последние уведомления */}
              <div className="dm-safedeal__section">
                <h3>Последние уведомления</h3>
                {notifications.length === 0 ? (
                  <p className="dm-safedeal__empty">Нет уведомлений</p>
                ) : (
                  <div className="dm-safedeal__notif-list">
                    {notifications.filter(n => n.type !== 'premium_payment').slice(0, 5).map(n => (
                      <div 
                        key={n.id} 
                        className={`dm-safedeal__notif ${!n.is_read ? 'dm-safedeal__notif--unread' : ''}`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className="dm-safedeal__notif-icon">
                          {n.type === 'payment' ? '💰' : n.type === 'new_order' ? '📦' : n.type === 'dispute' ? '⚠️' : '🔔'}
                        </div>
                        <div className="dm-safedeal__notif-content">
                          <div className="dm-safedeal__notif-title">{n.title}</div>
                          <div className="dm-safedeal__notif-message">{n.message}</div>
                        </div>
                        <div className="dm-safedeal__notif-time">{fmtDate(n.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ЗАКАЗЫ */}
          {tab === 'orders' && (
            <div className="dm-safedeal__orders">
              <div className="dm-safedeal__filter">
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                  <option value="all">Все</option>
                  <option value="pending_payment">⏳ Ожидают подтверждения</option>
                  <option value="pending">Ожидают оплаты</option>
                  <option value="paid">Оплачены</option>
                  <option value="in_progress">В работе</option>
                  <option value="delivered">Доставлены</option>
                  <option value="approved">Завершены</option>
                  <option value="dispute">Споры</option>
                  <option value="cancelled">Отменены</option>
                </select>
                <button onClick={loadData}>↻ Обновить</button>
              </div>

              {orders.length === 0 ? (
                <p className="dm-safedeal__empty">Нет заказов</p>
              ) : (
                <div className="dm-safedeal__table">
                  <div className="dm-safedeal__table-header">
                    <div>Заказ</div>
                    <div>Клиент → Автор</div>
                    <div>Сумма</div>
                    <div>Статус</div>
                    <div>Дата</div>
                    <div>Действия</div>
                  </div>
                  {orders.map(order => (
                    <div key={order.id} className="dm-safedeal__table-row">
                      <div className="dm-safedeal__order-id">
                        #{order.order_number || order.id.slice(0, 8)}
                        <span className="dm-safedeal__order-service">{order.service?.title || 'Услуга'}</span>
                      </div>
                      <div className="dm-safedeal__order-users">
                        <span>{order.client?.display_name || order.client?.username || '—'}</span>
                        <span className="dm-safedeal__arrow">→</span>
                        <span>{order.author?.display_name || order.author?.username || '—'}</span>
                      </div>
                      <div className="dm-safedeal__order-amount">
                        <div>{fmtMoney(order.price)}</div>
                        <div className="dm-safedeal__order-fee">-{fmtMoney(order.platform_fee)} комиссия</div>
                      </div>
                      <div>
                        <span 
                          className="dm-safedeal__status" 
                          style={{ background: getStatusColor(order.status) }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="dm-safedeal__order-date">{fmtDate(order.created_at)}</div>
                      <div className="dm-safedeal__order-actions">
                        {order.status === 'pending_payment' && (
                          <button onClick={() => handleStatusChange(order.id, 'paid')} className="dm-safedeal__btn--success">
                            ✓ Подтвердить оплату
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button onClick={() => handleStatusChange(order.id, 'approved')} className="dm-safedeal__btn--success">
                            ✓ Одобрить
                          </button>
                        )}
                        {['pending', 'pending_payment'].includes(order.status) && (
                          <button onClick={() => handleStatusChange(order.id, 'cancelled')} className="dm-safedeal__btn--danger">
                            ✕ Отменить
                          </button>
                        )}
                        {/* Спор - показываем причину и действия */}
                        {(order.status === 'dispute' || order.status === 'disputed') && (
                          <div className="dm-safedeal__dispute-block">
                            {order.dispute_reason && (
                              <div className="dm-safedeal__dispute-reason">
                                <strong>⚠️ Причина спора:</strong>
                                <p>{order.dispute_reason}</p>
                              </div>
                            )}
                            <div className="dm-safedeal__dispute-actions">
                              <button onClick={() => handleStatusChange(order.id, 'approved')} className="dm-safedeal__btn--success">
                                ✓ В пользу автора
                              </button>
                              <button onClick={() => handleStatusChange(order.id, 'refunded')} className="dm-safedeal__btn--primary">
                                ↩ Возврат клиенту
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Кнопка удаления (для всех статусов) */}
                        <button onClick={() => handleDeleteOrder(order.id)} className="dm-safedeal__btn--ghost" title="Удалить заказ">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ВЫПЛАТЫ - Система месячных выплат */}
          {tab === 'payouts' && (
            <div className="dm-safedeal__payouts">
              {/* Информация о системе */}
              <div className="dm-safedeal__payout-info">
                <div className="dm-safedeal__payout-info-icon">💰</div>
                <div className="dm-safedeal__payout-info-text">
                  <strong>Система месячных выплат</strong>
                  <p>Выберите месяц → проверьте суммы → переведите деньги вручную → нажмите «Отметить выплату»</p>
                </div>
              </div>

              {/* Выбор периода и действия */}
              <div className="dm-safedeal__payout-controls">
                <div className="dm-safedeal__period-select">
                  <label>📅 Период:</label>
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    {periods.map(p => (
                      <option key={p} value={p}>{formatPeriod(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="dm-safedeal__payout-actions">
                  <button onClick={loadData} className="dm-safedeal__btn--ghost">
                    ↻ Обновить
                  </button>
                  <button onClick={handleDownloadCSV} className="dm-safedeal__btn--primary">
                    📥 Скачать CSV
                  </button>
                </div>
              </div>

              {/* Итоги за период */}
              <div className="dm-safedeal__payout-summary">
                <div className="dm-safedeal__summary-card dm-safedeal__summary-card--highlight">
                  <div className="dm-safedeal__summary-icon">⏳</div>
                  <div className="dm-safedeal__summary-value dm-safedeal__summary-value--warning">
                    {fmtMoney(payoutData.totals?.total_to_pay || 0)}
                  </div>
                  <div className="dm-safedeal__summary-label">К выплате авторам</div>
                  <div className="dm-safedeal__summary-count">
                    {payoutData.totals?.pending_count || 0} авторов ожидают
                  </div>
                </div>
                <div className="dm-safedeal__summary-card">
                  <div className="dm-safedeal__summary-icon">✅</div>
                  <div className="dm-safedeal__summary-value dm-safedeal__summary-value--success">
                    {fmtMoney(payoutData.totals?.total_paid || 0)}
                  </div>
                  <div className="dm-safedeal__summary-label">Уже выплачено</div>
                  <div className="dm-safedeal__summary-count">
                    {payoutData.totals?.paid_count || 0} авторов
                  </div>
                </div>
                <div className="dm-safedeal__summary-card">
                  <div className="dm-safedeal__summary-icon">🏦</div>
                  <div className="dm-safedeal__summary-value">
                    {fmtMoney(payoutData.totals?.total_platform_fee || 0)}
                  </div>
                  <div className="dm-safedeal__summary-label">Комиссия платформы</div>
                  <div className="dm-safedeal__summary-count">20% с заказов</div>
                </div>
              </div>

              {/* Таблица авторов */}
              {payoutLoading ? (
                <Loader fullscreen={false} size="minimal" showText={false} />
              ) : payoutData.authors.length === 0 ? (
                <div className="dm-safedeal__empty-state">
                  <div className="dm-safedeal__empty-icon">💭</div>
                  <p>Нет завершённых заказов за {formatPeriod(selectedPeriod)}</p>
                </div>
              ) : (
                <div className="dm-safedeal__table dm-safedeal__table--payouts">
                  <div className="dm-safedeal__table-header dm-safedeal__table-header--payouts">
                    <div>Автор</div>
                    <div>Заказов</div>
                    <div>К выплате</div>
                    <div>Комиссия</div>
                    <div>Статус</div>
                    <div>Действие</div>
                  </div>
                  {payoutData.authors.map(a => (
                    <div key={a.author_id} className={`dm-safedeal__table-row dm-safedeal__table-row--payouts ${a.status === 'paid' ? 'dm-safedeal__table-row--paid' : ''}`}>
                      <div className="dm-safedeal__author">
                        {a.author?.avatar_url ? (
                          <img src={a.author.avatar_url} alt="" />
                        ) : (
                          <div className="dm-safedeal__author-placeholder">👤</div>
                        )}
                        <div className="dm-safedeal__author-info">
                          <span className="dm-safedeal__author-name">{a.author?.display_name || a.author?.username || '—'}</span>
                          {a.author?.username && a.author?.display_name && (
                            <span className="dm-safedeal__author-username">@{a.author.username}</span>
                          )}
                        </div>
                      </div>
                      <div className="dm-safedeal__orders-count">
                        <span className="dm-safedeal__orders-badge">{a.orders_count}</span>
                      </div>
                      <div className="dm-safedeal__payout-amount">
                        {fmtMoney(a.author_earnings)}
                      </div>
                      <div className="dm-safedeal__payout-fee">{fmtMoney(a.platform_fee)}</div>
                      <div className="dm-safedeal__payout-status">
                        <span 
                          className={`dm-safedeal__status-badge ${a.status === 'paid' ? 'dm-safedeal__status-badge--paid' : 'dm-safedeal__status-badge--pending'}`}
                        >
                          {a.status === 'paid' ? '✅ Выплачено' : '⏳ Не выплачено'}
                        </span>
                        {a.paid_at && (
                          <div className="dm-safedeal__paid-date">{fmtDate(a.paid_at)}</div>
                        )}
                      </div>
                      <div className="dm-safedeal__payout-action">
                        {a.status === 'pending' && a.orders_count > 0 ? (
                          <button 
                            onClick={() => handleMarkPaid(a.author_id, a.author?.display_name || a.author?.username, a.author_earnings)}
                            className="dm-safedeal__btn--success dm-safedeal__btn--mark-paid"
                          >
                            💸 Отметить как выплачено
                          </button>
                        ) : a.status === 'paid' ? (
                          <span className="dm-safedeal__action-done">Готово</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Предупреждение */}
              {payoutData.authors.some(a => a.status === 'pending' && a.orders_count > 0) && (
                <div className="dm-safedeal__payout-warning">
                  <span>⚠️</span>
                  <span>Нажимайте «Отметить как выплачено» только <strong>после</strong> реального перевода денег автору. Это действие нельзя отменить.</span>
                </div>
              )}
            </div>
          )}

          {/* УВЕДОМЛЕНИЯ */}
          {tab === 'notifications' && (
            <div className="dm-safedeal__notifications">
              {notifications.length === 0 ? (
                <p className="dm-safedeal__empty">Нет уведомлений</p>
              ) : (
                <div className="dm-safedeal__notif-list dm-safedeal__notif-list--full">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`dm-safedeal__notif ${!n.is_read ? 'dm-safedeal__notif--unread' : ''}`}
                      onClick={() => { markNotificationRead(n.id); loadData(); }}
                    >
                      <div className="dm-safedeal__notif-icon">
                        {n.type === 'premium_payment' ? '💳' : n.type === 'payment' ? '💰' : n.type === 'new_order' ? '📦' : n.type === 'dispute' ? '⚠️' : n.type === 'payout_request' ? '💸' : '🔔'}
                      </div>
                      <div className="dm-safedeal__notif-content">
                        <div className="dm-safedeal__notif-title">{n.title || n.type}</div>
                        <div className="dm-safedeal__notif-message">{n.message}</div>
                        {n.metadata && (
                          <div className="dm-safedeal__notif-meta">
                            {n.metadata.amount && <span>Сумма: {fmtMoney(n.metadata.amount)}</span>}
                          </div>
                        )}
                        <div className="dm-safedeal__notif-time">{fmtDate(n.created_at)}</div>

                        {n.type === 'premium_payment' && (
                          <div className="dm-safedeal__notif-actions" onClick={(e) => e.stopPropagation()}>
                            {n.metadata?.payment_screenshot && (
                              <button
                                type="button"
                                onClick={() => window.open(n.metadata.payment_screenshot, '_blank', 'noopener,noreferrer')}
                              >
                                Скрин
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleApprovePremiumPayment(n)}
                              disabled={premiumApproving}
                            >
                              {premiumApproving ? 'Подтверждаем...' : 'Подтвердить PREMIUM (30 дней)'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        .dm-safedeal { max-width: 1200px; }
        
        .dm-safedeal__tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: #f5f5f7;
          padding: 4px;
          border-radius: 10px;
        }
        .dm-safedeal__tabs button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          color: #86868b;
          transition: all 0.15s;
          position: relative;
        }
        .dm-safedeal__tabs button.active {
          background: #fff;
          color: #1d1d1f;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .dm-safedeal__badge {
          position: absolute;
          top: 4px;
          right: 8px;
          background: #ff3b30;
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
        .dm-safedeal__badge--premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .dm-safedeal__section--premium {
          background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%);
          border: 3px solid rgba(102,126,234,0.5);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(102,126,234,0.2);
        }
        .dm-safedeal__section--premium h3 {
          color: #667eea;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 700;
        }
        .dm-safedeal__notif--premium {
          background: #fff;
          border: 2px solid rgba(102,126,234,0.5);
          box-shadow: 0 2px 8px rgba(102,126,234,0.15);
        }
        .dm-safedeal__notif--premium.dm-safedeal__notif--unread {
          border-left: 4px solid #667eea;
          background: linear-gradient(90deg, rgba(102,126,234,0.05) 0%, #fff 20px);
        }
        .dm-safedeal__btn--approve {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: #fff !important;
          font-weight: 600;
        }
        .dm-safedeal__btn--approve:hover {
          opacity: 0.9;
        }
        
        /* Яркий алерт для ожидающих PREMIUM */
        .dm-safedeal__premium-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          padding: 16px 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          animation: pulse-premium 2s infinite;
        }
        @keyframes pulse-premium {
          0%, 100% { box-shadow: 0 0 0 0 rgba(102,126,234,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(102,126,234,0); }
        }
        .dm-safedeal__premium-alert-icon {
          font-size: 32px;
        }
        .dm-safedeal__premium-alert-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dm-safedeal__premium-alert-text strong {
          font-size: 16px;
        }
        .dm-safedeal__premium-alert-text span {
          font-size: 13px;
          opacity: 0.9;
        }
        .dm-safedeal__premium-alert-btn {
          background: rgba(255,255,255,0.2) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
          padding: 10px 20px !important;
          border-radius: 8px !important;
          font-weight: 600;
          cursor: pointer;
        }
        .dm-safedeal__premium-alert-btn:hover {
          background: rgba(255,255,255,0.3) !important;
        }
        
        .dm-safedeal__stat--premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
        .dm-safedeal__stat--premium .dm-safedeal__stat-value {
          color: #fff !important;
        }
        .dm-safedeal__stat--premium .dm-safedeal__stat-label {
          color: rgba(255,255,255,0.9);
        }

        .dm-safedeal__loading, .dm-safedeal__empty {
          padding: 40px;
          text-align: center;
          color: #86868b;
        }

        .dm-safedeal__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .dm-safedeal__stat {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-safedeal__stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1d1d1f;
        }
        .dm-safedeal__stat--warning .dm-safedeal__stat-value { color: #ff9500; }
        .dm-safedeal__stat--success .dm-safedeal__stat-value { color: #30d158; }
        .dm-safedeal__stat--danger .dm-safedeal__stat-value { color: #ff3b30; }
        .dm-safedeal__stat--accent .dm-safedeal__stat-value { color: #007aff; }
        .dm-safedeal__stat-label {
          font-size: 13px;
          color: #86868b;
          margin-top: 4px;
        }

        .dm-safedeal__section {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-safedeal__section h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
        }

        .dm-safedeal__filter {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .dm-safedeal__filter select {
          padding: 10px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 14px;
        }
        .dm-safedeal__filter button {
          padding: 10px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }

        .dm-safedeal__table {
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .dm-safedeal__table-header {
          display: grid;
          grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1.5fr;
          gap: 12px;
          padding: 12px 16px;
          background: #f5f5f7;
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
        }
        .dm-safedeal__table-row {
          display: grid;
          grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1.5fr;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          align-items: center;
        }
        .dm-safedeal__table-row:last-child { border-bottom: none; }

        .dm-safedeal__order-id {
          font-weight: 600;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dm-safedeal__order-service {
          font-size: 12px;
          color: #86868b;
          font-weight: 400;
        }
        .dm-safedeal__order-users {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .dm-safedeal__arrow { color: #86868b; }
        .dm-safedeal__order-amount {
          font-weight: 600;
        }
        .dm-safedeal__order-fee {
          font-size: 11px;
          color: #86868b;
          font-weight: 400;
        }
        .dm-safedeal__order-date {
          font-size: 12px;
          color: #86868b;
        }
        .dm-safedeal__order-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .dm-safedeal__status {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .dm-safedeal__author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dm-safedeal__author img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .dm-safedeal__balance-pending {
          font-weight: 700;
          color: #ff9500;
        }
        .dm-safedeal__balance-available {
          font-weight: 700;
          color: #30d158;
        }
        .dm-safedeal__payout-amount {
          font-weight: 700;
        }

        .dm-safedeal__btn--success {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #30d158;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-safedeal__btn--danger {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #ff3b30;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-safedeal__btn--warning {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #ff9500;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-safedeal__btn--primary {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #007aff;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-safedeal__btn--ghost {
          padding: 6px 8px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #86868b;
          font-size: 14px;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.15s;
        }
        .dm-safedeal__btn--ghost:hover {
          opacity: 1;
          background: #ffebee;
          color: #ff3b30;
        }

        .dm-safedeal__dispute-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .dm-safedeal__dispute-reason {
          background: #fff3e0;
          border: 1px solid #ffcc80;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
        }
        .dm-safedeal__dispute-reason strong {
          display: block;
          color: #e65100;
          margin-bottom: 4px;
        }
        .dm-safedeal__dispute-reason p {
          margin: 0;
          color: #333;
          line-height: 1.4;
        }
        .dm-safedeal__dispute-actions {
          display: flex;
          gap: 8px;
        }

        .dm-safedeal__notif-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dm-safedeal__notif {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dm-safedeal__notif:hover { background: #f0f0f0; }
        .dm-safedeal__notif--unread {
          background: #e3f2fd;
          border-left: 3px solid #007aff;
        }
        .dm-safedeal__notif-icon { font-size: 20px; }
        .dm-safedeal__notif-content { flex: 1; }
        .dm-safedeal__notif-title { font-weight: 600; font-size: 14px; }
        .dm-safedeal__notif-message { font-size: 13px; color: #666; margin-top: 2px; }
        .dm-safedeal__notif-meta { font-size: 12px; color: #007aff; margin-top: 4px; }
        .dm-safedeal__notif-time { font-size: 11px; color: #86868b; white-space: nowrap; }

        /* Система выплат */
        .dm-safedeal__payout-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .dm-safedeal__payout-info-icon {
          font-size: 32px;
        }
        .dm-safedeal__payout-info-text strong {
          display: block;
          font-size: 15px;
          color: #1d1d1f;
          margin-bottom: 4px;
        }
        .dm-safedeal__payout-info-text p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .dm-safedeal__payout-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-safedeal__period-select {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dm-safedeal__period-select label {
          font-weight: 500;
          color: #1d1d1f;
        }
        .dm-safedeal__period-select select {
          padding: 10px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 14px;
          min-width: 180px;
          background: #fff;
        }
        .dm-safedeal__payout-actions {
          display: flex;
          gap: 8px;
        }

        .dm-safedeal__payout-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .dm-safedeal__summary-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(0,0,0,0.06);
          position: relative;
        }
        .dm-safedeal__summary-card--highlight {
          border: 2px solid #ff9500;
          background: linear-gradient(180deg, #fffbf5 0%, #fff 100%);
        }
        .dm-safedeal__summary-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .dm-safedeal__summary-value {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
        }
        .dm-safedeal__summary-value--warning { color: #ff9500; }
        .dm-safedeal__summary-value--success { color: #30d158; }
        .dm-safedeal__summary-label {
          font-size: 13px;
          color: #86868b;
          margin-top: 4px;
        }
        .dm-safedeal__summary-count {
          font-size: 11px;
          color: #86868b;
          margin-top: 6px;
        }

        .dm-safedeal__empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-safedeal__empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .dm-safedeal__empty-state p {
          color: #86868b;
          font-size: 14px;
        }

        .dm-safedeal__table--payouts .dm-safedeal__table-header--payouts,
        .dm-safedeal__table--payouts .dm-safedeal__table-row--payouts {
          grid-template-columns: 2fr 0.8fr 1.2fr 1fr 1.4fr 1.8fr;
        }
        .dm-safedeal__table-row--paid {
          background: #f9fff9;
        }
        .dm-safedeal__author-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .dm-safedeal__author-info {
          display: flex;
          flex-direction: column;
        }
        .dm-safedeal__author-name {
          font-weight: 500;
        }
        .dm-safedeal__author-username {
          font-size: 11px;
          color: #86868b;
        }
        .dm-safedeal__orders-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .dm-safedeal__payout-amount {
          font-weight: 700;
          font-size: 15px;
        }
        .dm-safedeal__payout-fee {
          color: #86868b;
          font-size: 13px;
        }
        .dm-safedeal__status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .dm-safedeal__status-badge--pending {
          background: #fff3e0;
          color: #e65100;
        }
        .dm-safedeal__status-badge--paid {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .dm-safedeal__paid-date {
          font-size: 11px;
          color: #86868b;
          margin-top: 4px;
        }
        .dm-safedeal__btn--mark-paid {
          padding: 8px 14px;
          font-size: 13px;
        }
        .dm-safedeal__action-done {
          color: #30d158;
          font-weight: 500;
          font-size: 13px;
        }

        .dm-safedeal__payout-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 16px;
          background: #fff3e0;
          border: 1px solid #ffcc80;
          border-radius: 8px;
          font-size: 13px;
          color: #e65100;
        }
        .dm-safedeal__payout-warning strong {
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .dm-safedeal__stats { grid-template-columns: repeat(2, 1fr); }
          .dm-safedeal__payout-summary { grid-template-columns: 1fr; }
          .dm-safedeal__table-header,
          .dm-safedeal__table-row { grid-template-columns: 1fr 1fr 1fr; }
          .dm-safedeal__payout-controls { flex-direction: column; gap: 12px; }
          .dm-safedeal__payout-info { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}

