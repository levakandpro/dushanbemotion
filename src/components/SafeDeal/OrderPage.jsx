// src/components/SafeDeal/OrderPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus, markOrderPaid, recommendService, rateService } from '../../services/safeDealService';
import { useAuth } from '../../lib/useAuth';
import OrderChat from './OrderChat';
import Loader from '../ui/Loader';
import './OrderPage.css';

export default function OrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    const data = await getOrder(orderId);
    setOrder(data);
    setLoading(false);
  }

  const isClient = user?.id === order?.client_id;
  const isAuthor = user?.id === order?.author_id;

  async function handleAction(action) {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      if (action === 'pay') {
        await markOrderPaid(orderId, 'manual');
        await loadOrder();
      } else if (action === 'start') {
        await updateOrderStatus(orderId, 'in_progress', user.id);
        await loadOrder();
      } else if (action === 'deliver') {
        await updateOrderStatus(orderId, 'delivered', user.id);
        await loadOrder();
      } else if (action === 'complete') {
        await updateOrderStatus(orderId, 'completed', user.id);
        await loadOrder();
        setShowRating(true);
      } else if (action === 'cancel') {
        if (window.confirm('Вы уверены что хотите отменить заказ?')) {
          await updateOrderStatus(orderId, 'cancelled', user.id);
          await loadOrder();
        }
      } else if (action === 'dispute') {
        if (window.confirm('Открыть спор? Администратор рассмотрит ситуацию.')) {
          await updateOrderStatus(orderId, 'dispute', user.id);
          await loadOrder();
        }
      }
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRate() {
    try {
      await rateService(order.service_id, user.id, rating, comment);
      if (comment.trim()) {
        await recommendService(order.service_id, orderId, user.id, comment);
      }
      setShowRating(false);
      alert('Спасибо за отзыв!');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  }

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'Ожидает оплаты', color: '#ff9500', icon: '⏳' },
      paid: { label: 'Оплачен', color: '#007aff', icon: '💳' },
      in_progress: { label: 'В работе', color: '#5856d6', icon: '🔨' },
      delivered: { label: 'Доставлен', color: '#34c759', icon: '📦' },
      completed: { label: 'Завершён', color: '#30d158', icon: '✅' },
      cancelled: { label: 'Отменён', color: '#ff3b30', icon: '❌' },
      dispute: { label: 'Спор', color: '#ff2d55', icon: '⚠️' }
    };
    return statuses[status] || { label: status, color: '#86868b', icon: '?' };
  };

  if (loading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="order-page order-page--error">
        <h2>Заказ не найден</h2>
        <button onClick={() => navigate(-1)}>← Назад</button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="order-page">
      <div className="order-page__header">
        <button className="order-page__back" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <div className="order-page__title">
          <h1>Заказ #{order.id?.slice(0, 8)}</h1>
          <span className="order-page__status" style={{ background: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="order-page__content">
        <div className="order-page__main">
          {/* Информация о заказе */}
          <div className="order-page__card">
            <div className="order-page__service">
              {order.service?.cover_url && (
                <img src={order.service.cover_url} alt="" className="order-page__service-img" />
              )}
              <div className="order-page__service-info">
                <h3>{order.service?.title || 'Услуга'}</h3>
                <p>{order.service?.description?.slice(0, 100)}...</p>
              </div>
            </div>

            <div className="order-page__details">
              <div className="order-page__detail">
                <span>Стоимость</span>
                <strong>{fmtMoney(order.price)}</strong>
              </div>
              {isAuthor && (
                <div className="order-page__detail">
                  <span>Ваш заработок</span>
                  <strong className="order-page__earnings">{fmtMoney(order.author_earnings)}</strong>
                </div>
              )}
              <div className="order-page__detail">
                <span>Дата создания</span>
                <strong>{fmtDate(order.created_at)}</strong>
              </div>
              {order.delivery_days && (
                <div className="order-page__detail">
                  <span>Срок выполнения</span>
                  <strong>{order.delivery_days} дней</strong>
                </div>
              )}
            </div>

            {order.client_message && (
              <div className="order-page__message">
                <h4>Сообщение от клиента:</h4>
                <p>{order.client_message}</p>
              </div>
            )}
          </div>

          {/* Участники */}
          <div className="order-page__participants">
            <div className="order-page__participant">
              <div className="order-page__participant-label">Клиент</div>
              <div className="order-page__participant-info">
                {order.client?.avatar_url && (
                  <img src={order.client.avatar_url} alt="" />
                )}
                <span>{order.client?.display_name || order.client?.username || 'Клиент'}</span>
              </div>
            </div>
            <div className="order-page__arrow">→</div>
            <div className="order-page__participant">
              <div className="order-page__participant-label">Исполнитель</div>
              <div className="order-page__participant-info">
                {order.author?.avatar_url && (
                  <img src={order.author.avatar_url} alt="" />
                )}
                <span>{order.author?.display_name || order.author?.username || 'Автор'}</span>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="order-page__actions">
            {/* Действия клиента */}
            {isClient && (
              <>
                {order.status === 'pending' && (
                  <button className="order-page__btn order-page__btn--primary" onClick={() => handleAction('pay')} disabled={actionLoading}>
                    💳 Отметить как оплаченный
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button className="order-page__btn order-page__btn--success" onClick={() => handleAction('complete')} disabled={actionLoading}>
                    ✅ Принять работу
                  </button>
                )}
                {['paid', 'in_progress', 'delivered'].includes(order.status) && (
                  <button className="order-page__btn order-page__btn--warning" onClick={() => handleAction('dispute')} disabled={actionLoading}>
                    ⚠️ Открыть спор
                  </button>
                )}
              </>
            )}

            {/* Действия автора */}
            {isAuthor && (
              <>
                {order.status === 'paid' && (
                  <button className="order-page__btn order-page__btn--primary" onClick={() => handleAction('start')} disabled={actionLoading}>
                    🚀 Начать работу
                  </button>
                )}
                {order.status === 'in_progress' && (
                  <button className="order-page__btn order-page__btn--success" onClick={() => handleAction('deliver')} disabled={actionLoading}>
                    📦 Отправить результат
                  </button>
                )}
              </>
            )}

            {/* Общие действия */}
            {order.status === 'pending' && (
              <button className="order-page__btn order-page__btn--danger" onClick={() => handleAction('cancel')} disabled={actionLoading}>
                ❌ Отменить
              </button>
            )}
          </div>

          {/* Статус выполнения */}
          <div className="order-page__progress">
            <div className={`order-page__step ${['pending', 'paid', 'in_progress', 'delivered', 'completed'].includes(order.status) ? 'active' : ''}`}>
              <span className="order-page__step-dot">1</span>
              <span>Создан</span>
            </div>
            <div className={`order-page__step ${['paid', 'in_progress', 'delivered', 'completed'].includes(order.status) ? 'active' : ''}`}>
              <span className="order-page__step-dot">2</span>
              <span>Оплачен</span>
            </div>
            <div className={`order-page__step ${['in_progress', 'delivered', 'completed'].includes(order.status) ? 'active' : ''}`}>
              <span className="order-page__step-dot">3</span>
              <span>В работе</span>
            </div>
            <div className={`order-page__step ${['delivered', 'completed'].includes(order.status) ? 'active' : ''}`}>
              <span className="order-page__step-dot">4</span>
              <span>Доставлен</span>
            </div>
            <div className={`order-page__step ${order.status === 'completed' ? 'active' : ''}`}>
              <span className="order-page__step-dot">5</span>
              <span>Завершён</span>
            </div>
          </div>
        </div>

        {/* Чат */}
        <div className="order-page__chat">
          <OrderChat orderId={orderId} order={order} />
        </div>
      </div>

      {/* Модалка рейтинга */}
      {showRating && (
        <div className="order-page__modal-overlay" onClick={() => setShowRating(false)}>
          <div className="order-page__modal" onClick={e => e.stopPropagation()}>
            <h3>Оцените работу</h3>
            <div className="order-page__rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  className={`order-page__star ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Оставьте отзыв (необязательно)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="order-page__modal-hint">
              💡 Если оставите отзыв, он станет РЕКОМЕНДАЦИЕЙ для автора
            </div>
            <div className="order-page__modal-actions">
              <button onClick={handleRate}>Отправить</button>
              <button onClick={() => setShowRating(false)} className="secondary">Пропустить</button>
            </div>
          </div>
        </div>
      )}

      {/* Предупреждение Safe Deal */}
      <div className="order-page__safedeal-notice">
        <span>🔐</span>
        <div>
          <strong>Safe Deal</strong>
          <p>Деньги хранятся на платформе до завершения заказа. Передача контактов запрещена.</p>
        </div>
      </div>
    </div>
  );
}

