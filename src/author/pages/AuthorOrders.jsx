import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import { getAuthorOrders } from "../../services/orderService";
import Loader from "../../components/ui/Loader";
import "../components/author-ui.css";
import "./AuthorOrders.css";

export default function AuthorOrders() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    if (user) {
      console.log('[AuthorOrders] Current user:', user.id, user.email);
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('[AuthorOrders] Loading orders for author:', user.id);
      const data = await getAuthorOrders(user.id);
      console.log('[AuthorOrders] Loaded orders:', data);
      setOrders(data);
    } catch (error) {
      console.error("[AuthorOrders] Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '—';

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает',
      pending_payment: 'Проверка оплаты',
      paid: 'Оплачен',
      in_progress: 'В работе',
      delivered: 'Сдан',
      approved: 'Завершён',
      cancelled: 'Отменён',
      disputed: 'Спор',
      refunded: 'Возврат'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9500',
      pending_payment: '#ff9500',
      paid: '#007aff',
      in_progress: '#5856d6',
      delivered: '#34c759',
      approved: '#30d158',
      cancelled: '#ff3b30',
      disputed: '#ff2d55',
      refunded: '#6c757d'
    };
    return colors[status] || '#86868b';
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending_payment', 'paid', 'in_progress', 'delivered'].includes(o.status);
    if (filter === 'completed') return ['approved', 'cancelled', 'refunded'].includes(o.status);
    return true;
  });

  const activeCount = orders.filter(o => ['pending_payment', 'paid', 'in_progress', 'delivered'].includes(o.status)).length;

  return (
    <div className="au-orders">
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Мои заказы</h1>
          <p className="au-pageSub">Входящие заказы от клиентов</p>
        </div>
        {activeCount > 0 && (
          <div className="au-orders__badge">{activeCount} активных</div>
        )}
      </div>

      {/* Фильтры */}
      <div className="au-orders__filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          Все ({orders.length})
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Активные ({activeCount})
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Завершённые
        </button>
      </div>

      {/* Список заказов */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : filteredOrders.length === 0 ? (
        <div className="au-card au-card__in au-orders__empty">
          <div className="au-orders__empty-icon">📦</div>
          <p>Нет заказов</p>
          <span>Когда клиенты закажут ваши услуги, они появятся здесь</span>
        </div>
      ) : (
        <div className="au-orders__list">
          {filteredOrders.map(order => (
            <Link 
              key={order.id} 
              to={`/order/${order.id}`}
              className="au-orders__card"
            >
              <div className="au-orders__card-main">
                <div className="au-orders__card-title">
                  {order.service?.emoji} {order.service?.title || 'Услуга'}
                </div>
                <div className="au-orders__card-client">
                  {order.client?.avatar_url && (
                    <img src={order.client.avatar_url} alt="" className="au-orders__card-avatar" />
                  )}
                  <span>Клиент: {order.client?.display_name || order.client?.username || '—'}</span>
                </div>
                {order.client_message && (
                  <div className="au-orders__card-message">
                    "{order.client_message.slice(0, 80)}{order.client_message.length > 80 ? '...' : ''}"
                  </div>
                )}
              </div>
              <div className="au-orders__card-side">
                <div className="au-orders__card-price">
                  <span className="au-orders__card-earnings">+{fmtMoney(order.author_earnings)}</span>
                  <small>ваш доход</small>
                </div>
                <span 
                  className="au-orders__card-status"
                  style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </span>
                <div className="au-orders__card-date">{fmtDate(order.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Инфо-блок */}
      <div className="au-card au-card__in au-orders__info">
        <div className="au-badge">Как это работает</div>
        <div className="au-orders__info-list">
          <div className="au-orders__info-item">
            <span>1️⃣</span>
            <span>Клиент оплачивает → Вы получаете уведомление</span>
          </div>
          <div className="au-orders__info-item">
            <span>2️⃣</span>
            <span>Нажмите "Начать работу" → Чат с клиентом открывается</span>
          </div>
          <div className="au-orders__info-item">
            <span>3️⃣</span>
            <span>Выполните заказ → Нажмите "Сдать работу"</span>
          </div>
          <div className="au-orders__info-item">
            <span>4️⃣</span>
            <span>Клиент принимает → Деньги на вашем балансе</span>
          </div>
        </div>
      </div>
    </div>
  );
}

