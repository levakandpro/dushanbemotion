// src/editorV2/timeline/VisualGroupTrack.jsx

import React, { useState, useMemo } from 'react'
import VisualLayerRow from './VisualLayerRow'

/**
 * Сворачиваемая группа визуальных слоев (Сцена/Canvas)
 * По умолчанию СВЕРНУТА
 */
export default function VisualGroupTrack({
  project,
  pixelsPerSecond,
  playheadTime,
  totalDuration,
  onSelectLayer,
  onUpdateLayer,
  isPanningTimeline = false,
  renderMode = 'labels', // 'labels' или 'tracks'
  isExpanded: externalIsExpanded,
  onToggleExpanded
}) {
  // Состояние раскрытия (может управляться извне)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded
  const setIsExpanded = onToggleExpanded || setInternalIsExpanded

  // Собираем все визуальные слои в правильном порядке (по zIndex, сверху вниз)
  const allLayers = useMemo(() => {
    const layers = []

    // Фон (всегда один, но может быть невидимым)
    if (project?.backgroundType) {
      layers.push({
        id: 'bg',
        type: 'background',
        name: 'Фон',
        zIndex: -1000,
        visible: true,
        locked: false,
        startTime: 0,
        duration: totalDuration || 10 // Всегда полная длительность проекта
      })
    }

    // Текстовые слои
    ;(project?.textLayers || []).forEach(text => {
      // Рассчитываем duration из клипов
      const textClips = (project?.textClips || []).filter(c => c.elementId === text.id)
      let startTime = 0
      let duration = 10 // По умолчанию 10 секунд
      
      if (textClips.length > 0) {
        startTime = Math.min(...textClips.map(c => c.startTime || 0))
        const endTime = Math.max(...textClips.map(c => c.endTime || (c.startTime || 0) + 10))
        duration = endTime - startTime
      }
      
      layers.push({
        id: text.id,
        type: 'text',
        name: 'Текст',
        zIndex: text.zIndex || 0,
        visible: text.visible !== false,
        locked: text.locked || false,
        startTime,
        duration
      })
    })

    // Стикеры
    ;(project?.stickerLayers || []).forEach(sticker => {
      // Рассчитываем duration из клипов
      const stickerClips = (project?.stickerClips || []).filter(c => c.elementId === sticker.id)
      let startTime = 0
      let duration = 10 // По умолчанию 10 секунд
      
      if (stickerClips.length > 0) {
        startTime = Math.min(...stickerClips.map(c => c.startTime || 0))
        const endTime = Math.max(...stickerClips.map(c => c.endTime || (c.startTime || 0) + 10))
        duration = endTime - startTime
      }
      
      layers.push({
        id: sticker.id,
        type: 'sticker',
        name: sticker.fileName || 'Стикер',
        zIndex: sticker.zIndex || 0,
        visible: sticker.visible !== false,
        locked: sticker.locked || false,
        startTime,
        duration
      })
    })

    // Иконки
    ;(project?.iconLayers || []).forEach(icon => {
      layers.push({
        id: icon.id,
        type: 'icon',
        name: icon.iconName || 'Иконка',
        zIndex: icon.zIndex || 0,
        visible: icon.visible !== false,
        locked: icon.locked || false,
        startTime: 0,
        duration: totalDuration || 10 // Всегда полная длительность проекта
      })
    })

    // Видео/Футажи
    ;(project?.videoLayers || []).forEach(video => {
      layers.push({
        id: video.id,
        type: 'video',
        name: 'Футаж',
        zIndex: video.zIndex || 0,
        visible: video.visible !== false,
        locked: video.locked || false,
        startTime: 0,
        duration: totalDuration || 10 // Всегда полная длительность проекта
      })
    })

    // Изображения
    ;(project?.imageLayers || []).forEach(image => {
      layers.push({
        id: image.id,
        type: 'image',
        name: image.fileName || 'Изображение',
        zIndex: image.zIndex || 0,
        visible: image.visible !== false,
        locked: image.locked || false,
        startTime: 0,
        duration: totalDuration || 10 // Всегда полная длительность проекта
      })
    })

    // Рамки
    ;(project?.frameLayers || []).forEach(frame => {
      layers.push({
        id: frame.id,
        type: 'frame',
        name: 'Рамка',
        zIndex: frame.zIndex || 0,
        visible: frame.visible !== false,
        locked: frame.locked || false,
        startTime: 0,
        duration: totalDuration || 10 // Всегда полная длительность проекта
      })
    })

    // Сортируем по zIndex (сверху вниз = от большего к меньшему)
    return layers.sort((a, b) => b.zIndex - a.zIndex)
  }, [project, totalDuration])

  // Определяем выбранный слой
  const getSelectedLayerId = () => {
    if (project?.selectedTextId) return project.selectedTextId
    if (project?.selectedStickerId) return project.selectedStickerId
    if (project?.selectedIconId) return project.selectedIconId
    if (project?.selectedVideoId) return project.selectedVideoId
    if (project?.selectedFrameId) return project.selectedFrameId
    return null
  }

  const selectedLayerId = getSelectedLayerId()
  const layersCount = allLayers.length

  // Обработчик выбора слоя
  const handleSelectLayer = (layerId) => {
    if (!onSelectLayer || !project) return
    
    // Определяем тип слоя по ID
    const layer = allLayers.find(l => l.id === layerId)
    if (!layer) return
    
    // Вызываем callback для выделения слоя
    onSelectLayer(layer)
  }

  // Если режим 'tracks' - рендерим только клипы (без лейблов)
  if (renderMode === 'tracks') {
    return (
      <div className="timeline-group-track timeline-group-track--scene">
        <div className="timeline-group-scene-container">
          {/* Заголовок (пустой для выравнивания) */}
          <div className="timeline-group-header" style={{ minHeight: '32px' }} />
          
          {/* Клипы (всегда видимы, если группа развернута в левой колонке) */}
          {isExpanded && (
            <div className="timeline-group-content">
              {allLayers.map((layer) => (
                <VisualLayerRow
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={handleSelectLayer}
                  pixelsPerSecond={pixelsPerSecond}
                  playheadTime={playheadTime}
                  totalDuration={totalDuration}
                  onUpdateLayer={onUpdateLayer}
                  isPanningTimeline={isPanningTimeline}
                  renderMode="tracks"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Режим 'labels' - рендерим лейблы (левая колонка)
  return (
    <div className="timeline-group-track timeline-group-track--scene">
      {/* Визуальный контейнер СЦЕНЫ: вертикальная линия слева */}
      <div className="timeline-group-scene-container">
        {/* Заголовок группы (всегда видимый) */}
        <div 
          className="timeline-group-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="timeline-group-header-left">
            <div className={`timeline-group-chevron ${isExpanded ? 'expanded' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 2l4 4-4 4" />
              </svg>
            </div>
            <span className="timeline-group-title">Сцена</span>
            <span className="timeline-group-count">({layersCount})</span>
          </div>
          <div className="timeline-group-header-right">
            {/* Можно добавить иконки действий */}
          </div>
        </div>

        {/* Содержимое группы (видимо только при развернутом состоянии) */}
        {isExpanded && (
          <div className="timeline-group-content">
            {allLayers.map((layer) => (
              <VisualLayerRow
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                onSelect={handleSelectLayer}
                pixelsPerSecond={pixelsPerSecond}
                playheadTime={playheadTime}
                totalDuration={totalDuration}
                onUpdateLayer={onUpdateLayer}
                isPanningTimeline={isPanningTimeline}
                renderMode="labels"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

