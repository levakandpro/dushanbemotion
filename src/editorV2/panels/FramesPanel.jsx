// src/editorV2/panels/FramesPanel.jsx
import React, { useState, useEffect } from 'react'
import FrameSettingsPanel from './FrameSettingsPanel'
import Loader from '../../components/ui/Loader'

// Категории рамок (пресеты запросов)
// Добавляем "png" и "transparent" для поиска PNG изображений с прозрачностью
const FRAME_CATEGORIES = [
  { id: 'classic', label: 'Классика', query: 'classic frame border png transparent' },
  { id: 'minimal', label: 'Минимал', query: 'minimal frame simple png transparent' },
  { id: 'gold', label: 'Золото', query: 'gold frame luxury png transparent' },
  { id: 'neon', label: 'Неон', query: 'neon frame glow png transparent' },
  { id: 'tech', label: 'Техно', query: 'tech frame digital png transparent' },
  { id: 'vintage', label: 'Винтаж', query: 'vintage frame retro png transparent' },
  { id: 'modern', label: 'Современные', query: 'modern frame contemporary png transparent' },
  { id: 'decorative', label: 'Декоративные', query: 'decorative frame ornate png transparent' },
]

// API endpoint
const FRAMES_API_URL = import.meta.env.VITE_FRAMES_API_URL || 
  'https://stickers-manifest.natopchane.workers.dev/api/frames/search'

