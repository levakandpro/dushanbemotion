// src/editorV2/audio/VisualLayerRow.jsx

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
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <rect x="4" y="4" width="8" height="8" rx="0.5" />
  </svg>
)

/**
 * Получает иконку для типа слоя
 */
function getLayerIcon(type) {
  switch (type) {
    case 'background':
      return <BackgroundIcon />
    case 'text':
      return <TextIcon />
    case 'sticker':
      return <StickerIcon />
    case 'icon':
      return <IconLayerIcon />
    case 'video':
      return <VideoIcon />
    case 'image':
      return <ImageIcon />
    case 'frame':
      return <FrameIcon />
    default:
      return <div style={{ width: 16, height: 16 }} />
  }
}

/**
 * Одна строка слоя в визуальной группе
 */
export default function VisualLayerRow({
  layer,
  isSelected,
  onSelect,
  pixelsPerSecond,
  playheadTime,
  totalDuration,
  onUpdateLayer,
  isPanningTimeline = false,
  renderMode = 'labels' // 'labels' или 'tracks'
}) {
  // Обработчик клика по строке слоя
  const handleClick = () => {
    if (onSelect && !isPanningTimeline) {
      onSelect(layer.id)
    }
  }

  // Если режим 'tracks' - рендерим только клип (без лейбла)
  if (renderMode === 'tracks') {
    const left = (layer.startTime || 0) * pixelsPerSecond
    const width = (layer.duration || totalDuration || 10) * pixelsPerSecond
    
    return (
      <div
        className={`timeline-layer-row timeline-layer-row--tracks ${isSelected ? 'is-selected' : ''} ${!layer.visible ? 'is-hidden' : ''}`}
        style={{
          position: 'absolute',
          left: `${left}px`,
          width: `${width}px`,
          height: '32px',
          top: 0
        }}
        onClick={handleClick}
      >
        {/* Клип слоя */}
        <div className="timeline-layer-clip" style={{ width: '100%', height: '100%' }}>
          {/* Индикатор playhead */}
          {playheadTime >= (layer.startTime || 0) && playheadTime <= (layer.startTime || 0) + (layer.duration || totalDuration || 10) && (
            <div
              className="timeline-layer-playhead"
              style={{
                position: 'absolute',
                left: `${(playheadTime - (layer.startTime || 0)) * pixelsPerSecond}px`,
                width: '2px',
                height: '100%',
                background: '#2be7a6',
                zIndex: 10
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Режим 'labels' - рендерим лейбл (левая колонка)
  return (
    <div
      className={`timeline-layer-row timeline-layer-row--labels ${isSelected ? 'is-selected' : ''} ${!layer.visible ? 'is-hidden' : ''} ${layer.locked ? 'is-locked' : ''}`}
      onClick={handleClick}
      style={{
        cursor: isPanningTimeline ? 'grab' : 'pointer',
        userSelect: 'none'
      }}
    >
      <div className="timeline-layer-label">
        <div className="timeline-layer-icon">
          {getLayerIcon(layer.type)}
        </div>
        <span className="timeline-layer-name">{layer.name}</span>
        {layer.locked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ marginLeft: 'auto', opacity: 0.5 }}
          >
            <rect x="2" y="5" width="8" height="6" rx="1" />
            <path d="M4 5V3a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
          </svg>
        )}
        {!layer.visible && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ marginLeft: 'auto', opacity: 0.5 }}
          >
            <path d="M1 6h10M3 3l6 6M9 3l-6 6" />
          </svg>
        )}
      </div>
    </div>
  )
}

