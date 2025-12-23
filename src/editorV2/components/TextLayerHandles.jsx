import React from 'react'

/**
 * Компонент маркеров для выделенного текстового слоя
 * PRO стиль: тонкие хэндлы resize + rotate с линией-коннектором
 */
export default function TextLayerHandles({ layer, onResizeStart, onRotateStart }) {
  if (!layer) return null

  // Угловые хэндлы для resize (пропорциональный)
  const cornerHandles = [
    { id: 'nw', position: { top: '-4px', left: '-4px' }, cursor: 'nwse-resize' },
    { id: 'ne', position: { top: '-4px', right: '-4px' }, cursor: 'nesw-resize' },
    { id: 'se', position: { bottom: '-4px', right: '-4px' }, cursor: 'nwse-resize' },
    { id: 'sw', position: { bottom: '-4px', left: '-4px' }, cursor: 'nesw-resize' }
  ]

  return (
    <>
      {/* Угловые хэндлы resize */}
      {cornerHandles.map(handle => (
        <div
          key={handle.id}
          className="dm-text-handle dm-text-handle--corner"
          style={{
            cursor: handle.cursor,
            ...handle.position
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onResizeStart) {
              onResizeStart(e, handle.id)
            }
          }}
        />
      ))}
      
      {/* Линия-коннектор к rotate хэндлу */}
      {onRotateStart && (
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            left: '50%',
            width: '1px',
            height: '14px',
            background: 'rgba(59, 130, 246, 0.6)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Хэндл rotate сверху по центру */}
      {onRotateStart && (
        <div
          className="dm-text-handle dm-text-handle--rotate"
          style={{
            position: 'absolute',
            top: '-28px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRotateStart(e)
          }}
          title="Повернуть (Shift для привязки к 45°)"
        />
      )}
    </>
  )
}


