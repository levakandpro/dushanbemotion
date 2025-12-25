import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Loader from './components/ui/Loader'
import { lockOrientationToLandscape, isPWAInstalled } from './utils/pwa'

import './styles/global.css'
import './styles/app.css'

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Проверяем обновления SW в фоне
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker available. Refresh to update.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });
}

// Фиксация ориентации для установленного PWA
if (isPWAInstalled()) {
  // Фиксируем ориентацию при загрузке
  lockOrientationToLandscape();
  
  // Также фиксируем при изменении ориентации (на случай если разблокировалась)
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      lockOrientationToLandscape();
    }, 100);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Loader />}>
      <App />
    </Suspense>
  </React.StrictMode>
)
