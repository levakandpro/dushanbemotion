// src/admin/layout/AdminLayout.jsx
import React, { useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { useAdmin } from '../store/adminStore';
import { ADMIN_SCREENS } from '../config/adminRoutes';
import { useAdminNotifications } from '../hooks/useAdminNotifications';

import DashboardScreen from '../screens/DashboardScreen';
import SafeDealScreen from '../screens/SafeDealScreen';
import UsersScreen from '../screens/UsersScreen';
import PlansScreen from '../screens/PlansScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import AssetsScreen from '../screens/AssetsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import MediaBazarScreen from '../screens/MediaBazarScreen';
import DictionariesScreen from '../screens/DictionariesScreen';
import SettingsScreen from '../screens/SettingsScreen';

function renderScreen(key) {
  switch (key) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'safedeal':
      return <SafeDealScreen />;
    case 'users':
      return <UsersScreen />;
    case 'plans':
      return <PlansScreen />;
    case 'subscriptions':
      return <SubscriptionsScreen />;
    case 'projects':
      return <ProjectsScreen />;
    case 'assets':
      return <AssetsScreen />;
    case 'templates':
      return <TemplatesScreen />;
    case 'mediaBazar':
      return <MediaBazarScreen />;
    case 'dictionaries':
      return <DictionariesScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
}

export default function AdminLayout() {
  const { currentScreen, setScreen } = useAdmin();
  const { 
    notifications, 
    unreadCount, 
    dismissNotification, 
    clearAll,
    requestPermission 
  } = useAdminNotifications();

  // Запросить разрешение на уведомления при загрузке
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const active = ADMIN_SCREENS.find((s) => s.key === currentScreen);

  return (
    <div className="dm-admin-root">
      <AdminSidebar />
      <div className="dm-admin-main">
        <AdminTopbar 
          title={active ? active.label : 'Админка'} 
          notifications={notifications}
          unreadCount={unreadCount}
          onDismissNotification={dismissNotification}
          onClearAll={clearAll}
          onOpenSafeDeal={() => {
            setScreen('safedeal')
            // Устанавливаем флаг для открытия вкладки уведомлений
            window.__openSafeDealNotifications = true
          }}
        />
        <main className="dm-admin-content">
          {renderScreen(currentScreen)}
        </main>
      </div>
    </div>
  );
}
