// src/admin/screens/SubscriptionsScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchRecentSubscriptions, fetchAdminNotifications } from '../api/adminApi';
import { supabase } from '../../lib/supabaseClient';
import Loader from '../../components/ui/Loader';

export default function SubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPaymentHistory, setUserPaymentHistory] = useState([]);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadSubs();
  }, []);

  // Поиск с debounce
  useEffect(() => {
    if (search.length >= 2 || search.length === 0) {
      const timer = setTimeout(() => loadSubs(), 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  async function loadSubs() {
    setLoading(true);
    try {
      const data = await fetchRecentSubscriptions(200, search);
      setSubs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Загрузить историю оплат пользователя
  async function loadUserPaymentHistory(userId) {
    try {
      // Ищем уведомления об оплате и подтверждении для этого пользователя
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .or(`user_id.eq.${userId},metadata->>user_id.eq.${userId}`)
        .in('type', ['premium_payment', 'premium_approved'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUserPaymentHistory(data || []);
    } catch (e) {
      console.error('Error loading payment history:', e);
      setUserPaymentHistory([]);
    }
  }

  // Открыть детали пользователя
  async function openUserDetails(sub) {
    setSelectedUser(sub);
    await loadUserPaymentHistory(sub.id);
  }

  // Отменить подписку
  async function cancelSubscription() {
    if (!selectedUser) return;
    if (!window.confirm(`Отменить подписку пользователю ${selectedUser.user}?`)) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase.rpc('activate_premium', {
        p_user_id: selectedUser.id,
        p_plan_id: 'free',
        p_days: 0
      });
      
      if (error) {
        // Fallback: прямое обновление
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ current_plan: 'free', plan_expires_at: null })
          .eq('id', selectedUser.id);
        
        if (updateError) throw updateError;
      }
      
      alert('✅ Подписка отменена');
      setSelectedUser(null);
      loadSubs();
    } catch (e) {
      alert('Ошибка: ' + (e?.message || 'Не удалось отменить'));
    } finally {
      setCancelling(false);
    }
  }

  const filtered = subs.filter(s => {
    if (filter === 'active') return s.status === 'active';
    if (filter === 'lifetime') return s.status === 'lifetime';
    if (filter === 'expired') return s.status === 'expired';
    if (filter === 'free') return s.status === 'free';
    return true;
  });

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';

  return (
    <div className="dm-subs">
      <div className="dm-subs__header">
        <div className="dm-subs__filters">
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'lifetime', label: 'Lifetime' },
            { key: 'expired', label: 'Истёкшие' },
            { key: 'free', label: 'Free' },
          ].map(f => (
            <button
              key={f.key}
              className={`dm-subs__filter ${filter === f.key ? 'dm-subs__filter--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="dm-subs__count">{filtered.length}</span>
      </div>

      <div className="dm-subs__search">
        <input
          type="text"
          placeholder="Поиск по имени (мин. 2 буквы)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')}>✕</button>}
      </div>

      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : (
        <div className="dm-subs__table">
          <div className="dm-subs__row dm-subs__row--head">
            <div className="dm-subs__cell">Пользователь</div>
            <div className="dm-subs__cell">Тариф</div>
            <div className="dm-subs__cell">Статус</div>
            <div className="dm-subs__cell">Истекает</div>
          </div>
          {filtered.length === 0 ? (
            <div className="dm-subs__empty">
              {search ? 'Ничего не найдено' : 'Нет подписок'}
            </div>
          ) : (
            filtered.map((s, i) => (
              <div 
                key={s.id || i} 
                className={`dm-subs__row dm-subs__row--clickable ${s.isNew ? 'dm-subs__row--new' : ''}`}
                onClick={() => openUserDetails(s)}
              >
                <div className="dm-subs__cell dm-subs__cell--user">
                  {s.user}
                  {s.isNew && <span className="dm-subs__new-badge">NEW</span>}
                </div>
                <div className="dm-subs__cell">
                  <span className={`dm-subs__plan dm-subs__plan--${s.plan.toLowerCase().replace('+', 'plus')}`}>
                    {s.plan}
                  </span>
                </div>
                <div className="dm-subs__cell">
                  <span className={`dm-subs__status dm-subs__status--${s.status}`}>
                    {s.status === 'active' && '● Активна'}
                    {s.status === 'lifetime' && '★ Навсегда'}
                    {s.status === 'expired' && '○ Истекла'}
                    {s.status === 'free' && '○ Free'}
                  </span>
                </div>
                <div className="dm-subs__cell">
                  {s.isLifetime ? '∞' : fmt(s.expiresAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Модальное окно с деталями подписки */}
      {selectedUser && (
        <>
          <div className="dm-subs__modal-overlay" onClick={() => setSelectedUser(null)} />
          <div className="dm-subs__modal">
            <div className="dm-subs__modal-header">
              <h3>👤 {selectedUser.user}</h3>
              <button className="dm-subs__modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            
            <div className="dm-subs__modal-content">
              <div className="dm-subs__modal-info">
                <div className="dm-subs__modal-row">
                  <span className="dm-subs__modal-label">Тариф:</span>
                  <span className={`dm-subs__plan dm-subs__plan--${selectedUser.plan.toLowerCase().replace('+', 'plus')}`}>
                    {selectedUser.plan}
                  </span>
                </div>
                <div className="dm-subs__modal-row">
                  <span className="dm-subs__modal-label">Статус:</span>
                  <span className={`dm-subs__status dm-subs__status--${selectedUser.status}`}>
                    {selectedUser.status === 'active' && '● Активна'}
                    {selectedUser.status === 'lifetime' && '★ Навсегда'}
                    {selectedUser.status === 'expired' && '○ Истекла'}
                    {selectedUser.status === 'free' && '○ Free'}
                  </span>
                </div>
                <div className="dm-subs__modal-row">
                  <span className="dm-subs__modal-label">Действует до:</span>
                  <span>{selectedUser.isLifetime ? '∞ Навсегда' : fmt(selectedUser.expiresAt)}</span>
                </div>
                <div className="dm-subs__modal-row">
                  <span className="dm-subs__modal-label">ID:</span>
                  <span style={{ fontSize: 11, color: '#86868b' }}>{selectedUser.id}</span>
                </div>
              </div>

              {/* История оплат */}
              <div className="dm-subs__modal-history">
                <h4>📜 История оплат</h4>
                {userPaymentHistory.length === 0 ? (
                  <p className="dm-subs__modal-empty">Нет записей об оплатах</p>
                ) : (
                  <div className="dm-subs__modal-history-list">
                    {userPaymentHistory.map(h => (
                      <div key={h.id} className={`dm-subs__modal-history-item dm-subs__modal-history-item--${h.type}`}>
                        <div className="dm-subs__modal-history-icon">
                          {h.type === 'premium_payment' ? '💳' : '✅'}
                        </div>
                        <div className="dm-subs__modal-history-content">
                          <div className="dm-subs__modal-history-title">{h.title}</div>
                          <div className="dm-subs__modal-history-message">{h.message}</div>
                          <div className="dm-subs__modal-history-date">
                            {new Date(h.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        {h.metadata?.payment_screenshot && (
                          <button
                            className="dm-subs__modal-history-screenshot"
                            onClick={() => window.open(h.metadata.payment_screenshot, '_blank')}
                          >
                            📷 Скрин
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Действия */}
              {(selectedUser.status === 'active' || selectedUser.status === 'lifetime') && (
                <div className="dm-subs__modal-actions">
                  <button
                    className="dm-subs__modal-btn dm-subs__modal-btn--danger"
                    onClick={cancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Отменяем...' : '❌ Отменить подписку'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .dm-subs { max-width: 900px; }
        .dm-subs__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .dm-subs__filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .dm-subs__filter {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          font-size: 13px;
          cursor: pointer;
        }
        .dm-subs__filter--active {
          background: #007aff;
          color: #fff;
          border-color: #007aff;
        }
        .dm-subs__count { font-size: 13px; color: #86868b; }
        
        .dm-subs__search {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .dm-subs__search input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 14px;
        }
        .dm-subs__search input:focus {
          outline: none;
          border-color: #007aff;
        }
        .dm-subs__search button {
          padding: 10px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }
        
        .dm-subs__loading {
          padding: 40px;
          text-align: center;
          color: #86868b;
        }
        
        .dm-subs__table {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-subs__row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
        }
        .dm-subs__row:hover:not(.dm-subs__row--head) {
          background: #f9f9fb;
        }
        .dm-subs__row--head {
          background: #f5f5f7;
          font-size: 11px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
        }
        .dm-subs__row--new {
          background: linear-gradient(90deg, rgba(52,199,89,0.08) 0%, transparent 50%);
        }
        .dm-subs__cell { display: flex; align-items: center; gap: 8px; }
        .dm-subs__cell--user { font-weight: 500; }
        
        .dm-subs__new-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #34c759;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        
        .dm-subs__plan {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .dm-subs__plan--free { background: #f5f5f7; color: #86868b; }
        .dm-subs__plan--premium { background: #e8f5e9; color: #2e7d32; }
        .dm-subs__plan--premiumplus { background: #fff3e0; color: #e65100; }
        .dm-subs__status { font-size: 13px; }
        .dm-subs__status--active { color: #34c759; }
        .dm-subs__status--lifetime { color: #ff9500; }
        .dm-subs__status--expired { color: #ff3b30; }
        .dm-subs__status--free { color: #86868b; }
        .dm-subs__empty { padding: 40px; text-align: center; color: #86868b; }
        
        .dm-subs__row--clickable { cursor: pointer; }
        
        /* Модальное окно */
        .dm-subs__modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
        }
        .dm-subs__modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1001;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .dm-subs__modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .dm-subs__modal-header h3 { margin: 0; font-size: 18px; }
        .dm-subs__modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #86868b;
        }
        .dm-subs__modal-content { padding: 20px; }
        .dm-subs__modal-info {
          background: #f5f5f7;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .dm-subs__modal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dm-subs__modal-row:last-child { border-bottom: none; }
        .dm-subs__modal-label { color: #86868b; font-size: 13px; }
        
        .dm-subs__modal-history { margin-bottom: 20px; }
        .dm-subs__modal-history h4 { margin: 0 0 12px; font-size: 14px; }
        .dm-subs__modal-empty { color: #86868b; font-size: 13px; text-align: center; padding: 20px; }
        .dm-subs__modal-history-list { display: flex; flex-direction: column; gap: 8px; }
        .dm-subs__modal-history-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9f9fb;
          border-radius: 8px;
          align-items: flex-start;
        }
        .dm-subs__modal-history-item--premium_payment {
          background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
          border: 1px solid rgba(102,126,234,0.2);
        }
        .dm-subs__modal-history-item--premium_approved {
          background: linear-gradient(135deg, rgba(52,199,89,0.1) 0%, rgba(48,209,88,0.1) 100%);
          border: 1px solid rgba(52,199,89,0.2);
        }
        .dm-subs__modal-history-icon { font-size: 20px; }
        .dm-subs__modal-history-content { flex: 1; }
        .dm-subs__modal-history-title { font-weight: 500; font-size: 13px; }
        .dm-subs__modal-history-message { font-size: 12px; color: #86868b; margin-top: 2px; }
        .dm-subs__modal-history-date { font-size: 11px; color: #86868b; margin-top: 4px; }
        .dm-subs__modal-history-screenshot {
          padding: 6px 12px;
          background: #007aff;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .dm-subs__modal-history-screenshot:hover { background: #0056b3; }
        
        .dm-subs__modal-actions {
          padding-top: 16px;
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .dm-subs__modal-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .dm-subs__modal-btn--danger {
          background: #ff3b30;
          color: #fff;
        }
        .dm-subs__modal-btn--danger:hover { background: #d32f2f; }
        .dm-subs__modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
