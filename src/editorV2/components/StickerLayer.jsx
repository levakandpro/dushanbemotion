import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as Icons from './ContextMenuIcons'
import s from './StickerLayer.module.css' // Рекомендую перейти на модули для чистоты

export default function StickerLayer({ 
  layer, isSelected, onSelect, onChangeLayer, onDelete, onDuplicate,
  onBringForward, onSendBackward, onSendToBack, canvasRef,
  isSpacePressed = false, zoom = 1
}) {
  const imgRef = useRef(null)
  const contextMenuRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [interaction, setInteraction] = useState({ type: null, start: null })

  const objectFit = layer?.fit === 'contain' ? 'contain' : 'cover'

  // --- ЛОГИКА КОНТЕКСТНОГО МЕНЮ ---
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

  // --- ОБРАБОТКА ТРАНСФОРМАЦИЙ (DRAG / RESIZE / ROTATE) ---
  const handleMouseDown = (e, type = 'drag', corner = null) => {
    e.stopPropagation()
    if (isSpacePressed || (layer.locked && type !== 'context')) return
    
    onSelect(layer.id)
    if (layer.locked) return

    const canvas = canvasRef?.current?.getBoundingClientRect()
    if (!canvas) return

    // Поддержка touch событий
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    setInteraction({
      type,
      start: {
        mouseX: clientX,
        mouseY: clientY,
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

  // Touch версия
  const handleTouchStart = (e, type = 'drag', corner = null) => {
    if (e.touches.length !== 1) return
    e.preventDefault()
    handleMouseDown(e, type, corner)
  }

  useEffect(() => {
    if (!interaction.type) return

    const handleMouseMove = (e) => {
      const { type, start } = interaction
      const z = zoom || 1
      const dx = (e.clientX - start.mouseX) / z
      const dy = (e.clientY - start.mouseY) / z

      if (type === 'drag') {
        onChangeLayer({
          x: start.layerX + (dx / start.canvas.width) * 100,
          y: start.layerY + (dy / start.canvas.height) * 100
        })
      } 
      else if (type === 'resize') {
        const ar = start.width / start.height
        const factor = start.corner.includes('e') ? 1 : -1
        const newWidth = Math.max(30, start.width + dx * factor)
        onChangeLayer({ width: newWidth, height: newWidth / ar })
      }
      else if (type === 'rotate') {
        const rect = imgRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
        onChangeLayer({ rotation: angle + 90 }) 
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      const { type, start } = interaction
      const z = zoom || 1
      const dx = (touch.clientX - start.mouseX) / z
      const dy = (touch.clientY - start.mouseY) / z

      if (type === 'drag') {
        onChangeLayer({
          x: start.layerX + (dx / start.canvas.width) * 100,
          y: start.layerY + (dy / start.canvas.height) * 100
        })
      } 
      else if (type === 'resize') {
        const ar = start.width / start.height
        const factor = start.corner.includes('e') ? 1 : -1
        const newWidth = Math.max(30, start.width + dx * factor)
        onChangeLayer({ width: newWidth, height: newWidth / ar })
      }
    }

    const handleMouseUp = () => setInteraction({ type: null, start: null })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [interaction, onChangeLayer, zoom])

  // --- СТИЛИ И ФИЛЬТРЫ ---
  const filterString = useMemo(() => {
    const f = layer.filters || {}
    const parts = [
      f.brightness !== 100 && `brightness(${f.brightness}%)`,
      f.contrast !== 100 && `contrast(${f.contrast}%)`,
      f.saturation !== 100 && `saturate(${f.saturation}%)`,
      f.blur > 0 && `blur(${f.blur}px)`,
      layer.glowRadius > 0 && `drop-shadow(0 0 ${layer.glowRadius}px ${layer.glowColor})`
    ].filter(Boolean).join(' ')
    return parts || 'none'
  }, [layer.filters, layer.glowRadius, layer.glowColor])

  return (
    <>
      <div
        ref={imgRef}
        onMouseDown={(e) => handleMouseDown(e)}
        onTouchStart={(e) => handleTouchStart(e)}
        onContextMenu={handleContextMenu}
        className={`${s.layer} ${isSelected ? s.selected : ''} ${layer.locked ? s.locked : ''}`}
        style={{
          left: `${layer.x}%`,
          top: `${layer.y}%`,
          width: layer.width,
          height: layer.height,
          transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scaleX(${layer.flipX ? -1 : 1})`,
          opacity: layer.opacity,
          zIndex: layer.zIndex,
          mixBlendMode: layer.blendMode || 'normal'
        }}
      >
        <img 
          src={layer.imageUrl} 
          alt="" 
          style={{ filter: filterString, objectFit, objectPosition: 'center' }} 
          className={s.image} 
          draggable={false} 
        />

        {/* Элементы управления: только когда выбрано и не заблокировано */}
        {isSelected && !layer.locked && (
          <div className={s.controls}>
            <div className={s.rotateBtn} onMouseDown={(e) => handleMouseDown(e, 'rotate')} />
            {['nw', 'ne', 'sw', 'se'].map(c => (
              <div key={c} className={`${s.resizeHandle} ${s[c]}`} onMouseDown={(e) => handleMouseDown(e, 'resize', c)} />
            ))}
          </div>
        )}
      </div>

      {contextMenu && createPortal(
        <>
          <div className={s.menuBackdrop} onClick={() => setContextMenu(null)} />
          <div ref={contextMenuRef} className={s.glassMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button onClick={() => { onDuplicate(layer.id); setContextMenu(null); }} className={s.menuItem}>
              <Icons.DuplicateIcon /> <span>Дублировать</span>
            </button>
            <button onClick={() => { onChangeLayer({ locked: !layer.locked }); setContextMenu(null); }} className={s.menuItem}>
              {layer.locked ? <Icons.UnlockIcon /> : <Icons.LockIcon />} 
              <span>{layer.locked ? 'Разблокировать' : 'Заблокировать'}</span>
            </button>
            <div className={s.divider} />
            <button onClick={() => { onDelete(layer.id); setContextMenu(null); }} className={`${s.menuItem} ${s.danger}`}>
              <Icons.DeleteIcon /> <span>Удалить</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}