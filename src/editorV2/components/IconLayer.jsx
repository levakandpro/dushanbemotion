// src/editorV2/components/IconLayer.jsx
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Icons from './ContextMenuIcons'

export default function IconLayer({ 
  layer, 
  isSelected, 
  onSelect, 
  onChangeLayer,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  canvasRef,
  isSpacePressed = false,
  zoom = 1
}) {
  const layerRef = useRef(null)
  const contextMenuRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [interaction, setInteraction] = useState({ type: null, start: null })

  if (!layer || !layer.svgContent) return null

  // Контекстное меню
  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  useLayoutEffect(() => {
    if (!contextMenu || !contextMenuRef.current) return
    const menuRect = contextMenuRef.current.getBoundingClientRect()
    const pad = 12
    const x = Math.max(pad, Math.min(contextMenu.x, window.innerWidth - menuRect.width - pad))
    const y = Math.max(pad, Math.min(contextMenu.y, window.innerHeight - menuRect.height - pad))
    if (x !== contextMenu.x || y !== contextMenu.y) setContextMenu({ x, y })
  }, [contextMenu])

  // Обработка трансформаций (drag / resize / rotate)
  const handleMouseDown = (e, type = 'drag', corner = null) => {
    e.stopPropagation()
    if (isSpacePressed || (layer.locked && type !== 'context')) return
    
    onSelect(layer.id)
    if (layer.locked) return

    const canvas = canvasRef?.current?.getBoundingClientRect()
    if (!canvas) return

    setInteraction({
      type,
      start: {
        mouseX: e.clientX,
        mouseY: e.clientY,
        layerX: layer.x,
        layerY: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation || 0,
        corner,
        canvas
      }
    })
  }

  useEffect(() => {
    if (!interaction.type) return

    const handleMouseMove = (e) => {
      const { type, start } = interaction
      const z = zoom || 1

      if (type === 'drag') {
        const deltaX = ((e.clientX - start.mouseX) / z / start.canvas.width) * 100
        const deltaY = ((e.clientY - start.mouseY) / z / start.canvas.height) * 100
        onChangeLayer({
          x: start.layerX + deltaX,
          y: start.layerY + deltaY
        })
      } 
      else if (type === 'resize') {
        const dx = (e.clientX - start.mouseX) / z
        const dy = (e.clientY - start.mouseY) / z
        const ar = start.width / start.height
        
        // Определяем направление resize
        let factor = 1
        if (start.corner === 'nw' || start.corner === 'sw') factor = -1
        
        const distance = Math.sqrt(dx * dx + dy * dy)
        const direction = (dx * factor + dy * factor) > 0 ? 1 : -1
        const newWidth = Math.max(20, start.width + direction * distance * 0.5)
        
        onChangeLayer({ width: newWidth, height: newWidth / ar })
      }
      else if (type === 'rotate') {
        const rect = layerRef.current?.getBoundingClientRect()
        if (!rect) return
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
        onChangeLayer({ rotation: angle + 90 }) 
      }
    }

    const handleMouseUp = () => setInteraction({ type: null, start: null })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [interaction, onChangeLayer, zoom])

  // Парсим SVG и вставляем inline
  const svgWithColor = layer.svgContent.replace(/currentColor/g, layer.color || '#ffffff')

  const style = {
    position: 'absolute',
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}px`,
    height: `${layer.height}px`,
    transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scaleX(${layer.flipX ? -1 : 1})`,
    opacity: layer.opacity !== undefined ? layer.opacity : 1,
    cursor: layer.locked ? 'default' : 'move',
    pointerEvents: 'auto',
    zIndex: layer.zIndex || 0,
    color: layer.color || '#ffffff'
  }

  return (
    <>
      <div
        ref={layerRef}
        className={`icon-layer ${isSelected ? 'icon-layer-selected' : ''}`}
        style={style}
        onMouseDown={(e) => handleMouseDown(e)}
        onContextMenu={handleContextMenu}
      >
        <div
          dangerouslySetInnerHTML={{ __html: svgWithColor }}
          className="icon-layer-svg"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
        
        {/* Controls при выделении */}
        {isSelected && !layer.locked && (
          <div style={{
            position: 'absolute',
            inset: -2,
            border: '1px solid #00ffa2',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {/* Кнопка поворота */}
            <div 
              onMouseDown={(e) => handleMouseDown(e, 'rotate')}
              style={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 12,
                height: 12,
                background: '#00ffa2',
                borderRadius: '50%',
                cursor: 'alias',
                pointerEvents: 'auto',
                boxShadow: '0 0 10px rgba(0, 255, 162, 0.6)'
              }}
            />
            {/* Линия к кнопке поворота */}
            <div style={{
              position: 'absolute',
              top: -18,
              left: '50%',
              width: 1,
              height: 16,
              background: '#00ffa2',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }} />
            {/* Углы resize */}
            {['nw', 'ne', 'sw', 'se'].map(corner => (
              <div
                key={corner}
                onMouseDown={(e) => handleMouseDown(e, 'resize', corner)}
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  background: '#0a0a0a',
                  border: '1px solid #00ffa2',
                  pointerEvents: 'auto',
                  cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                  ...(corner === 'nw' && { top: -4, left: -4 }),
                  ...(corner === 'ne' && { top: -4, right: -4 }),
                  ...(corner === 'sw' && { bottom: -4, left: -4 }),
                  ...(corner === 'se' && { bottom: -4, right: -4 })
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Контекстное меню */}
      {contextMenu && createPortal(
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
            onClick={() => setContextMenu(null)} 
          />
          <div 
            ref={contextMenuRef} 
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              minWidth: 180,
              background: 'rgba(15, 15, 15, 0.8)',
              backdropFilter: 'blur(12px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 10000,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              animation: 'menuShow 0.15s cubic-bezier(0, 0, 0.2, 1)'
            }}
          >
            <button 
              onClick={() => { onDuplicate(layer.id); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.DuplicateIcon /> <span>Дублировать</span>
            </button>
            <button 
              onClick={() => { onChangeLayer({ flipX: !layer.flipX }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.FlipHorizontalIcon /> <span>Отразить</span>
            </button>
            <button 
              onClick={() => { onChangeLayer({ locked: !layer.locked }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              {layer.locked ? <Icons.UnlockIcon /> : <Icons.LockIcon />}
              <span>{layer.locked ? 'Разблокировать' : 'Заблокировать'}</span>
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }} />
            <button 
              onClick={() => { onDelete(layer.id); setContextMenu(null); }}
              className="video-ctx-menu-item video-ctx-menu-danger"
            >
              <Icons.DeleteIcon /> <span>Удалить</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

