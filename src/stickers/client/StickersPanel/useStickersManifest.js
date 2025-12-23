// src/stickers/client/StickersPanel/useStickersManifest.js

import { useEffect, useState } from 'react';

const MANIFEST_URL =
  import.meta.env.VITE_STICKERS_MANIFEST_URL ||
  'https://stickers-manifest.natopchane.workers.dev/stickers/manifest';

const CACHE_KEY = 'dm_stickers_manifest';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export function useStickersManifest() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Проверяем кэш
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < CACHE_TTL) {
            console.log('Манифест загружен из кэша (возраст:', Math.round(age / 1000), 'сек)');
            setManifest(data);
            setLoading(false);
            // Загружаем свежую версию в фоне
            loadFresh();
            return;
          }
        }
      } catch (err) {
        console.warn('Ошибка чтения кэша:', err);
      }

      // Загружаем свежую версию
      await loadFresh();
    }

    async function loadFresh() {
      try {
        console.log('🎯 Загружаю манифест стикеров:', MANIFEST_URL);
        const startTime = performance.now();
        const res = await fetch(MANIFEST_URL, {
          cache: 'default', // Используем браузерный кэш
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        const loadTime = Math.round(performance.now() - startTime);
        console.log(`Манифест загружен за ${loadTime}мс:`, json);
        console.log('📦 baseUrl:', json.baseUrl);
        console.log('👨 Мужских категорий:', Object.keys(json.genders?.male?.categories || {}).length);
        console.log('👩 Женских категорий:', Object.keys(json.genders?.female?.categories || {}).length);
        
        // Сохраняем в кэш
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: json,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn('Ошибка сохранения кэша:', err);
        }
        
        setManifest(json);
      } catch (err) {
        console.error('❌ Manifest load error:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { manifest, loading };
}
