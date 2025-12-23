// src/admin/screens/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchAdminDashboard, fetchRecentSubscriptions, fetchSafeDealStats, fetchAdminNotifications } from '../api/adminApi';
import { useAdmin } from '../store/adminStore';
import Loader from '../../components/ui/Loader';

export default function DashboardScreen() {
  const { setScreen } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [safeDealStats, setSafeDealStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dashboardStats, subs, sdStats, notifs] = await Promise.all([
        fetchAdminDashboard(),
        fetchRecentSubscriptions(5),
        fetchSafeDealStats(),
        fetchAdminNotifications({ limit: 5, unreadOnly: true }),
      ]);
      setStats(dashboardStats);
      setSubscriptions(subs);
      setSafeDealStats(sdStats);
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader />;
  }

  const fmt = (n) => (n || 0).toLocaleString('ru-RU');
  const fmtMoney = (n) => `${fmt(n)} с`;

  return (
    <div className="dm-dash">
      {/* Safe Deal — если есть уведомления */}
      {notifications.length > 0 && (
        <div className="dm-dash__alert" onClick={() => setScreen('safedeal')}>
          <span className="dm-dash__alert-icon">🔔</span>
          <span>{notifications.length} новых уведомлений Safe Deal</span>
          <span className="dm-dash__alert-arrow">→</span>
        </div>
      )}

      {/* Статистика Safe Deal */}
      {safeDealStats && safeDealStats.totalOrders > 0 && (
        <div className="dm-dash__safedeal" onClick={() => setScreen('safedeal')}>
          <div className="dm-dash__safedeal-header">
            <span>🔐 Safe Deal</span>
            <span className="dm-dash__safedeal-link">Открыть →</span>
          </div>
          <div className="dm-dash__safedeal-stats">
            <div>
              <span className="dm-dash__safedeal-value">{fmt(safeDealStats.pendingOrders)}</span>
              <span className="dm-dash__safedeal-label">В процессе</span>
            </div>
            <div>
              <span className="dm-dash__safedeal-value dm-dash__safedeal-value--success">{fmt(safeDealStats.completedOrders)}</span>
              <span className="dm-dash__safedeal-label">Завершено</span>
            </div>
            <div>
              <span className="dm-dash__safedeal-value dm-dash__safedeal-value--accent">{fmtMoney(safeDealStats.totalEarnings)}</span>
              <span className="dm-dash__safedeal-label">Заработано</span>
            </div>
            {safeDealStats.disputes > 0 && (
              <div>
                <span className="dm-dash__safedeal-value dm-dash__safedeal-value--danger">{fmt(safeDealStats.disputes)}</span>
                <span className="dm-dash__safedeal-label">Споры</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Основная статистика */}
      <div className="dm-dash__grid">
        <Stat label="Пользователи" value={fmt(stats?.users)} onClick={() => setScreen('users')} />
        <Stat label="Услуги" value={fmt(stats?.services)} onClick={() => setScreen('safedeal')} />
        <Stat label="Заказы" value={fmt(stats?.orders)} onClick={() => setScreen('safedeal')} accent />
        <Stat label="Premium" value={fmt(stats?.activeSubscriptions)} onClick={() => setScreen('subscriptions')} accent />
        <Stat label="Работы" value={fmt(stats?.works)} />
        <Stat label="Коллекции" value={fmt(stats?.collections)} />
        <Stat label="Коллабы" value={fmt(stats?.collabs)} />
        <Stat label="Bazar" value={fmt(stats?.bazarItems)} />
      </div>

      {/* Недавние подписки */}
      {subscriptions.length > 0 && (
        <div className="dm-dash__section">
          <div className="dm-dash__section-title">Недавние подписки</div>
          <div className="dm-dash__list">
            {subscriptions.map((s, i) => (
              <div key={s.id || i} className="dm-dash__list-item">
                <span className="dm-dash__list-user">{s.user}</span>
                <span className="dm-dash__list-plan">{s.plan}</span>
                <span className={`dm-dash__list-status dm-dash__list-status--${s.status}`}>
                  {s.status === 'active' ? '●' : s.status === 'lifetime' ? '★' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Действия */}
      <div className="dm-dash__actions">
        <button onClick={loadData}>↻ Обновить</button>
        <button onClick={() => setScreen('safedeal')} className="dm-dash__actions-primary">🔐 Safe Deal</button>
        <button onClick={() => setScreen('users')}>Пользователи</button>
        <button onClick={() => setScreen('settings')}>Настройки</button>
      </div>

      <style>{`
        .dm-dash { max-width: 900px; }
        
        .dm-dash__alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          color: #fff;
          border-radius: 12px;
          margin-bottom: 16px;
          cursor: pointer;
          font-weight: 500;
        }
        .dm-dash__alert-icon { font-size: 18px; }
        .dm-dash__alert-arrow { margin-left: auto; opacity: 0.7; }
        
        .dm-dash__safedeal {
          background: #fff;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(0,0,0,0.06);
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-dash__safedeal:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .dm-dash__safedeal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .dm-dash__safedeal-link { font-size: 13px; color: #007aff; font-weight: 500; }
        .dm-dash__safedeal-stats {
          display: flex;
          gap: 24px;
        }
        .dm-dash__safedeal-stats > div { text-align: center; }
        .dm-dash__safedeal-value { display: block; font-size: 24px; font-weight: 700; }
        .dm-dash__safedeal-value--success { color: #30d158; }
        .dm-dash__safedeal-value--accent { color: #007aff; }
        .dm-dash__safedeal-value--danger { color: #ff3b30; }
        .dm-dash__safedeal-label { font-size: 11px; color: #86868b; }
        
        .dm-dash__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .dm-stat {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-stat:hover { 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .dm-stat__value {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }
        .dm-stat--accent .dm-stat__value { color: #007aff; }
        .dm-stat__label {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
          font-weight: 500;
        }
        .dm-dash__section {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-dash__section-title {
          font-size: 13px;
          font-weight: 600;
          color: #86868b;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .dm-dash__list { display: flex; flex-direction: column; gap: 8px; }
        .dm-dash__list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dm-dash__list-item:last-child { border-bottom: none; }
        .dm-dash__list-user { flex: 1; font-size: 14px; font-weight: 500; }
        .dm-dash__list-plan { 
          font-size: 12px; 
          color: #86868b;
          background: #f5f5f7;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .dm-dash__list-status { font-size: 10px; }
        .dm-dash__list-status--active { color: #34c759; }
        .dm-dash__list-status--lifetime { color: #ff9500; }
        .dm-dash__list-status--expired { color: #ff3b30; }
        .dm-dash__list-status--free { color: #86868b; }
        .dm-dash__actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dm-dash__actions button {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-dash__actions button:hover {
          background: #f5f5f7;
        }
        .dm-dash__actions-primary {
          background: #007aff !important;
          color: #fff !important;
          border-color: #007aff !important;
        }
        .dm-dash__actions-primary:hover {
          background: #0066d6 !important;
        }
        @media (max-width: 800px) {
          .dm-dash__grid { grid-template-columns: repeat(2, 1fr); }
          .dm-dash__safedeal-stats { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, onClick, accent }) {
  return (
    <div className={`dm-stat ${accent ? 'dm-stat--accent' : ''}`} onClick={onClick}>
      <div className="dm-stat__value">{value}</div>
      <div className="dm-stat__label">{label}</div>
    </div>
  );
}
