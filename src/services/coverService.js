// src/services/coverService.js
// Сервис для работы с обложками профиля

const WORKER_URL = 'https://stickers-manifest.natopchane.workers.dev';
const R2_BASE_URL = 'https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev';

/**
 * Получить список бесплатных обложек из R2 (динамически через worker API)
 */
export async function getFreeCoversList() {
  try {
    const response = await fetch(`${WORKER_URL}/api/covers?type=free`);
    if (response.ok) {
      const data = await response.json();
      return data.items?.map(item => item.url) || [];
    }
    // Fallback на статический список если worker не работает
    return getFallbackFreeCovers();
  } catch (error) {
    console.error('Error loading free covers from API:', error);
    return getFallbackFreeCovers();
  }
}

/**
 * Получить список премиум видео-обложек из R2 (динамически через worker API)
 */
export async function getPremiumCoversList() {
  try {
    const response = await fetch(`${WORKER_URL}/api/covers?type=premium`);
    if (response.ok) {
      const data = await response.json();
      return data.items?.map(item => item.url) || [];
    }
    // Fallback на статический список
    return getFallbackPremiumCovers();
  } catch (error) {
    console.error('Error loading premium covers from API:', error);
    return getFallbackPremiumCovers();
  }
}

// Fallback списки на случай если worker не работает
function getFallbackFreeCovers() {
  const covers = [];
  // Загружаем все файлы e (1).jpg - e (100).jpg
  for (let i = 1; i <= 100; i++) {
    covers.push(`${R2_BASE_URL}/free/e%20(${i}).jpg`);
  }
  // Также добавляем png версии
  for (let i = 1; i <= 10; i++) {
    covers.push(`${R2_BASE_URL}/free/e%20(${i}).png`);
  }
  return covers;
}

function getFallbackPremiumCovers() {
  return [
    `${R2_BASE_URL}/premium/DREAM-MACHINE-AI-2025-12-16-233424.mp4`,
    `${R2_BASE_URL}/premium/DREAM-MACHINE-AI-2025-12-16-234457.mp4`,
  ];
}

/**
 * Загрузить локальный файл как обложку
 * @param {File} file - файл изображения
 * @returns {string} - data URL для превью
 */
export function readLocalCoverFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Загрузить обложку услуги в R2
 * @param {File} file - файл изображения
 * @param {string} userId - ID пользователя
 * @param {string|null} oldUrl - URL старой обложки для удаления
 * @returns {Promise<string>} - публичный URL загруженной обложки
 */
export async function uploadServiceCover(file, userId, oldUrl = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  if (oldUrl) {
    formData.append('oldUrl', oldUrl);
  }

  const response = await fetch(`${WORKER_URL}/api/covers/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Ошибка загрузки обложки');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Удалить обложку из R2
 * @param {string} url - URL обложки для удаления
 */
export async function deleteServiceCover(url) {
  if (!url || !url.includes('/user/')) return;
  
  try {
    await fetch(`${WORKER_URL}/api/covers/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  } catch (error) {
    console.error('Error deleting cover:', error);
  }
}

/**
 * Загрузить изображение услуги в R2
 * @param {File} file - файл изображения
 * @param {string} userId - ID пользователя
 * @returns {Promise<string>} - публичный URL загруженного изображения
 */
export async function uploadServiceImage(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await fetch(`${WORKER_URL}/api/covers/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Ошибка загрузки изображения');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Загрузить скриншот оплаты в R2
 * Сохраняется в папку payments/YYYY-MM-DD/
 * @param {File} file - файл скриншота
 * @param {string} oderId - ID заказа
 * @returns {Promise<string>} - публичный URL загруженного скриншота
 */
export async function uploadPaymentScreenshot(file, oderId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'payments');
  formData.append('orderId', oderId);

  const response = await fetch(`${WORKER_URL}/api/payments/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Ошибка загрузки скриншота');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Загрузить файл чата в R2
 * Сохраняется в папку chat-files/order-id/
 * @param {File} file - файл (изображение или PDF)
 * @param {string} orderId - ID заказа
 * @returns {Promise<{url: string, name: string, type: string, size: number}>}
 */
export async function uploadChatFile(file, orderId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'chat-files');
  formData.append('orderId', orderId);

  const response = await fetch(`${WORKER_URL}/api/chat/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Ошибка загрузки файла');
  }

  const data = await response.json();
  return {
    url: data.url,
    name: file.name,
    type: file.type,
    size: file.size
  };
}

/**
 * Удалить все файлы чата заказа из R2
 * Вызывается при закрытии заказа (approved, cancelled, refunded)
 * @param {string} orderId - ID заказа
 */
export async function deleteChatFiles(orderId) {
  try {
    await fetch(`${WORKER_URL}/api/chat/delete-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
  } catch (error) {
    console.error('Error deleting chat files:', error);
  }
}

/**
 * Загрузить изображение материала коллаба в R2
 * @param {string} userId - ID пользователя
 * @param {string} collabId - ID коллаба
 * @param {File} file - файл изображения
 * @returns {Promise<string>} - публичный URL
 */
export async function uploadCollabMaterialImage(userId, collabId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'collab-materials');
  formData.append('userId', userId);
  formData.append('collabId', collabId);

  const response = await fetch(`${WORKER_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Ошибка загрузки изображения');
  }

  const data = await response.json();
  return data.url;
}