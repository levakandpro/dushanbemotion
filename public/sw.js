// Service Worker для D MOTION PWA
// Базовое кэширование shell-части приложения

const CACHE_NAME = 'dmotion-v1';
const SHELL_CACHE_NAME = 'dmotion-shell-v1';

// Файлы shell-части (статичные ресурсы для начальной загрузки)
const SHELL_FILES = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/site.webmanifest',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching shell files');
      return cache.addAll(SHELL_FILES).catch((err) => {
        console.warn('[SW] Failed to cache some shell files:', err);
      });
    })
  );
  
  // Принудительно активировать новый SW
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кэши
          if (cacheName !== SHELL_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Взять контроль над всеми клиентами немедленно
  return self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем не-GET запросы и внешние домены
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  // Пропускаем динамические API запросы
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/r2-proxy/') ||
    url.pathname.includes('/r2-people/') ||
    request.headers.get('accept')?.includes('application/json')
  ) {
    return; // Не кэшируем API запросы
  }
  
  // Для shell-файлов используем кэш-первый стратегию
  if (SHELL_FILES.some(file => url.pathname === file || url.pathname === '/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          // Кэшируем только успешные ответы
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Для остальных статических ресурсов - network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кэшируем только успешные ответы для статических ресурсов
        if (response.status === 200 && request.destination !== 'document') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся получить из кэша
        return caches.match(request);
      })
  );
});

