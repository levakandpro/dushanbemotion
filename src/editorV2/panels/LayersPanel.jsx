// src/editorV2/panels/LayersPanel.jsx
import React from 'react'
import { useEditorState } from '../store/useEditorState'

export default function LayersPanel({ project, onChangeProject }) {
  const editorState = useEditorState(project, onChangeProject)

  if (!project) {
    return (
      <div className="editor-v2-panel">
        <h3 className="editor-v2-panel-title">Слои</h3>
        <p className="editor-v2-panel-note">Нет активного проекта</p>
      </div>
    )
  }

  // Используем слои из editorState
  const allLayers = React.useMemo(() => {
    // Конвертируем editorState.layers в формат для отображения
    return editorState.layers.map(layer => {
      let name = 'Слой'
      
      if (layer.type === 'background') {
        name = 'Фон'
      } else if (layer.type === 'text') {
        name = layer.data.content?.substring(0, 20) || 'Текст'
      } else if (layer.type === 'sticker') {
        name = layer.data.fileName || 'Стикер'
      } else if (layer.type === 'icon') {
        name = layer.data.iconName || 'Иконка'
      } else if (layer.type === 'video') {
        name = 'Футаж'
      } else if (layer.type === 'frame') {
        name = 'Рамка'
      } else if (layer.type === 'audio') {
        name = layer.data.name || 'Аудио'
      }
      
      return {
        ...layer,
        name
      }
    }).sort((a, b) => b.zIndex - a.zIndex) // Сверху вниз = от большего к меньшему
  }, [editorState.layers])

  // Используем selectedLayerId из editorState
  const selectedLayerId = editorState.selectedLayerId

  // Иконки для разных типов слоёв
  const getLayerIcon = (type) => {
    switch (type) {
      case 'background':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 6h12M6 2v12" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )
      case 'text':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 3h8M8 3v10M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      case 'sticker':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h10v7l-3 3H3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 10v3l3-3h-3z" fill="currentColor" opacity="0.3"/>
          </svg>
        )
      case 'icon':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          </svg>
        )
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <polygon points="6 5 6 11 11 8 6 5" fill="currentColor"/>
          </svg>
        )
      case 'frame':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="3" y="3" width="10" height="10" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          </svg>
        )
      case 'audio':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11 3v10M9 5v6M7 6v4M5 7v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )
    }
  }

  // Клик по слою - выделяем его через editorState
  const handleLayerClick = (layer) => {
    editorState.selectLayer(layer.id)
  }

  // Переключение видимости через editorState
  const handleToggleVisibility = (layer, e) => {
    e.stopPropagation()
    editorState.toggleLayerVisible(layer.id)
  }

  // Переключение блокировки через editorState
  const handleToggleLock = (layer, e) => {
    e.stopPropagation()
    editorState.toggleLayerLocked(layer.id)
  }

  // Drag & Drop для изменения порядка (базовая реализация)
  const [draggedLayerId, setDraggedLayerId] = React.useState(null)

  const handleDragStart = (layer, e) => {
    if (layer.type === 'background') return // Фон нельзя перемещать
    setDraggedLayerId(layer.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetLayer, e) => {
    e.preventDefault()
    if (!draggedLayerId || draggedLayerId === targetLayer.id) return
    if (targetLayer.type === 'background') return

    // Находим индексы в отсортированном списке
    const draggedIndex = allLayers.findIndex(l => l.id === draggedLayerId)
    const targetIndex = allLayers.findIndex(l => l.id === targetLayer.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Меняем zIndex у перетаскиваемого слоя
    const draggedLayer = allLayers[draggedIndex]
    const newZIndex = targetLayer.zIndex + (draggedIndex < targetIndex ? -1 : 1)

    const updates = { ...project }

    if (draggedLayer.type === 'text') {
      updates.textLayers = updates.textLayers.map(t =>
        t.id === draggedLayer.id ? { ...t, zIndex: newZIndex } : t
      )
    } else if (draggedLayer.type === 'sticker') {
      updates.stickerLayers = updates.stickerLayers.map(s =>
        s.id === draggedLayer.id ? { ...s, zIndex: newZIndex } : s
      )
    } else if (draggedLayer.type === 'icon') {
      updates.iconLayers = updates.iconLayers.map(i =>
        i.id === draggedLayer.id ? { ...i, zIndex: newZIndex } : i
      )
    } else if (draggedLayer.type === 'video') {
      updates.videoLayers = updates.videoLayers.map(v =>
        v.id === draggedLayer.id ? { ...v, zIndex: newZIndex } : v
      )
    } else if (draggedLayer.type === 'frame') {
      updates.frameLayers = updates.frameLayers.map(f =>
        f.id === draggedLayer.id ? { ...f, zIndex: newZIndex } : f
      )
    }

    onChangeProject(updates)
    setDraggedLayerId(null)
  }

  const handleDragEnd = () => {
    setDraggedLayerId(null)
  }

  return (
    <div className="editor-v2-panel dm-layers-panel">
      <h3 className="editor-v2-panel-title">Слои</h3>

      <div className="dm-layers-list">
        {allLayers.length === 0 && (
          <p className="dm-layers-empty">Нет слоёв в сцене</p>
        )}

        {allLayers.map((layer) => (
          <div
            key={layer.id}
            className={`dm-layer-item ${selectedLayerId === layer.id ? 'dm-layer-item--selected' : ''} ${layer.type === 'background' ? 'dm-layer-item--fixed' : ''}`}
            onClick={() => handleLayerClick(layer)}
            draggable={layer.type !== 'background'}
            onDragStart={(e) => handleDragStart(layer, e)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(layer, e)}
            onDragEnd={handleDragEnd}
          >
            <div className="dm-layer-icon">
              {getLayerIcon(layer.type)}
            </div>

            <div className="dm-layer-name">
              {layer.name}
            </div>

            <div className="dm-layer-controls">
              <button
                className={`dm-layer-btn ${layer.visible ? 'dm-layer-btn--active' : ''}`}
                onClick={(e) => handleToggleVisibility(layer, e)}
              >
                {layer.visible ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 3C4.5 3 2.5 5 1 7c1.5 2 3.5 4 6 4s4.5-2 6-4c-1.5-2-3.5-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M4.5 4.5C3.5 5 2.5 6 1 7c1.5 2 3.5 4 6 4 .8 0 1.5-.2 2.2-.5m2.3-2.3c.8-1 1.3-1.8 1.5-2.2-1.5-2-3.5-4-6-4-.5 0-1 .1-1.5.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>

              <button
                className={`dm-layer-btn ${layer.locked ? 'dm-layer-btn--active' : ''}`}
                onClick={(e) => handleToggleLock(layer, e)}
                title={layer.locked ? 'Разблокировать' : 'Заблокировать'}
              >
                {layer.locked ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 6V4a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 6V4a2 2 0 0 1 4 0" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