export default function FramesPanel({ project, onChangeProject }) {
  const [activeTab, setActiveTab] = useState('library')
  const [activeCategory, setActiveCategory] = useState('classic')
  const [searchQuery, setSearchQuery] = useState('')
  const [orientation, setOrientation] = useState('all') // 'all' | 'horizontal' | 'vertical'
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Находим выбранную рамку
  const selectedFrameId = project?.selectedFrameId
  const frameLayers = project?.frameLayers || []
  const selectedFrame = selectedFrameId ? frameLayers.find(f => f && f.id === selectedFrameId) : null

  // Автоматическое переключение на вкладку "Настройки" при выборе рамки
  useEffect(() => {
    if (selectedFrameId && selectedFrame) {
      setActiveTab('settings')
    }
  }, [selectedFrameId, selectedFrame])

  // Если вкладка "Настройки" открыта, но рамка не выбрана,
  // а в проекте уже есть рамки - автоматически выбираем последнюю
  useEffect(() => {
    if (
      activeTab === 'settings' &&
      !selectedFrameId &&
      frameLayers.length > 0 &&
      project &&
      onChangeProject
    ) {
      const lastFrame = frameLayers[frameLayers.length - 1]
      if (lastFrame && lastFrame.id) {
        onChangeProject({
          ...project,
          selectedFrameId: lastFrame.id,
        })
      }
    }
  }, [activeTab, selectedFrameId, frameLayers, project, onChangeProject])

  // Загрузка рамок
  const loadFrames = async (query, category, orientationFilter, pageNum = 1, retryCount = 0) => {
    setLoading(true)
    setError(null)
    try {
      const searchQuery = query || FRAME_CATEGORIES.find(c => c.id === category)?.query || 'frame border png'
      const url = `${FRAMES_API_URL}?query=${encodeURIComponent(searchQuery)}&orientation=${orientationFilter}&page=${pageNum}`
      
      console.log('🖼️ Loading frames:', { query: searchQuery, category, orientationFilter, pageNum, url })
      
      let response
      let responseText
      
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000)
        })
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        
        // Автоматическая повторная попытка
        if (retryCount < 2 && (fetchError.name === 'TypeError' || fetchError.message.includes('Failed to fetch'))) {
          console.log(`🔄 Повторная попытка ${retryCount + 1}/2...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return loadFrames(query, category, orientationFilter, pageNum, retryCount + 1)
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
      
      console.log('🖼️ Response status:', response.status)
      console.log('🖼️ Response text:', responseText.substring(0, 500))
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}` }
        }
        
        // Упрощенные сообщения об ошибках
        if (response.status === 500 && errorData.error?.includes('PIXABAY_API_KEY')) {
          throw new Error('API ключ не настроен')
        } else if (response.status === 401) {
          throw new Error('Неверный API ключ')
        } else if (response.status === 429) {
          throw new Error('Лимит запросов превышен')
        } else if (response.status === 404) {
          throw new Error('Worker не задеплоен')
        }
        
        throw new Error(errorData.error || 'Ошибка загрузки')
      }
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Неверный формат ответа от сервера')
      }
      
      console.log('🖼️ Parsed data:', { 
        framesCount: data.frames?.length || 0, 
        totalResults: data.totalResults,
        hasNextPage: !!data.nextPage 
      })
      
      if (!data.frames || !Array.isArray(data.frames)) {
        throw new Error('Неверный формат ответа')
      }
      
      if (data.frames.length === 0 && pageNum === 1) {
        // Не показываем ошибку, если просто нет результатов
        setError(null)
        setFrames([])
      } else {
        setError(null)
      }
      
      setFrames(pageNum === 1 ? data.frames : [...frames, ...data.frames])
      setHasMore(!!data.nextPage)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading frames:', error)
      setError(error.message || 'Ошибка загрузки рамок')
      setFrames([])
    } finally {
      setLoading(false)
    }
  }

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    loadFrames('', activeCategory, orientation, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Загрузка при смене категории или ориентации
  useEffect(() => {
    if (!searchQuery) {
      loadFrames('', activeCategory, orientation, 1)
    }
  }, [activeCategory, orientation])

  // Обработка поиска
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      loadFrames(searchQuery, activeCategory, orientation, 1)
    }
  }

  // Добавление рамки в проект
  const handleAddFrame = (frame) => {
    if (!project || !onChangeProject) return

    const projectOrientation = 'horizontal'

    // Вычисляем размеры для центрирования и масштабирования
    const canvasSize = getCanvasSize()
    let scale = 1
    let x = 50
    let y = 50

    // Если ориентация совпадает - Fit по краям
    if (frame.orientation === projectOrientation) {
      const scaleX = canvasSize.width / frame.width
      const scaleY = canvasSize.height / frame.height
      scale = Math.max(scaleX, scaleY)
    } else {
      // Если не совпадает - уменьшить и центрировать
      const scaleX = canvasSize.width / frame.width
      const scaleY = canvasSize.height / frame.height
      scale = Math.min(scaleX, scaleY) * 0.9 // Немного уменьшаем
    }

    const newFrameLayer = {
      id: `frame_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'frame',
      source: 'pixabay',
      externalId: frame.id,
      src: frame.srcUrl,
      previewUrl: frame.previewUrl,
      width: frame.width,
      height: frame.height,
      orientation: frame.orientation,
      x: x,
      y: y,
      scale: scale,
      rotation: 0,
      opacity: 1,
      zIndex: 1000 + (project.frameLayers?.length || 0),
      visible: true,
      locked: false,
    }

    // Создаем клип на таймлайне
    const currentTime = project.timeline?.currentTime || 0
    const duration = project.timeline?.duration || 30 // По умолчанию 30 секунд
    const projectDuration = project?.timeline?.projectDuration || 30
    const newClip = {
      id: `clip_${Date.now()}`,
      elementId: newFrameLayer.id,
      type: 'frame',
      startTime: 0,
      duration: projectDuration,
      endTime: projectDuration,
    }

    const updatedProject = {
      ...project,
      frameLayers: [...(project.frameLayers || []), newFrameLayer],
      frameClips: [...(project.frameClips || []), newClip],
      selectedFrameId: newFrameLayer.id,
    }

    onChangeProject(updatedProject)

    // Сразу переключаем панель на вкладку "Настройки"
    setActiveTab('settings')
  }

  // Вычисление размера канваса
  const getCanvasSize = () => {
    const max = 800
    return { width: max, height: Math.round((9 / 16) * max) }
  }

  // Если выбрана рамка и активна вкладка "Настройки" - показываем настройки
  if (activeTab === 'settings') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--dm-surface)',
        overflow: 'hidden'
      }}>
        {/* Вкладки */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--dm-border-soft)',
          flexShrink: 0
        }}>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'library' 
                ? 'var(--dm-surface)' 
                : 'transparent',
              color: activeTab === 'library' 
                ? 'var(--dm-text)' 
                : 'var(--dm-text-soft)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'library' ? '600' : '400',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: activeTab === 'library' 
                ? '2px solid var(--dm-accent)' 
                : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Библиотека
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'settings' 
                ? 'var(--dm-surface)' 
                : 'transparent',
              color: activeTab === 'settings' 
                ? 'var(--dm-text)' 
                : 'var(--dm-text-soft)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'settings' ? '600' : '400',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: activeTab === 'settings' 
                ? '2px solid var(--dm-accent)' 
                : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Настройки
          </button>
        </div>

        {/* Панель настроек */}
        <FrameSettingsPanel
          frame={selectedFrame}
          onUpdate={(updatedFrame) => {
            const updatedLayers = project.frameLayers.map(f =>
              f.id === updatedFrame.id ? updatedFrame : f
            )
            onChangeProject({
              ...project,
              frameLayers: updatedLayers
            })
          }}
          onDelete={(id) => {
            const updatedLayers = project.frameLayers.filter(f => f.id !== id)
            const updatedClips = (project.frameClips || []).filter(c => c.elementId !== id)
            onChangeProject({
              ...project,
              frameLayers: updatedLayers,
              frameClips: updatedClips,
              selectedFrameId: null
            })
          }}
          onDuplicate={(id) => {
            const frameToDuplicate = project.frameLayers.find(f => f.id === id)
            if (!frameToDuplicate) return
            const newFrame = {
              ...frameToDuplicate,
              id: `frame_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              x: frameToDuplicate.x + 10,
              y: frameToDuplicate.y + 10,
              zIndex: Math.max(...project.frameLayers.map(f => f.zIndex || 0), 0) + 1
            }
            onChangeProject({
              ...project,
              frameLayers: [...project.frameLayers, newFrame],
              selectedFrameId: newFrame.id
            })
          }}
        />
      </div>
    )
  }

  // Вкладка "Библиотека"
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--dm-surface)',
      overflow: 'hidden'
    }}>
      {/* Вкладки */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--dm-border-soft)',
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveTab('library')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            background: activeTab === 'library' 
              ? 'var(--dm-surface)' 
              : 'transparent',
            color: activeTab === 'library' 
              ? 'var(--dm-text)' 
              : 'var(--dm-text-soft)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'library' ? '600' : '400',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: activeTab === 'library' 
              ? '2px solid var(--dm-accent)' 
              : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Библиотека
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            background: activeTab === 'settings' 
              ? 'var(--dm-surface)' 
              : 'transparent',
            color: activeTab === 'settings' 
              ? 'var(--dm-text)' 
              : 'var(--dm-text-soft)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'settings' ? '600' : '400',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: activeTab === 'settings' 
              ? '2px solid var(--dm-accent)' 
              : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Настройки
        </button>
      </div>

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
          РАМКИ
        </h3>

        {/* Поле поиска */}
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

      {/* Переключатель ориентации */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--dm-border-soft)',
        flexShrink: 0,
        display: 'flex',
        gap: '4px'
      }}>
        {['all', 'horizontal', 'vertical'].map(orient => (
          <button
            key={orient}
            onClick={() => setOrientation(orient)}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: 'none',
              background: orientation === orient
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                : 'rgba(255, 255, 255, 0.04)',
              color: orientation === orient ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: orientation === orient ? '500' : '400',
              transition: 'all 0.2s ease',
              textTransform: 'capitalize'
            }}
            onMouseEnter={(e) => {
              if (orientation !== orient) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }
            }}
            onMouseLeave={(e) => {
              if (orientation !== orient) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            {orient === 'all' ? 'Все' : orient === 'horizontal' ? 'Горизонтальные' : 'Вертикальные'}
          </button>
        ))}
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
            {FRAME_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id)
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

      {/* Сетка рамок */}
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
              Не удалось загрузить рамки
            </div>
            <button
              onClick={() => {
                setError(null)
                loadFrames('', activeCategory, orientation, 1)
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
        ) : loading && frames.length === 0 ? (
          <Loader fullscreen={false} size="minimal" showText={false} />
        ) : frames.length === 0 && !loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--dm-text-soft)'
          }}>
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
              Рамки не найдены
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>
              Попробуйте изменить запрос или выбрать другую категорию
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {frames.map(frame => (
              <FrameCard
                key={frame.id}
                frame={frame}
                onAdd={() => handleAddFrame(frame)}
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
              onClick={() => loadFrames(searchQuery || '', activeCategory, orientation, page + 1)}
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
    </div>
  )
}

// Компонент карточки рамки
function FrameCard({ frame, onAdd }) {
  const [isHovered, setIsHovered] = useState(false)

  // Определяем aspect ratio для превью
  const aspectRatio = '16/9'

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: aspectRatio,
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
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        e.currentTarget.style.borderColor = 'var(--dm-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Превью */}
      {frame.previewUrl ? (
        <img
          src={frame.previewUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            console.error('Failed to load preview image:', frame.previewUrl)
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

      {/* Индикатор ориентации */}
      <div style={{
        position: 'absolute',
        top: '6px',
        right: '6px',
        padding: '2px 6px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '9px',
        fontWeight: '500',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)'
      }}>
        {frame.orientation === 'horizontal' ? '→' : '↓'}
      </div>
    </div>
  )
}
