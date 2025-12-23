// src/admin/layout/AdminTopbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminTopbar({ 
  title, 
  notifications = [], 
  unreadCount = 0, 
  onDismissNotification,
  onClearAll,
  onOpenSafeDeal
}) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <header className="dm-admin-topbar">
      <div className="dm-admin-topbar__title-group">
        <h1 className="dm-admin-topbar__title">{title}</h1>
      </div>

      <div className="dm-admin-topbar__right">
        {/* Колокольчик уведомлений */}
        <div className="dm-admin-notif-wrapper">
          <button 
            className={`dm-admin-notif-btn ${unreadCount > 0 ? 'dm-admin-notif-btn--active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="dm-admin-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Панель уведомлений */}
          {showNotifications && (
            <>
              <div 
                className="dm-admin-notif-overlay" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="dm-admin-notif-panel">
                <div className="dm-admin-notif-header">
                  <span>Уведомления</span>
                  {notifications.length > 0 && (
                    <button onClick={onClearAll}>Очистить все</button>
                  )}
                </div>
                
                <div className="dm-admin-notif-list">
                  {notifications.length === 0 ? (
                    <div className="dm-admin-notif-empty">
                      <span>🔕</span>
                      <p>Нет новых уведомлений</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`dm-admin-notif-item dm-admin-notif-item--${notif.type}`}
                      >
                        <div className="dm-admin-notif-icon">{notif.icon}</div>
                        <div className="dm-admin-notif-content">
                          <div className="dm-admin-notif-title">{notif.title}</div>
                          <div className="dm-admin-notif-message">{notif.message}</div>
                          <div className="dm-admin-notif-time">{formatTime(notif.timestamp)}</div>

                          {notif.type === 'premium_payment' && typeof onOpenSafeDeal === 'function' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowNotifications(false)
                                onOpenSafeDeal()
                              }}
                              style={{ marginTop: 8, alignSelf: 'flex-start' }}
                            >
                              Открыть SafeDeal
                            </button>
                          )}
                        </div>
                        <button 
                          className="dm-admin-notif-dismiss"
                          onClick={() => onDismissNotification(notif.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          className="dm-admin-topbar__btn"
          onClick={() => navigate('/bazar')}
        >
          🛒 BAZAR
        </button>
        <button 
          className="dm-admin-topbar__btn dm-admin-topbar__btn--primary"
          onClick={() => navigate('/editor')}
        >
          🎬 РЕДАКТОР
        </button>
      </div>
    </header>
  );
}
