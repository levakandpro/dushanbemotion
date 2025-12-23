// src/admin/layout/AdminSidebar.jsx
import React from 'react';
import { useAdmin } from '../store/adminStore';
import { ADMIN_SCREENS } from '../config/adminRoutes';

export default function AdminSidebar() {
  const { currentScreen, setScreen } = useAdmin();

  return (
    <aside className="dm-admin-sidebar">
      <div className="dm-admin-sidebar__logo">
        <div className="dm-admin-logo-mark">DM</div>
        <div className="dm-admin-logo-text">
          <span className="dm-admin-logo-title">DMOTION</span>
          <span className="dm-admin-logo-sub">Admin</span>
        </div>
      </div>

      <nav className="dm-admin-nav">
        {ADMIN_SCREENS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={
              'dm-admin-nav-item' +
              (item.key === currentScreen ? ' dm-admin-nav-item--active' : '')
            }
            onClick={() => setScreen(item.key)}
          >
            <span className="dm-admin-nav-item__icon">{item.icon}</span>
            <span className="dm-admin-nav-item__label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="dm-admin-sidebar__footer">
        <div className="dm-admin-sidebar__hint">
          Панель управления тарифами, пользователями и контентом.
        </div>
      </div>
    </aside>
  );
}
