// src/editorV2/store/assetsStore.js

import { adaptToAsset, adaptStickerToAsset, adaptFrameToAsset, adaptFootageToAsset } from '../types/assetTypes'

/**
 * Единый store для управления ассетами (стикеры, фоны, рамки, звуки)
 * Кэширует результаты в памяти до перезагрузки страницы
 */
class AssetsStore {
  constructor() {
    // Кэш ассетов по типу и категории
    this.cache = new Map()
    
    // Флаги загрузки
    this.loading = new Map()
    
    // URL для манифестов
    this.manifestUrls = {
      stickers: import.meta.env.VITE_STICKERS_MANIFEST_URL || 
        'https://stickers-manifest.natopchane.workers.dev/stickers/manifest',
      frames: import.meta.env.VITE_FRAMES_API_URL || 
        'https://stickers-manifest.natopchane.workers.dev/api/frames/search',
      footage: import.meta.env.VITE_FOOTAGE_API_URL || 
        'https://stickers-manifest.natopchane.workers.dev/api/footage/search',
      backgrounds: null, // Пока не реализовано
      audio: null // Пока не реализовано
    }
  }

  /**
   * Загружает ассеты определенного типа
   * @param {'sticker' | 'frame' | 'background' | 'audio' | 'video'} type
   * @param {string} [category] - Категория (опционально)
   * @returns {Promise<Asset[]>}
   */
  async loadAssets(type, category = null) {
    const cacheKey = `${type}:${category || 'all'}`
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // Проверяем, не идет ли уже загрузка
    if (this.loading.has(cacheKey)) {
      // Ждем завершения текущей загрузки
      return this.loading.get(cacheKey)
    }

    // Начинаем загрузку
    const loadPromise = this._loadAssetsInternal(type, category)
    this.loading.set(cacheKey, loadPromise)

    try {
      const assets = await loadPromise
      this.cache.set(cacheKey, assets)
      return assets
    } finally {
      this.loading.delete(cacheKey)
    }
  }

  /**
   * Внутренний метод загрузки ассетов
   * @private
   */
  async _loadAssetsInternal(type, category) {
    switch (type) {
      case 'sticker':
        return await this._loadStickers(category)
      case 'frame':
        return await this._loadFrames(category)
      case 'video':
        return await this._loadFootage(category)
      default:
        console.warn(`AssetsStore: Unknown asset type: ${type}`)
        return []
    }
  }

  /**
   * Загружает стикеры из манифеста
   * @private
   */
  async _loadStickers(category) {
    try {
      const url = this.manifestUrls.stickers
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to load stickers manifest: ${response.status}`)
      }

      const manifest = await response.json()
      const baseUrl = manifest.baseUrl || ''
      const assets = []

      // Проходим по всем категориям
      const genders = manifest.genders || {}
      for (const genderKey of Object.keys(genders)) {
        const gender = genders[genderKey]
        const categories = gender.categories || {}
        
        for (const catId of Object.keys(categories)) {
          // Если указана категория, пропускаем остальные
          if (category && catId !== category) continue
          
          const cat = categories[catId]
          const stickers = cat.stickers || []
          
          // Определяем, является ли категория премиум
          const isPremiumCategory = catId === 'premium' || cat.label?.toLowerCase().includes('premium')
          
          for (const sticker of stickers) {
            const asset = adaptStickerToAsset(sticker, baseUrl, catId, isPremiumCategory)
            asset.tags = [genderKey, catId, ...(asset.tags || [])]
            assets.push(asset)
          }
        }
      }

      return assets
    } catch (error) {
      console.error('AssetsStore._loadStickers: Error loading stickers', error)
      return []
    }
  }

  /**
   * Загружает рамки из Pixabay API
   * @private
   */
  async _loadFrames(category) {
    try {
      const query = category || 'photo frame transparent background'
      const url = `${this.manifestUrls.frames}?query=${encodeURIComponent(query)}&per_page=50`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to load frames: ${response.status}`)
      }

      const data = await response.json()
      const frames = data.frames || []
      
