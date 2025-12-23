// src/editorV2/panels/FootagePanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import VideoSettingsPanel from './VideoSettingsPanel'
import Loader from '../../components/ui/Loader'

// Worker URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://stickers-manifest.natopchane.workers.dev'

// Названия категорий futaj на русском
const FUTAJ_CATEGORY_NAMES = {
  animals: 'Животные',
  architecture: 'Архитектура',
  bg: 'Фоны',
  cartoon: 'Мультфильмы',
  culture: 'Культура',
  flags: 'Флаги',
  food: 'Еда',
  histori: 'История',
  modern: 'Современное',
  nature: 'Природа',
  people: 'Люди',
  textures: 'Текстуры',
}

// Категории футажей
const FOOTAGE_CATEGORIES = [
  { id: 'popular', label: 'Популярное', query: 'popular' },
  { id: 'nature', label: 'Природа', query: 'nature landscape mountains' },
  { id: 'city', label: 'Город', query: 'city night street skyline' },
  { id: 'people', label: 'Люди', query: 'people portrait' },
  { id: 'abstract', label: 'Абстракция', query: 'abstract background' },
  { id: 'tech', label: 'Технологии', query: 'technology digital' },
  { id: 'food', label: 'Еда', query: 'food restaurant' },
  { id: 'sport', label: 'Спорт', query: 'sport action' },
  { id: 'broll', label: 'Фоны/B-roll', query: 'background loop' },
]

// Pixabay API для видео
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY
const PIXABAY_VIDEOS_API_URL = 'https://pixabay.com/api/videos/'

