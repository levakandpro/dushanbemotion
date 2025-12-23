// src/hooks/usePushNotifications.js
// Хук для Web Push уведомлений

import { useState, useEffect, useCallback } from 'react';

// Проверяем поддержку
const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw-push.js');
      setRegistration(reg);
      console.log('✅ Push Service Worker registered');
    } catch (error) {
      console.error('❌ SW registration failed:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Показать локальное уведомление (для браузера)
  const showNotification = useCallback((title, options = {}) => {
    if (!isSupported || permission !== 'granted') return;
    
    // Проверяем что страница не в фокусе
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return; // Не показываем если пользователь на странице
    }

    try {
      if (registration) {
        registration.showNotification(title, {
          body: options.body || '',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100],
          tag: options.tag || 'default',
          renotify: true,
          data: options.data || {},
          ...options
        });
      } else {
        // Fallback на обычный Notification
        new Notification(title, {
          body: options.body || '',
          icon: '/logo192.png',
          tag: options.tag || 'default',
          ...options
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission, registration]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isGranted: permission === 'granted'
  };
}

export default usePushNotifications;