      return frames.map(frame => adaptFrameToAsset(frame))
    } catch (error) {
      console.error('AssetsStore._loadFrames: Error loading frames', error)
      return []
    }
  }

  /**
   * Загружает футажи из Pixabay API
   * @private
   */
  async _loadFootage(category) {
    try {
      const apiKey = import.meta.env.VITE_PIXABAY_API_KEY
      
      if (!apiKey) {
        console.error('❌ VITE_PIXABAY_API_KEY is not defined!')
        return []
      }
      
      const query = category || 'popular'
      const url = new URL('https://pixabay.com/api/videos/')
      url.searchParams.set('key', apiKey)
      url.searchParams.set('q', query)
      url.searchParams.set('per_page', '24')
      url.searchParams.set('safesearch', 'true')
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Failed to load footage from Pixabay: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.hits || !Array.isArray(data.hits)) {
        console.error('Invalid Pixabay response:', data)
        return []
      }
      
      // Адаптируем формат Pixabay к нашему формату
      const videos = data.hits.map(hit => {
        let videoUrlHd = null
        let videoUrlFull = null
        
        if (hit.videos) {
          const videoFiles = hit.videos
          const qualities = [
            { key: 'large', url: videoFiles.large?.url },
            { key: 'medium', url: videoFiles.medium?.url },
            { key: 'small', url: videoFiles.small?.url },
            { key: 'tiny', url: videoFiles.tiny?.url }
          ].filter(q => q.url)
          
          if (qualities.length > 0) {
            videoUrlFull = qualities[0].url
            videoUrlHd = qualities.find(q => q.key === 'medium')?.url || qualities[0].url
          }
        }
        
        // Получаем превью изображение
        // Pixabay API для видео возвращает thumbnail внутри каждого объекта videos
        let previewUrl = ''
        
        // Варианты получения превью (в порядке приоритета)
        // ВАЖНО: используем только изображения, НЕ видео файлы!
        
        // 1. Проверяем thumbnail внутри videos (приоритет: medium > large > small > tiny)
        if (hit.videos) {
          if (hit.videos.medium?.thumbnail) {
            previewUrl = hit.videos.medium.thumbnail
          } else if (hit.videos.large?.thumbnail) {
            previewUrl = hit.videos.large.thumbnail
          } else if (hit.videos.small?.thumbnail) {
            previewUrl = hit.videos.small.thumbnail
          } else if (hit.videos.tiny?.thumbnail) {
            previewUrl = hit.videos.tiny.thumbnail
          }
        }
        // 2. Проверяем picture_id (старый формат)
        else if (hit.picture_id) {
          previewUrl = `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg`
        } 
        // 3. Проверяем поле pictures
        else if (hit.pictures) {
          if (hit.pictures.medium) {
            previewUrl = hit.pictures.medium
          } else if (hit.pictures.small) {
            previewUrl = hit.pictures.small
          } else if (hit.pictures.large) {
            previewUrl = hit.pictures.large
          } else if (hit.pictures.tiny) {
            previewUrl = hit.pictures.tiny
          }
        }
        // 4. Проверяем thumbnail на верхнем уровне
        else if (hit.thumbnail) {
          const thumb = String(hit.thumbnail)
          if (!thumb.endsWith('.mp4') && !thumb.endsWith('.webm') && !thumb.includes('video')) {
            previewUrl = hit.thumbnail
          }
        }
        // 5. Проверяем другие возможные поля
        else if (hit.image) {
          previewUrl = hit.image
        } else if (hit.preview) {
          previewUrl = hit.preview
        }
        
        return {
          id: hit.id,
          previewUrl: previewUrl,
          videoUrlHd: videoUrlHd,
          videoUrlFull: videoUrlFull,
          duration: hit.duration || 0,
          width: hit.width || 1920,
          height: hit.height || 1080,
        }
      })
      
      return videos.map(video => adaptFootageToAsset(video))
    } catch (error) {
      console.error('AssetsStore._loadFootage: Error loading footage', error)
      return []
    }
  }

  /**
   * Поиск ассетов с фильтрами
   * @param {'sticker' | 'frame' | 'background' | 'audio' | 'video'} type
   * @param {string} [query] - Поисковый запрос
   * @param {Object} [filters] - Фильтры
   * @param {string} [filters.category] - Категория
   * @param {string[]} [filters.tags] - Теги
   * @param {'male' | 'female'} [filters.sex] - Пол (для стикеров)
   * @param {boolean | 'all'} [filters.isPremium] - Премиум статус
   * @returns {Promise<Asset[]>}
   */
  async searchAssets(type, query = '', filters = {}) {
    // Загружаем все ассеты типа (или из кэша)
    const allAssets = await this.loadAssets(type, filters.category)

    let filtered = [...allAssets]

    // Фильтр по поисковому запросу
    if (query) {
      const queryLower = query.toLowerCase()
      filtered = filtered.filter(asset => {
        const searchableText = [
          asset.name,
          asset.fileName,
          asset.category,
          ...(asset.tags || [])
        ].filter(Boolean).join(' ').toLowerCase()
        
        return searchableText.includes(queryLower)
      })
    }

    // Фильтр по тегам
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(asset => {
        const assetTags = asset.tags || []
        return filters.tags.some(tag => assetTags.includes(tag))
      })
    }

    // Фильтр по полу (для стикеров)
    if (filters.sex && type === 'sticker') {
      filtered = filtered.filter(asset => {
        const assetTags = asset.tags || []
        return assetTags.includes(filters.sex)
      })
    }

    // Фильтр по премиум статусу
    if (filters.isPremium !== undefined && filters.isPremium !== 'all') {
      filtered = filtered.filter(asset => asset.isPremium === filters.isPremium)
    }

    return filtered
  }

  /**
   * Очищает кэш для определенного типа или всего кэша
   * @param {string} [type] - Тип ассета (если не указан, очищает весь кэш)
   */
  clearCache(type = null) {
    if (type) {
      // Удаляем все ключи, начинающиеся с типа
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}:`)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Получает ассет по ID
   * @param {string} assetId
   * @param {'sticker' | 'frame' | 'background' | 'audio' | 'video'} [type] - Тип для оптимизации поиска
   * @returns {Promise<Asset | null>}
   */
  async getAssetById(assetId, type = null) {
    if (type) {
      const assets = await this.loadAssets(type)
      return assets.find(a => a.assetId === assetId) || null
    }

    // Если тип не указан, ищем во всех типах
    const types = ['sticker', 'frame', 'video', 'background', 'audio']
    for (const t of types) {
      const assets = await this.loadAssets(t)
      const found = assets.find(a => a.assetId === assetId)
      if (found) return found
    }

    return null
  }
}

// Создаем singleton экземпляр
let assetsStoreInstance = null

/**
 * Получает экземпляр AssetsStore (singleton)
 * @returns {AssetsStore}
 */
export function getAssetsStore() {
  if (!assetsStoreInstance) {
    assetsStoreInstance = new AssetsStore()
  }
  return assetsStoreInstance
}

// Экспортируем также класс для тестирования
export { AssetsStore }

