// src/editorV2/components/LayerSelectionBox.jsx
import React from 'react'

export default function LayerSelectionBox({ 
  layer, 
  isSelected, 
  onResizeStart,
  canvasRef,
  layerType,
  textBounds,
  zoom = 1,
  offset = { x: 0, y: 0 }
}) {
  if (!isSelected || !layer) return null

  const getLayerBounds = () => {
    const canvas = canvasRef?.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    
    // Определяем тип точно по твоим данным
    const type = layerType || layer.type || (layer.content ? 'text' : 'asset')
    
    let x, y, width, height, rotation = 0
    
    if (type === 'text') {
      if (textBounds) {
        // Точные экранные координаты для текста
        const canvasX = textBounds.left + textBounds.width / 2
        const canvasY = textBounds.top + textBounds.height / 2
        x = rect.left + (canvasX * zoom) + offset.x
        y = rect.top + (canvasY * zoom) + offset.y
        width = textBounds.width * zoom
        height = textBounds.height * zoom
      } else {
        // Запасной вариант для текста
        x = (layer.x || 50) * rect.width / 100
        y = (layer.y || 50) * rect.height / 100
        width = 150 * zoom
        height = 40 * zoom
      }
      rotation = layer.transform?.rotation || layer.rotation || 0
    } else {
      // Универсальная логика для стикеров, видео, иконок и футажей
      // Используем твои проценты (x, y) и пиксели (width, height)
      x = (layer.x || 50) * rect.width / 100
      y = (layer.y || 50) * rect.height / 100
      
      // Базовый размер * масштаб слоя * зум превью
      const scale = layer.scale || 1
      width = (layer.width || 200) * scale * zoom
      height = (layer.height || 200) * scale * zoom
      rotation = layer.rotation || 0
    }
    
    return { x, y, width, height, rotation }
  }

  const bounds = getLayerBounds()
  if (!bounds) return null
  const { x, y, width, height, rotation } = bounds

  // Оставляем только 4 угловые ручки для чистоты
  const handles = [
    { id: 'nw', pos: { top: -6, left: -6 }, cursor: 'nwse-resize' },
    { id: 'ne', pos: { top: -6, right: -6 }, cursor: 'nesw-resize' },
    { id: 'se', pos: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
    { id: 'sw', pos: { bottom: -6, left: -6 }, cursor: 'nesw-resize' }
  ]

  const color = layer.locked ? '#FFC107' : '#00ffa2'

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {/* Тонкая профессиональная рамка */}
      <div style={{
        position: 'absolute',
        inset: -1,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 0 8px ${color}44`,
        borderRadius: '2px'
      }} />
      
      {/* Ручки управления */}
      {!layer.locked && handles.map(h => (
        <div
          key={h.id}
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, h.id); }}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: '#fff',
            border: `2px solid ${color}`,
            borderRadius: '2px',
            cursor: h.cursor,
            pointerEvents: 'auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            ...h.pos
          }}
        />
      ))}

      {/* Индикатор блокировки */}
      {layer.locked && (
        <div style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: color,
          color: '#000',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '9px',
          fontWeight: 'bold'
        }}>LOCKED</div>
      )}
    </div>
  )
}