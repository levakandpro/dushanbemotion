// Утилиты для работы с PWA

/**
 * Определяет, запущено ли приложение как установленное PWA
 */
export function isPWAInstalled() {
  // Проверка через display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Проверка через navigator.standalone (iOS)
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Дополнительная проверка для Chrome на Android
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
}

/**
 * Фиксирует ориентацию экрана в landscape (только для установленного PWA)
 */
export function lockOrientationToLandscape() {
  if (!isPWAInstalled()) {
    return; // Не фиксируем ориентацию в обычном браузере
  }
  
  // Проверка поддержки Screen Orientation API
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape')
      .then(() => {
        console.log('[PWA] Orientation locked to landscape');
      })
      .catch((err) => {
        console.warn('[PWA] Failed to lock orientation:', err);
        // На некоторых устройствах/браузерах lock может не работать
        // Это нормально, manifest.json все равно укажет предпочтительную ориентацию
      });
  } else if (screen.lockOrientation) {
    // Старый API для совместимости
    screen.lockOrientation('landscape');
  }
}

/**
 * Разблокирует ориентацию экрана
 */
export function unlockOrientation() {
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  } else if (screen.unlockOrientation) {
    screen.unlockOrientation();
  }
}