export default function FootagePanel({ project, onChangeProject, onPreviewVideoAspectChange }) {
  const [activeCategory, setActiveCategory] = useState(() => {
    const saved = localStorage.getItem('dm_footage_category')
    return saved || 'popular'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isOriginalsOpen, setIsOriginalsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('footage-active-tab')
    return saved === 'dmovies' ? 'dmovies' : 'library'
  })

  useEffect(() => {
    if (!onPreviewVideoAspectChange) return
    if (activeTab === 'dmovies') {
      onPreviewVideoAspectChange({ width: 1120, height: 832 })
    } else {
      onPreviewVideoAspectChange(null)
    }
    return () => {
      onPreviewVideoAspectChange(null)
    }
  }, [activeTab, onPreviewVideoAspectChange])

  // Находим выбранное видео
  const selectedVideoId = project?.selectedVideoId
  const videoLayers = project?.videoLayers || []
  const selectedVideoLayer = selectedVideoId 
    ? videoLayers.find(v => v && v.id === selectedVideoId) 
    : null

  // УБРАНО: Автоматическое переключение на настройки при выборе видео
  // Панель остается в "Библиотеке" после выбора видео

  // Загрузка видео с автоматической повторной попыткой
  const loadVideos = async (query, category, pageNum = 1, retryCount = 0) => {
    setLoading(true)
    setError(null)
    
    // Проверяем наличие API ключа
    if (!PIXABAY_API_KEY) {
      console.error('VITE_PIXABAY_API_KEY is not defined!')
      setError('API ключ Pixabay не настроен. Установите VITE_PIXABAY_API_KEY в переменных окружения.')
      setLoading(false)
      setVideos([])
      return
    }
    
    try {
      const searchQuery = query || FOOTAGE_CATEGORIES.find(c => c.id === category)?.query || 'popular'
      
      // Формируем URL для Pixabay API
      const url = new URL(PIXABAY_VIDEOS_API_URL)
      url.searchParams.set('key', PIXABAY_API_KEY)
      url.searchParams.set('q', searchQuery)
      url.searchParams.set('per_page', '24')
      url.searchParams.set('page', String(pageNum))
      url.searchParams.set('safesearch', 'true')
      
      const urlString = url.toString()
      
      // Логируем URL для проверки в Network (ключ будет виден в Network tab браузера)
      console.log('🎬 Loading footage from Pixabay:', { 
        query: searchQuery, 
        category, 
        pageNum, 
        url: urlString, // Полный URL с ключом для проверки в Network
        hasApiKey: !!PIXABAY_API_KEY,
        apiKeyLength: PIXABAY_API_KEY?.length || 0,
        retry: retryCount 
      })
      
      // Также логируем безопасную версию (без ключа) для обычных логов
      const safeUrl = urlString.replace(/key=[^&]+/, 'key=***')
      console.log('Pixabay API URL (safe):', safeUrl)
      
      let response
      let responseText
      
      try {
        response = await fetch(urlString, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000)
        })
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        
        // Автоматическая повторная попытка при сетевых ошибках
        if (retryCount < 2 && (fetchError.name === 'TypeError' || fetchError.message.includes('Failed to fetch'))) {
          console.log(`🔄 Повторная попытка ${retryCount + 1}/2...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Задержка 1s, 2s
          return loadVideos(query, category, pageNum, retryCount + 1)
        }
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания')
        } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Не удалось подключиться к серверу')
        }
        throw new Error(`Ошибка сети: ${fetchError.message}`)
      }
      
      try {
        responseText = await response.text()
      } catch (textError) {
        console.error('Error reading response:', textError)
        throw new Error('Не удалось прочитать ответ от сервера')
      }
      
      console.log('🎬 Response status:', response.status)
      console.log('🎬 Response text:', responseText.substring(0, 500))
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}` }
        }
        
        // Упрощенные сообщения об ошибках
        if (response.status === 400) {
          throw new Error('Неверный запрос к Pixabay API. Проверьте параметры.')
        } else if (response.status === 401) {
          throw new Error('Неверный API ключ Pixabay')
        } else if (response.status === 429) {
          throw new Error('Лимит запросов к Pixabay API превышен')
        } else if (response.status === 404) {
          throw new Error('Endpoint Pixabay API не найден')
        }
        
        throw new Error(errorData.error || `Ошибка Pixabay API: ${response.status}`)
      }
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Неверный формат ответа от сервера')
      }
      
      console.log('🎬 Parsed data from Pixabay:', { 
        hitsCount: data.hits?.length || 0, 
        totalHits: data.totalHits || 0,
        total: data.total || 0,
        keys: Object.keys(data)
      })
      
      // Проверяем наличие hits массива (Pixabay возвращает hits, а не videos)
      if (!data.hits || !Array.isArray(data.hits)) {
        console.error('No hits field in Pixabay response:', data)
        throw new Error('Неверный формат ответа от Pixabay: отсутствует поле hits')
      }
      
      // Адаптируем формат Pixabay к нашему формату
      const videos = data.hits.map(hit => {
        // Логируем структуру первого элемента для диагностики
        if (data.hits.indexOf(hit) === 0) {
          console.log('🎬 First Pixabay video hit structure:', {
            id: hit.id,
            picture_id: hit.picture_id,
            thumbnail: hit.thumbnail,
            videos: hit.videos,
            allKeys: Object.keys(hit)
          })
        }
        
        // Находим лучшее качество видео
        let videoUrlHd = null
        let videoUrlFull = null
        
        if (hit.videos) {
          // Pixabay возвращает объект videos с разными качествами
          const videoFiles = hit.videos
          // Сортируем по качеству (width * height)
          const qualities = [
            { key: 'large', url: videoFiles.large?.url },
            { key: 'medium', url: videoFiles.medium?.url },
            { key: 'small', url: videoFiles.small?.url },
            { key: 'tiny', url: videoFiles.tiny?.url }
          ].filter(q => q.url)
          
          if (qualities.length > 0) {
            videoUrlFull = qualities[0].url // Лучшее качество
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
        // 2. Проверяем picture_id и формируем URL для Vimeo CDN (старый формат)
        else if (hit.picture_id) {
          previewUrl = `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg`
        } 
        // 3. Проверяем поле pictures (может быть объект с разными размерами)
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
        // 4. Проверяем thumbnail на верхнем уровне (если это не видео файл)
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
        
        // Логируем для первого элемента (детально)
        if (data.hits.indexOf(hit) === 0) {
          console.log('🎬 First video hit full structure:', JSON.stringify(hit, null, 2))
          console.log('🎬 Generated preview URL:', previewUrl || '(empty)')
          console.log('🎬 Preview check:', {
            hasPictureId: !!hit.picture_id,
            pictureId: hit.picture_id,
            hasPictures: !!hit.pictures,
            pictures: hit.pictures,
            hasThumbnail: !!hit.thumbnail,
            thumbnail: hit.thumbnail,
            hasImage: !!hit.image,
            image: hit.image,
            allKeys: Object.keys(hit)
          })
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
      
      // Пустой массив - это нормально, просто показываем сообщение
      if (videos.length === 0 && pageNum === 1) {
        setError('Футажи не найдены')
      } else {
        setError(null)
      }
      
      // Проверяем, есть ли еще страницы
      const totalHits = data.totalHits || data.total || 0
      const perPage = 24
      const hasMorePages = pageNum * perPage < totalHits
      
      setVideos(prevVideos => pageNum === 1 ? videos : [...prevVideos, ...videos])
      setHasMore(hasMorePages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading footage:', error)
      setError(error.message || 'Ошибка загрузки футажей')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    loadVideos('', activeCategory, 1)
  }, [])

  // Загрузка при смене категории
  useEffect(() => {
    if (!searchQuery) {
      loadVideos('', activeCategory, 1)
    }
  }, [activeCategory])

  // Обработка поиска
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      loadVideos(searchQuery, activeCategory, 1)
    }
  }

  // Добавление видео в проект
  const handleAddVideo = (video) => {
    if (!project || !onChangeProject) {
      console.warn('FootagePanel: project or onChangeProject is missing')
      return
    }

    if (!video || !video.videoUrlHd && !video.videoUrlFull) {
      console.error('FootagePanel: Invalid video data', video)
      alert('Ошибка: неверные данные видео')
      return
    }

    try {
      const newVideoLayer = {
        id: `video_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'video',
        subType: 'footage',
        source: 'pexels',
        externalId: video.id,
        srcHd: video.videoUrlHd,
        srcFull: video.videoUrlFull,
        duration: video.duration || 10,
        previewUrl: video.previewUrl,
        width: video.width || 1920,
        height: video.height || 1080,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: 100 + (project.videoLayers?.length || 0),
        visible: true,
        locked: false,
        startTime: 0,
        endTime: video.duration || 10,
      }

      // Создаем клип (без таймлайна используем дефолтные значения)
      const projectDuration = 30 // Дефолтная длительность проекта
      const videoDuration = video.duration || projectDuration
      const newClip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        elementId: newVideoLayer.id,
        type: 'video',
        startTime: 0,
        duration: projectDuration,
        endTime: projectDuration,
        playbackRate: 1, // Скорость по умолчанию
        reverse: false, // Обратное воспроизведение по умолчанию
      }

      const updatedProject = {
        ...project,
        videoLayers: [...(project.videoLayers || []), newVideoLayer],
        videoClips: [...(project.videoClips || []), newClip],
        selectedVideoId: newVideoLayer.id,
        selectedStickerId: null,
        selectedTextId: null,
        selectedIconId: null,
        selectedFrameId: null,
      }

      console.log('FootagePanel: Adding video to project', {
        videoLayer: newVideoLayer.id,
        videoClip: newClip.id,
        duration: videoDuration
      })

      onChangeProject(updatedProject)
    } catch (error) {
      console.error('FootagePanel: Error adding video', error)
      alert('Ошибка при добавлении видео: ' + error.message)
    }
  }

  const handleAddPremiumVideo = (video) => {
    if (!project || !onChangeProject) {
      console.warn('FootagePanel: project or onChangeProject is missing')
      return
    }

    const src = video?.url
    if (!video || !src) {
      console.error('FootagePanel: Invalid premium video data', video)
      alert('Ошибка: неверные данные видео')
      return
    }

    try {
      const newVideoLayer = {
        id: `video_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'video',
        subType: 'premium',
        source: 'futaj',
        externalId: video.key,
        srcHd: src,
        srcFull: src,
        objectFit: 'contain',
        duration: 10,
        previewUrl: null,
        width: 1120,
        height: 832,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: 100 + (project.videoLayers?.length || 0),
        visible: true,
        locked: false,
        startTime: 0,
        endTime: 10,
      }

      const projectDuration = 30
      const newClip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        elementId: newVideoLayer.id,
        type: 'video',
        startTime: 0,
        duration: projectDuration,
        endTime: projectDuration,
        playbackRate: 1,
        reverse: false,
      }

      const updatedProject = {
        ...project,
        videoLayers: [...(project.videoLayers || []), newVideoLayer],
        videoClips: [...(project.videoClips || []), newClip],
        selectedVideoId: newVideoLayer.id,
        selectedStickerId: null,
        selectedTextId: null,
        selectedIconId: null,
        selectedFrameId: null,
      }

      onChangeProject(updatedProject)
    } catch (error) {
      console.error('FootagePanel: Error adding premium video', error)
      alert('Ошибка при добавлении видео: ' + error.message)
    }
  }

  const downloadPremiumVideo = async (video) => {
    if (!video?.url) {
      alert('Видео недоступно для скачивания')
      return
    }

    try {
      const response = await fetch(video.url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const safeName = (video.fileName || video.displayName || 'dmotiontj-premium')
        .toString()
        .trim()
        .replace(/\s+/g, '_')
      a.download = safeName.toLowerCase().endsWith('.mp4') ? safeName : `${safeName}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading premium video:', error)
      alert('Ошибка при скачивании видео')
    }
  }

  // Форматирование времени
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Обработка клика на кнопку скачивания
  const handleDownloadClick = (video, e) => {
    e.stopPropagation()
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  // Скачивание видео
  const downloadVideo = async (format) => {
    if (!selectedVideo) return

    try {
      let url
      let filename

      if (format === 'mp4') {
        // Скачиваем HD версию, если есть, иначе полную
        url = selectedVideo.videoUrlHd || selectedVideo.videoUrlFull
        filename = `dmotiontj.mp4`
      } else if (format === 'hd') {
        url = selectedVideo.videoUrlHd || selectedVideo.videoUrlFull
        filename = `dmotiontj-hd.mp4`
      } else if (format === 'full') {
        url = selectedVideo.videoUrlFull || selectedVideo.videoUrlHd
        filename = `dmotiontj-full.mp4`
      }

      if (!url) {
        alert('Видео недоступно для скачивания')
        return
      }

      // Скачиваем видео
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      setIsModalOpen(false)
    } catch (error) {
      console.error('Ошибка скачивания видео:', error)
      alert('Не удалось скачать видео')
    }
  }

  return (
    <div className="editor-v2-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 100px)',
      background: 'rgba(11, 15, 14, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Вкладки */}
      <div
        className="dm-right-panel-header"
        style={{
          display: 'flex',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => {
            setActiveTab('library')
            localStorage.setItem('footage-active-tab', 'library')
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            background: activeTab === 'library' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: activeTab === 'library' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '11px',
            fontWeight: activeTab === 'library' ? '600' : '400',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.2s'
          }}
        >
          Бесплатные
        </button>
        <button
          onClick={() => {
            setActiveTab('dmovies')
            localStorage.setItem('footage-active-tab', 'dmovies')
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            background: activeTab === 'dmovies' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: activeTab === 'dmovies' ? '#ffc107' : 'rgba(255, 193, 7, 0.6)',
            fontSize: '11px',
            fontWeight: activeTab === 'dmovies' ? '600' : '400',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.2s'
          }}
        >
          PREMIUM
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'library' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          overflow: 'visible'
        }}>
      {/* Заголовок с кнопками */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--dm-border-soft)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}>
        {/* Заголовок */}
        <h3 style={{
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          flex: 1,
          opacity: isSearchOpen ? 0 : 1,
          position: isSearchOpen ? 'absolute' : 'relative',
          pointerEvents: isSearchOpen ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
          width: isSearchOpen ? 0 : 'auto',
          overflow: isSearchOpen ? 'hidden' : 'visible'
        }}>
          ФУТАЖИ
        </h3>

        {/* Поле поиска - открывается на месте заголовка */}
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          style={{
            position: isSearchOpen ? 'relative' : 'absolute',
            left: 0,
            top: 0,
            width: isSearchOpen ? '180px' : '0',
            padding: isSearchOpen ? '4px 8px' : '0',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isSearchOpen ? 1 : 0,
            outline: 'none',
            pointerEvents: isSearchOpen ? 'auto' : 'none',
            zIndex: 10
          }}
          onBlur={(e) => {
            if (!searchQuery && !e.currentTarget.value) {
              setIsSearchOpen(false)
            }
          }}
        />

        {/* Кнопка поиска */}
        <button
          onClick={() => {
            setIsSearchOpen(!isSearchOpen)
            if (!isSearchOpen) {
              setTimeout(() => {
                const inputs = document.querySelectorAll('input[placeholder="Поиск..."]')
                if (inputs.length > 0) {
                  inputs[inputs.length - 1].focus()
                }
              }, 150)
            } else {
              setSearchQuery('')
            }
          }}
          style={{
            width: '20px',
            height: '20px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Кнопка фильтров */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          style={{
            width: '20px',
            height: '20px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: isFiltersOpen ? 'var(--dm-accent)' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (!isFiltersOpen) {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isFiltersOpen) {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Фильтры (категории) - показываются при открытии */}
      {isFiltersOpen && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--dm-border-soft)',
          flexShrink: 0
        }}
        className="dm-categories-scroll"
        >
          <div style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            minWidth: 'max-content'
          }}>
            {FOOTAGE_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id)
                  localStorage.setItem('dm_footage_category', category.id)
                  setSearchQuery('')
                }}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  background: activeCategory === category.id
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: activeCategory === category.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: activeCategory === category.id ? '500' : '400',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto',
                  lineHeight: '1.2'
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== category.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== category.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Сетка видео */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.12) transparent'
      }}>
        {error && !loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--dm-text-soft)'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '12px' }}>
              Не удалось загрузить футажи
            </div>
            <button
              onClick={() => {
                setError(null)
                loadVideos('', activeCategory, 1)
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--dm-border)',
                borderRadius: '6px',
                background: 'rgba(10, 12, 20, 0.6)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 255, 212, 0.15)'
                e.currentTarget.style.borderColor = 'var(--dm-accent)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 12, 20, 0.6)'
                e.currentTarget.style.borderColor = 'var(--dm-border)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              Попробовать снова
            </button>
          </div>
        ) : loading && videos.length === 0 ? (
          <Loader fullscreen={false} size="minimal" showText={false} />
        ) : videos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--dm-text-soft)'
          }}>
            Футажи не найдены
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onAdd={() => handleAddVideo(video)}
                onDownload={(e) => handleDownloadClick(video, e)}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}

        {/* Кнопка "Показать ещё" */}
        {hasMore && !loading && (
          <div style={{
            textAlign: 'center',
            marginTop: '16px'
          }}>
            <button
              onClick={() => loadVideos(searchQuery || '', activeCategory, page + 1)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--dm-border)',
                borderRadius: '6px',
                background: 'rgba(10, 12, 20, 0.6)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 255, 212, 0.15)'
                e.currentTarget.style.borderColor = 'var(--dm-accent)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 12, 20, 0.6)'
                e.currentTarget.style.borderColor = 'var(--dm-border)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              Показать ещё
            </button>
          </div>
        )}
      </div>

      {/* Кнопка DMOTION Originals внизу */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--dm-border-soft)',
        flexShrink: 0
      }}>
        <button
          onClick={() => setIsOriginalsOpen(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--dm-border)',
            borderRadius: '6px',
            background: 'rgba(10, 12, 20, 0.6)',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(92, 255, 212, 0.15)'
            e.currentTarget.style.borderColor = 'var(--dm-accent)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(10, 12, 20, 0.6)'
            e.currentTarget.style.borderColor = 'var(--dm-border)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
          }}
        >
          DMOTION Originals
        </button>
      </div>

      {/* Модальное окно скачивания */}
      <VideoDownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        video={selectedVideo}
        onDownload={downloadVideo}
      />

      {/* Модальное окно DMOTION Originals */}
      <DMotionOriginalsModal
        isOpen={isOriginalsOpen}
        onClose={() => setIsOriginalsOpen(false)}
      />
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{
          flex: '0 0 auto',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <VideoSettingsPanel 
            video={selectedVideoLayer}
            onUpdate={(updates) => {
              if (!selectedVideoLayer) return
              const updatedLayers = videoLayers.map(v =>
                v.id === selectedVideoLayer.id ? { ...v, ...updates } : v
              )
              onChangeProject({ ...project, videoLayers: updatedLayers })
            }}
            onDelete={() => {
              if (!selectedVideoLayer) return
              const updatedLayers = videoLayers.filter(v => v.id !== selectedVideoLayer.id)
              const updatedClips = (project.videoClips || []).filter(
                clip => clip.elementId !== selectedVideoLayer.id
              )
              onChangeProject({ 
                ...project, 
                videoLayers: updatedLayers,
                videoClips: updatedClips,
                selectedVideoId: null
              })
              setActiveTab('library')
            }}
            onDuplicate={() => {
              if (!selectedVideoLayer) return
              const newVideo = {
                ...selectedVideoLayer,
                id: `video_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                x: (selectedVideoLayer.x || 50) + 5,
                y: (selectedVideoLayer.y || 50) + 5,
                zIndex: Math.max(...videoLayers.map(v => v.zIndex || 0), 0) + 1
              }
              const projectDuration = 30 // Дефолтная длительность проекта
              const videoDuration = selectedVideoLayer.duration || projectDuration
              const newClip = {
                id: `clip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                elementId: newVideo.id,
                type: 'video',
                startTime: 0,
                duration: projectDuration,
                endTime: projectDuration,
                playbackRate: 1,
                reverse: false,
              }
              onChangeProject({ 
                ...project, 
                videoLayers: [...videoLayers, newVideo],
                videoClips: [...(project.videoClips || []), newClip],
                selectedVideoId: newVideo.id
              })
            }}
          />
        </div>
      )}

      {activeTab === 'dmovies' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <PremiumVideosTab
            onAddVideo={handleAddPremiumVideo}
            onDownloadVideo={downloadPremiumVideo}
            onPreviewAspectChange={onPreviewVideoAspectChange}
          />
        </div>
      )}
    </div>
  )
}

// Компонент карточки видео
function VideoCard({ video, onAdd, onDownload, formatDuration }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--dm-border)',
        background: 'var(--dm-bg-secondary)',
        transition: 'all 0.2s ease'
      }}
      onClick={onAdd}
      onMouseEnter={(e) => {
        setIsHovered(true)
        e.currentTarget.style.borderColor = 'var(--dm-accent)'
        e.currentTarget.style.boxShadow = '0 0 12px rgba(92, 255, 212, 0.3)'
        if (onPreviewAspect && src && aspectCache?.current?.has(src)) {
          const cached = aspectCache.current.get(src)
          if (cached?.width && cached?.height) onPreviewAspect(cached)
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        e.currentTarget.style.borderColor = 'var(--dm-border)'
        e.currentTarget.style.boxShadow = 'none'
        if (onPreviewAspect) onPreviewAspect(null)
      }}
    >
      {/* Превью */}
      {video.previewUrl ? (
        <img
          src={video.previewUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            console.error('Failed to load preview image:', video.previewUrl)
            e.target.style.display = 'none'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(10, 12, 20, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dm-text-soft)',
          fontSize: '10px'
        }}>
          Нет превью
        </div>
      )}

      {/* Градиент снизу */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
        pointerEvents: 'none'
      }} />

      {/* Длительность */}
      <div style={{
        position: 'absolute',
        bottom: '6px',
        left: '6px',
        padding: '2px 6px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '500',
        pointerEvents: 'none'
      }}>
        {formatDuration(video.duration)}
      </div>

      {/* Кнопка Play при hover */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Кнопка скачивания в углу */}
      <button
        onClick={onDownload}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '24px',
          height: '24px',
          padding: '0',
          border: 'none',
          borderRadius: '4px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHovered ? 1 : 0,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  )
}

// Модальное окно скачивания видео
function VideoDownloadModal({ isOpen, onClose, video, onDownload }) {
  if (!isOpen || !video) return null

  const handleDownload = (format) => {
    onDownload(format)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(14, 14, 18, 0.98), rgba(18, 18, 24, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          width: '320px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#fff',
          textAlign: 'center'
        }}>
          Скачать видео
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* MP4 HD */}
          <button
            onClick={() => handleDownload('hd')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left' }}>MP4 HD</span>
          </button>
          
          {/* MP4 Full */}
          <button
            onClick={() => handleDownload('full')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left' }}>MP4 Full</span>
          </button>
          
          {/* MP4 Standard */}
          <button
            onClick={() => handleDownload('mp4')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(0, 228, 155, 0.3)',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 228, 155, 0.1), rgba(0, 228, 155, 0.05))',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 228, 155, 0.15), rgba(0, 228, 155, 0.1))'
              e.currentTarget.style.borderColor = 'rgba(0, 228, 155, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 228, 155, 0.1), rgba(0, 228, 155, 0.05))'
              e.currentTarget.style.borderColor = 'rgba(0, 228, 155, 0.3)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span style={{ flex: 1, textAlign: 'left' }}>MP4</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#00c584',
              background: 'rgba(0, 197, 132, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              PREMIUM
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          Отмена
        </button>
        
        {/* Социальные сети */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '400'
          }}>
            Подпишитесь за благодарность
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            alignItems: 'center'
          }}>
            <a
              href="https://t.me/dushanbemotion"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(37, 150, 190, 0.15)',
                border: '1px solid rgba(37, 150, 190, 0.3)',
                color: '#2596be',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 150, 190, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(37, 150, 190, 0.5)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(37, 150, 190, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(37, 150, 190, 0.3)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@dushanbemotion"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(255, 0, 0, 0.15)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff0000',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Модальное окно DMOTION Originals
function DMotionOriginalsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const categories = [
    { id: 'aralash', label: 'АРАЛАШ' },
    { id: 'male', label: 'МУЖСКИЕ' },
    { id: 'female', label: 'ЖЕНСКИЕ' },
    { id: 'patriot', label: 'ПАТРИОТ' },
    { id: 'nature', label: 'ПРИРОДА' },
    { id: 'history', label: 'ИСТОРИЯ' },
    { id: 'backgrounds', label: 'ФОНЫ' },
    { id: 'music', label: 'МУЗЫКА' },
    { id: 'animals', label: 'ЖИВОТНЫЕ' },
    { id: 'transport', label: 'ТРАНСПОРТ' },
    { id: 'people', label: 'ЛЮДИ' },
    { id: 'effects', label: 'ЭФФЕКТЫ' },
    { id: 'needed', label: 'НУЖНЫЕ' },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(14, 14, 18, 0.98), rgba(18, 18, 24, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          width: '420px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.12) transparent'
        }}
      >
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: '#fff',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          DMOTION Originals
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                console.log('Selected category:', category.id)
                onClose()
              }}
              style={{
                padding: '10px 12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 255, 212, 0.15)'
                e.currentTarget.style.borderColor = 'var(--dm-accent)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

function PremiumVideoCard({ video, onAdd, onDownload, onPreviewAspect, aspectCache }) {
  const [isHovered, setIsHovered] = useState(false)
  const title = video?.displayName || video?.fileName || video?.key || 'Видео'
  const src = video?.url

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--dm-border)',
        background: 'var(--dm-bg-secondary)',
        cursor: src ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        setIsHovered(true)
        e.currentTarget.style.borderColor = 'var(--dm-accent)'
        e.currentTarget.style.boxShadow = '0 0 12px rgba(92, 255, 212, 0.3)'
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        e.currentTarget.style.borderColor = 'var(--dm-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onClick={() => {
        if (!src) return
        if (onAdd) onAdd(video)
      }}
    >
      {src ? (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const w = e.currentTarget?.videoWidth
            const h = e.currentTarget?.videoHeight
            if (src && w && h && aspectCache?.current) {
              aspectCache.current.set(src, { width: w, height: h })
            }
            if (onPreviewAspect && w && h && isHovered) onPreviewAspect({ width: w, height: h })
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isHovered ? 'brightness(1.05)' : 'none',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dm-text-soft)',
          fontSize: '12px',
        }}>
          Нет видео
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          if (onDownload) onDownload(video)
        }}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '28px',
          height: '28px',
          padding: '0',
          border: 'none',
          borderRadius: '6px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHovered ? 1 : 0,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  )
}

// Компонент Premium Videos Tab с категориями слева как в BackgroundPanel
function PremiumVideosTab({ onAddVideo, onDownloadVideo, onPreviewAspectChange }) {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [videosLoading, setVideosLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gridColumns, setGridColumns] = useState(2)
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(() => {
    const saved = localStorage.getItem('footage-premium-categories-collapsed')
    return saved === 'true'
  })

  const aspectCacheRef = useRef(new Map())

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const resp = await fetch(`${WORKER_URL}/api/futaj/categories`)
        const data = await resp.json()
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories)
          // Восстанавливаем сохраненную категорию
          const savedCategory = localStorage.getItem('footage-premium-active-category')
          const categoryToSet = savedCategory && data.categories.includes(savedCategory) 
            ? savedCategory 
            : data.categories[0]
          setActiveCategory(categoryToSet)
        }
      } catch (err) {
        console.error('Error loading futaj categories:', err)
        setError('Не удалось загрузить категории')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!activeCategory) return
    const fetchVideos = async () => {
      try {
        setVideosLoading(true)
        const resp = await fetch(`${WORKER_URL}/api/futaj/videos?category=${encodeURIComponent(activeCategory)}`)
        const data = await resp.json()
        setVideos(data.items || [])
      } catch (err) {
        console.error('Error loading futaj videos:', err)
      } finally {
        setVideosLoading(false)
      }
    }
    fetchVideos()
  }, [activeCategory])

  if (loading) {
    return (
      <div className="dm-premium-videos-loading">
        <Loader fullscreen={false} size="minimal" showText={false} />
        <p>Загрузка...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dm-premium-videos-error">
        {error}
      </div>
    )
  }

  return (
    <div className="dm-premium-layout">
      {/* Боковая панель категорий (как в Фон) */}
      <div className={`dm-premium-categories-rail ${isCategoriesCollapsed ? 'collapsed' : ''}`}>
        <div className="dm-premium-categories-header">
          {!isCategoriesCollapsed && <span className="dm-premium-categories-title">Категории</span>}
          <button
            type="button"
            className="dm-premium-categories-toggle"
            onClick={() => {
              const newValue = !isCategoriesCollapsed
              setIsCategoriesCollapsed(newValue)
              localStorage.setItem('footage-premium-categories-collapsed', String(newValue))
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              {isCategoriesCollapsed ? <path d="M4 2l4 4-4 4" /> : <path d="M8 2l-4 4 4 4" />}
            </svg>
          </button>
        </div>
        <div className="dm-premium-categories-list">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`dm-premium-category-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat)
                localStorage.setItem('footage-premium-active-category', cat)
              }}
              title={FUTAJ_CATEGORY_NAMES[cat] || cat}
            >
              {isCategoriesCollapsed ? (
                <span className="dm-premium-category-icon">
                  {(FUTAJ_CATEGORY_NAMES[cat] || cat).charAt(0)}
                </span>
              ) : (
                FUTAJ_CATEGORY_NAMES[cat] || cat
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Контент справа */}
      <div className="dm-premium-content">
        {/* Заголовок с переключателем сетки */}
        <div className="dm-premium-content-header">
          <span className="dm-premium-content-title">
            {FUTAJ_CATEGORY_NAMES[activeCategory] || activeCategory}
          </span>
          <div className="dm-premium-grid-switcher">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                type="button"
                className={`dm-premium-grid-btn ${gridColumns === n ? 'active' : ''}`}
                onClick={() => setGridColumns(n)}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>

        {/* Сетка видео */}
        <div className="dm-premium-videos-scroll">
          {videosLoading ? (
            <div className="dm-premium-videos-loading">
              <Loader fullscreen={false} size="minimal" showText={false} />
            </div>
          ) : videos.length === 0 ? (
            <div className="dm-premium-videos-empty">
              Нет видео в этой категории
            </div>
          ) : (
            <div 
              className="dm-premium-videos-grid"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
              {videos.map((video, index) => (
                <PremiumVideoCard
                  key={video.key}
                  video={video}
                  onAdd={onAddVideo}
                  onDownload={onDownloadVideo}
                  onPreviewAspect={onPreviewAspectChange}
                  aspectCache={aspectCacheRef}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
