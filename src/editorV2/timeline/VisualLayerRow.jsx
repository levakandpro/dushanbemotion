// src/editorV2/timeline/VisualLayerRow.jsx

import React, { useEffect } from 'react'

/**
 * Иконки для типов слоёв
 */
const BackgroundIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <path d="M2 6h12M6 2v12" />
  </svg>
)

const TextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 3h8M8 3v10M6 13h4" />
  </svg>
)

const StickerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M3 3h10v7l-3 3H3V3z" />
    <path d="M10 10v3l3-3h-3z" fill="currentColor" opacity="0.3" />
  </svg>
)

const IconLayerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
  </svg>
)

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <polygon points="6 5 6 11 11 8 6 5" fill="currentColor" />
  </svg>
)

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.6" />
    <path d="M2 12l4-4 3 3 5-5v6H2z" fill="currentColor" opacity="0.3" />
  </svg>
)

const FrameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="14" height="14" rx="1" />
    <rect x="3" y="3" width="10" height="10" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
  </svg>
)

/**
 * Строка слоя в таймлайне (внутри СЦЕНЫ)
 * Простой компонент для отображения одного визуального слоя
 */
export default function VisualLayerRow({
  layer,
  isSelected = false,
  onSelect,
  pixelsPerSecond = 60,
  playheadTime = 0,
  totalDuration = 10,
  onUpdateLayer,
  isPanningTimeline = false,
  renderMode = 'full' // 'full' или 'labels'
}) {
  // Определяем тип слоя, иконку и бейдж
  const getLayerType = () => {
    if (layer.type === 'background') return { name: 'Фон', icon: <BackgroundIcon />, badge: 'BG' }
    if (layer.type === 'text') return { name: 'Текст', icon: <TextIcon />, badge: 'TEXT' }
    if (layer.type === 'sticker') return { name: 'Стикер', icon: <StickerIcon />, badge: 'STK' }
    if (layer.type === 'icon') return { name: 'Иконка', icon: <IconLayerIcon />, badge: 'ICN' }
    if (layer.type === 'video') return { name: 'Видео', icon: <VideoIcon />, badge: 'VID' }
    if (layer.type === 'image') return { name: 'Изображение', icon: <ImageIcon />, badge: 'IMG' }
    if (layer.type === 'frame') return { name: 'Рамка', icon: <FrameIcon />, badge: 'FRM' }
    return { name: 'Слой', icon: <TextIcon />, badge: 'LAY' }
  }

  const layerType = getLayerType()
  const layerName = layer.name || layerType.name
  const isVisible = layer.visible !== false
  const isLocked = layer.locked || false

  // Используем реальные start и duration из слоя
  const startTime = layer.startTime !== undefined ? layer.startTime : (layer.start || 0)
  // НИКОГДА не используем totalDuration как fallback - только реальный duration из слоя или 10 секунд
  const duration = layer.duration || 10
  const left = startTime * pixelsPerSecond
  const width = Math.max(duration * pixelsPerSecond, 20) // Минимум 20px для видимости

  // Состояние перетаскивания и изменения размера
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const [resizeEdge, setResizeEdge] = React.useState(null) // 'left' или 'right'
  const dragStartRef = React.useRef(null)

  // Обработчик начала перетаскивания клипа
  const handleClipMouseDown = (e) => {
    // Если панорамирование таймлайна активно, не начинаем drag клипа
    if (isPanningTimeline) return
    
    // Если слой заблокирован, не даем перетаскивать
    if (isLocked) return
    
    // Если клик по кнопке действия, не начинаем drag
    if (e.target.closest('.visual-layer-action-btn')) return
    
    e.stopPropagation()
    
    // Проверяем, клик по краю клипа или в центре
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const edgeThreshold = 8 // пикселей от края
    
    if (clickX <= edgeThreshold) {
      // Клик по левому краю - изменение начала
      setIsResizing(true)
      setResizeEdge('left')
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: startTime,
        clipDuration: duration
      }
    } else if (clickX >= rect.width - edgeThreshold) {
      // Клик по правому краю - изменение конца
      setIsResizing(true)
      setResizeEdge('right')
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: startTime,
        clipDuration: duration
      }
    } else {
      // Клик в центре - перемещение
      setIsDragging(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: startTime
      }
    }
  }

  // Обработчик движения при перетаскивании и изменении размера
  useEffect(() => {
    if (!isDragging && !isResizing) return
    if (isPanningTimeline) {
      // Если включена панорама - сбрасываем drag
      setIsDragging(false)
      setIsResizing(false)
      setResizeEdge(null)
      dragStartRef.current = null
      return
    }

    const handleMouseMove = (e) => {
      if (isPanningTimeline) return
      if (!dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.mouseX
      const deltaTime = deltaX / pixelsPerSecond

      if (isResizing) {
        // Изменение размера клипа (бесконечное растягивание)
        if (resizeEdge === 'left') {
          // Тянем левый край - меняем start и duration
          const newStartTime = Math.max(0, dragStartRef.current.clipStart + deltaTime)
          const newDuration = dragStartRef.current.clipDuration - (newStartTime - dragStartRef.current.clipStart)
          
          // Убираем ограничение на минимальную длительность - можно растягивать бесконечно
          if (newDuration > 0) {
            if (onUpdateLayer) {
              onUpdateLayer(layer.id, { 
                start: newStartTime, 
                startTime: newStartTime,
                duration: newDuration 
              })
            }
          }
        } else if (resizeEdge === 'right') {
          // Тянем правый край - меняем только duration (бесконечное растягивание вправо)
          const newDuration = dragStartRef.current.clipDuration + deltaTime
          
          // Убираем ограничение - можно растягивать бесконечно
          if (newDuration > 0) {
            if (onUpdateLayer) {
              onUpdateLayer(layer.id, { duration: newDuration })
            }
          }
        }
      } else if (isDragging) {
        // Перемещение клипа (без ограничений вправо, только слева >= 0)
        const newStartTime = Math.max(0, dragStartRef.current.clipStart + deltaTime)
        
        if (onUpdateLayer) {
          onUpdateLayer(layer.id, { start: newStartTime, startTime: newStartTime })
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeEdge(null)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeEdge, layer.id, pixelsPerSecond, onUpdateLayer, isPanningTimeline])

  // Если режим 'labels' - рендерим только левую часть (лейбл)
  if (renderMode === 'labels') {
    return (
      <div 
        className={`visual-layer-row ${isSelected ? 'visual-layer-row-selected' : ''}`}
        onClick={() => onSelect && onSelect(layer.id)}
      >
        {/* Левая часть: инфо-колонка (иконка, название) */}
        <div className="visual-layer-row-label">
          <span className="visual-layer-row-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {layerType.icon}
          </span>
          <span className="visual-layer-row-name">
            {layerName}
          </span>
        </div>
      </div>
    )
  }

  // Если режим 'tracks' - рендерим только клип (без лейбла и лишних оберток)
  if (renderMode === 'tracks') {
    return (
      <div 
        className="visual-layer-row"
        style={{ position: 'relative', height: '32px' }}
      >
        <div 
          className="visual-layer-clip"
          style={{
            left: `${left}px`,
            width: `${Math.max(width, 20)}px`,
            cursor: isLocked ? 'not-allowed' : (isResizing || isDragging ? 'grabbing' : 'grab')
          }}
          onMouseDown={handleClipMouseDown}
          onMouseMove={(e) => {
            if (isLocked || isPanningTimeline || isDragging || isResizing) return
            
            // Меняем курсор при наведении на края
            const rect = e.currentTarget.getBoundingClientRect()
            const hoverX = e.clientX - rect.left
            const edgeThreshold = 8
            
            if (hoverX <= edgeThreshold || hoverX >= rect.width - edgeThreshold) {
              e.currentTarget.style.cursor = 'ew-resize'
            } else {
              e.currentTarget.style.cursor = 'grab'
            }
          }}
        >
          {/* Иконки управления в начале клипа (слева) */}
          <div className="visual-layer-clip-actions">
              {/* Иконка видимости (глаз) */}
              <button
                className={`visual-layer-action-btn ${!isVisible ? 'visual-layer-action-btn-hidden' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateLayer) {
                    onUpdateLayer(layer.id, { visible: !isVisible })
                  }
                }}
              >
              {isVisible ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3C11 3 13.5 5.5 13.5 8C13.5 10.5 11 13 8 13C5 13 2.5 10.5 2.5 8C2.5 5.5 5 3 8 3Z" />
                  <circle cx="8" cy="8" r="2" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l10 10M6 6C5 7 4.5 8 4.5 8C4.5 6 7 3.5 8 3.5C8.5 3.5 9 3.8 9.5 4.2M10.5 5.5C11.5 6.5 12 7.5 12 8C12 10.5 9.5 13 8 13C7.5 13 7 12.7 6.5 12.3" />
                  <line x1="3" y1="3" x2="13" y2="13" />
                </svg>
              )}
            </button>

              {/* Иконка блокировки (замок) */}
              <button
                className={`visual-layer-action-btn ${isLocked ? 'visual-layer-action-btn-locked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateLayer) {
                    onUpdateLayer(layer.id, { locked: !isLocked })
                  }
                }}
              >
              {isLocked ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="7" width="9" height="6" rx="1" />
                  <path d="M5.5 7V4.5C5.5 3 7 2 8 2C9 2 10.5 3 10.5 4.5V7" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2">
                  <rect x="3.5" y="7" width="9" height="6" rx="1" />
                  <path d="M5.5 7V4.5C5.5 3 7 2 8 2C9 2 10.5 3 10.5 4.5V7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Режим 'full' - полный рендер с лейблом и клипом
  return (
    <div 
      className={`visual-layer-row ${isSelected ? 'visual-layer-row-selected' : ''}`}
      onClick={() => onSelect && onSelect(layer.id)}
    >
      {/* Левая часть: инфо-колонка (иконка, название) */}
      <div className="visual-layer-row-label">
        <span className="visual-layer-row-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {layerType.icon}
        </span>
        <span className="visual-layer-row-name" title={layerName}>
          {layerName}
        </span>
      </div>

      {/* Правая часть: таймлайн клипа с иконками управления в начале */}
      <div className="visual-layer-row-content">
        <div 
          className="visual-layer-clip"
          style={{
            left: `${left}px`,
            width: `${Math.max(width, 20)}px`,
            cursor: isLocked ? 'not-allowed' : (isResizing || isDragging ? 'grabbing' : 'grab')
          }}
          onMouseDown={handleClipMouseDown}
          onMouseMove={(e) => {
            if (isLocked || isPanningTimeline || isDragging || isResizing) return
            
            // Меняем курсор при наведении на края
            const rect = e.currentTarget.getBoundingClientRect()
            const hoverX = e.clientX - rect.left
            const edgeThreshold = 8
            
            if (hoverX <= edgeThreshold || hoverX >= rect.width - edgeThreshold) {
              e.currentTarget.style.cursor = 'ew-resize'
            } else {
              e.currentTarget.style.cursor = 'grab'
            }
          }}
        >
          {/* Иконки управления в начале клипа (слева) */}
          <div className="visual-layer-clip-actions">
              {/* Иконка видимости (глаз) */}
              <button
                className={`visual-layer-action-btn ${!isVisible ? 'visual-layer-action-btn-hidden' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateLayer) {
                    onUpdateLayer(layer.id, { visible: !isVisible })
                  }
                }}
              >
              {isVisible ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3C11 3 13.5 5.5 13.5 8C13.5 10.5 11 13 8 13C5 13 2.5 10.5 2.5 8C2.5 5.5 5 3 8 3Z" />
                  <circle cx="8" cy="8" r="2" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l10 10M6 6C5 7 4.5 8 4.5 8C4.5 6 7 3.5 8 3.5C8.5 3.5 9 3.8 9.5 4.2M10.5 5.5C11.5 6.5 12 7.5 12 8C12 10.5 9.5 13 8 13C7.5 13 7 12.7 6.5 12.3" />
                  <line x1="3" y1="3" x2="13" y2="13" />
                </svg>
              )}
            </button>

              {/* Иконка блокировки (замок) */}
              <button
                className={`visual-layer-action-btn ${isLocked ? 'visual-layer-action-btn-locked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateLayer) {
                    onUpdateLayer(layer.id, { locked: !isLocked })
                  }
                }}
              >
              {isLocked ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="7" width="9" height="6" rx="1" />
                  <path d="M5.5 7V4.5C5.5 3 7 2 8 2C9 2 10.5 3 10.5 4.5V7" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2">
                  <rect x="3.5" y="7" width="9" height="6" rx="1" />
                  <path d="M5.5 7V4.5C5.5 3 7 2 8 2C9 2 10.5 3 10.5 4.5V7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

