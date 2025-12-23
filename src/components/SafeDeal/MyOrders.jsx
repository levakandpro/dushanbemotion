// src/components/SafeDeal/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserOrders } from '../../services/safeDealService';
import { useAuth } from '../../lib/useAuth';
import Loader from '../ui/Loader';
import './MyOrders.css';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, client, author
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [user, filter]);

  async function loadOrders() {
    if (!user) return;
    setLoading(true);
    const data = await getUserOrders(user.id, filter);
    setOrders(data);
    setLoading(false);
  }

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '—';

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

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['pending', 'paid', 'in_progress', 'delivered'].includes(o.status);
    if (statusFilter === 'completed') return o.status === 'completed';
    if (statusFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const stats = {
    total: orders.length,
    active: orders.filter(o => ['pending', 'paid', 'in_progress', 'delivered'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    asClient: orders.filter(o => o.client_id === user?.id).length,
    asAuthor: orders.filter(o => o.author_id === user?.id).length,
  };

  return (
    <div className="my-orders">
      <div className="my-orders__header">
        <h1>Мои заказы</h1>
        <p>Safe Deal — безопасные сделки</p>
      </div>

      {/* Статистика */}
      <div className="my-orders__stats">
        <div className="my-orders__stat">
          <span className="my-orders__stat-value">{stats.total}</span>
          <span className="my-orders__stat-label">Всего</span>
        </div>
        <div className="my-orders__stat my-orders__stat--active">
          <span className="my-orders__stat-value">{stats.active}</span>
          <span className="my-orders__stat-label">Активных</span>
        </div>
        <div className="my-orders__stat my-orders__stat--success">
          <span className="my-orders__stat-value">{stats.completed}</span>
          <span className="my-orders__stat-label">Завершено</span>
        </div>
        <div className="my-orders__stat">
          <span className="my-orders__stat-value">{stats.asClient}</span>
          <span className="my-orders__stat-label">Как клиент</span>
        </div>
        <div className="my-orders__stat">
          <span className="my-orders__stat-value">{stats.asAuthor}</span>
          <span className="my-orders__stat-label">Как автор</span>
        </div>
      </div>

      {/* Фильтры */}
      <div className="my-orders__filters">
        <div className="my-orders__filter-group">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={filter === 'client' ? 'active' : ''}
            onClick={() => setFilter('client')}
          >
            Мои покупки
          </button>
          <button 
            className={filter === 'author' ? 'active' : ''}
            onClick={() => setFilter('author')}
          >
            Мои продажи
          </button>
        </div>
        <div className="my-orders__filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="completed">Завершённые</option>
            <option value="cancelled">Отменённые</option>
          </select>
        </div>
      </div>

      {/* Список заказов */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : filteredOrders.length === 0 ? (
        <div className="my-orders__empty">
          <span>📦</span>
          <p>Нет заказов</p>
          <small>Здесь будут отображаться ваши заказы через Safe Deal</small>
        </div>
      ) : (
        <div className="my-orders__list">
          {filteredOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const isClient = order.client_id === user?.id;
            const otherParty = isClient ? order.author : order.client;
            
            return (
              <Link 
                key={order.id} 
                to={`/order/${order.id}`}
                className="my-orders__item"
              >
                <div className="my-orders__item-left">
                  {order.service?.cover_url && (
                    <img src={order.service.cover_url} alt="" className="my-orders__item-cover" />
                  )}
                  <div className="my-orders__item-info">
                    <h3>{order.service?.title || 'Услуга'}</h3>
                    <div className="my-orders__item-meta">
                      <span className={`my-orders__item-role ${isClient ? 'my-orders__item-role--client' : 'my-orders__item-role--author'}`}>
                        {isClient ? 'Вы заказчик' : 'Вы исполнитель'}
                      </span>
                      <span className="my-orders__item-party">
                        {isClient ? '→' : '←'} {otherParty?.display_name || otherParty?.username || 'Пользователь'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="my-orders__item-right">
                  <div className="my-orders__item-price">
                    {isClient ? fmtMoney(order.price) : fmtMoney(order.author_earnings)}
                    {!isClient && <small>ваш доход</small>}
                  </div>
                  <div className="my-orders__item-status" style={{ background: statusInfo.color }}>
                    {statusInfo.icon} {statusInfo.label}
                  </div>
                  <div className="my-orders__item-date">{fmtDate(order.created_at)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

