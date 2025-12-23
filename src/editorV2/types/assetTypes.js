// src/editorV2/types/assetTypes.js

/**
 * Единый интерфейс для всех типов ассетов (стикеры, фоны, рамки, звуки и т.п.)
 * @typedef {Object} Asset
 * @property {string} assetId - Уникальный идентификатор ассета (может быть основан на пути)
 * @property {'sticker' | 'frame' | 'background' | 'audio' | 'video' | 'font' | 'template'} type - Тип ассета
 * @property {string} url - URL ассета
 * @property {string} [previewUrl] - URL превью изображения
 * @property {number} [width] - Ширина в пикселях
 * @property {number} [height] - Высота в пикселях
 * @property {string} [category] - Категория (например: male/sport)
 * @property {string[]} [tags] - Теги для поиска
 * @property {boolean} [isPremium] - Премиум ассет
 * @property {string} [fileName] - Имя файла
 * @property {string} [key] - Ключ/путь в хранилище (для стикеров из R2)
 * @property {string} [name] - Отображаемое имя
 * @property {string} [description] - Описание
 */

/**
 * Фильтры для поиска ассетов
 * @typedef {Object} AssetFilters
 * @property {string} [category] - Фильтр по категории
 * @property {string[]} [tags] - Фильтр по тегам
 * @property {'male' | 'female'} [sex] - Фильтр по полу (для стикеров)
 * @property {boolean | 'all'} [isPremium] - Фильтр по премиум статусу
 */

/**
 * Параметры поиска ассетов
 * @typedef {Object} AssetSearchParams
 * @property {string} [query] - Поисковый запрос
 * @property {AssetFilters} [filters] - Фильтры
 * @property {number} [page] - Номер страницы для пагинации
 * @property {number} [perPage] - Количество элементов на странице
 */

/**
 * Результат поиска ассетов
 * @typedef {Object} AssetSearchResult
 * @property {Asset[]} assets - Найденные ассеты
 * @property {number} total - Общее количество
 * @property {number} page - Текущая страница
 * @property {number} perPage - Элементов на странице
 * @property {number} [nextPage] - Номер следующей страницы или null
 */

/**
 * Адаптер для преобразования различных форматов в единый Asset
 * @param {Object} data - Исходные данные
 * @param {'sticker' | 'frame' | 'background' | 'audio' | 'video'} type - Тип ассета
 * @param {string} [baseUrl] - Базовый URL для построения полных путей
 * @returns {Asset}
 */
export function adaptToAsset(data, type, baseUrl = '') {
  const asset = {
    assetId: data.assetId || data.id || data.key || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    url: data.url || (baseUrl && data.key ? `${baseUrl}/${data.key}` : data.srcUrl || data.videoUrlHd || ''),
    previewUrl: data.previewUrl || data.preview || data.image || '',
    width: data.width || data.imageWidth || undefined,
    height: data.height || data.imageHeight || undefined,
    category: data.category || undefined,
    tags: data.tags || [],
    isPremium: data.isPremium || false,
    fileName: data.fileName || data.name || undefined,
    key: data.key || undefined,
    name: data.name || data.label || undefined,
    description: data.description || undefined
  }

  // Удаляем undefined поля
  return Object.fromEntries(
    Object.entries(asset).filter(([_, value]) => value !== undefined)
  )
}

/**
 * Адаптер для стикеров из манифеста
 * @param {Object} stickerData - Данные стикера из манифеста
 * @param {string} baseUrl - Базовый URL
 * @param {string} category - Категория
 * @param {boolean} [isPremium] - Премиум статус
 * @returns {Asset}
 */
export function adaptStickerToAsset(stickerData, baseUrl, category, isPremium = false) {
  return adaptToAsset({
    ...stickerData,
    category,
    isPremium: isPremium || category === 'premium',
    url: `${baseUrl}/${stickerData.key}`,
    previewUrl: `${baseUrl}/${stickerData.key}`
  }, 'sticker', baseUrl)
}

/**
 * Адаптер для рамок из Pixabay
 * @param {Object} frameData - Данные рамки из Pixabay API
 * @returns {Asset}
 */
export function adaptFrameToAsset(frameData) {
  return adaptToAsset({
    ...frameData,
    url: frameData.srcUrl,
    previewUrl: frameData.previewUrl
  }, 'frame')
}

/**
 * Адаптер для футажей из Pexels
 * @param {Object} footageData - Данные футажа из Pexels API
 * @returns {Asset}
 */
export function adaptFootageToAsset(footageData) {
  return adaptToAsset({
    ...footageData,
    url: footageData.videoUrlHd || footageData.videoUrlFull,
    previewUrl: footageData.previewUrl,
    duration: footageData.duration
  }, 'video')
}

