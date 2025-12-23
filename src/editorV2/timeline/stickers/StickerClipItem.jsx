// src/editorV2/timeline/stickers/StickerClipItem.jsx
import React, { useState, useRef } from 'react'

export default function StickerClipItem({
  clip,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onMove,
  onTrimStart,
  onTrimEnd,
  onDelete,
  onContextMenu,
  snapOptions,
  isLocked = false,
  isPanningTimeline = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isTrimmingStart, setIsTrimmingStart] = useState(false)
  const [isTrimmingEnd, setIsTrimmingEnd] = useState(false)
  const [isDraggingInTransition, setIsDraggingInTransition] = useState(false)
  const [isDraggingOutTransition, setIsDraggingOutTransition] = useState(false)
  const dragStartRef = useRef(null)

  const left = clip.startTime * pixelsPerSecond
  const width = (clip.endTime - clip.startTime) * pixelsPerSecond
  
  // Вычисляем позиции маркеров анимации
  const inTransitionWidth = (clip.inDuration || 0) * pixelsPerSecond
  const outTransitionWidth = (clip.outDuration || 0) * pixelsPerSecond

  const handleMouseDown = (e, action) => {
    e.stopPropagation()
    
    // Если включена панорама таймлайна - не обрабатываем drag клипа
    if (isPanningTimeline) return
    
    if (isLocked && action !== 'body') return // Заблокировано - только выбор
    
    if (action === 'body') {
      if (!isLocked) {
        setIsDragging(true)
        dragStartRef.current = {
          mouseX: e.clientX,
          clipStart: clip.startTime
        }
      }
      onSelect(clip.id, e) // Передаём событие для проверки Alt
    } else if (action === 'trimStart') {
      setIsTrimmingStart(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: clip.startTime
      }
    } else if (action === 'trimEnd') {
      setIsTrimmingEnd(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipEnd: clip.endTime
      }
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    onSelect(clip.id, e)
    
    if (onContextMenu) {
      onContextMenu(clip.id, { x: e.clientX, y: e.clientY })
    }
  }

  React.useEffect(() => {
    if (!isDragging && !isTrimmingStart && !isTrimmingEnd) return
    if (isPanningTimeline) {
      // Если включена панорама - сбрасываем drag
      setIsDragging(false)
      setIsTrimmingStart(false)
      setIsTrimmingEnd(false)
      dragStartRef.current = null
      return
    }

    const handleMouseMove = (e) => {
      if (isPanningTimeline) return
      if (!dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.mouseX
      const deltaTime = deltaX / pixelsPerSecond

      if (isDragging) {
        const newStartTime = dragStartRef.current.clipStart + deltaTime
        onMove(clip.id, newStartTime, snapOptions)
      } else if (isTrimmingStart) {
        const newStartTime = dragStartRef.current.clipStart + deltaTime
        onTrimStart(clip.id, newStartTime, snapOptions)
      } else if (isTrimmingEnd) {
        const newEndTime = dragStartRef.current.clipEnd + deltaTime
        onTrimEnd(clip.id, newEndTime, snapOptions)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsTrimmingStart(false)
      setIsTrimmingEnd(false)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isTrimmingStart, isTrimmingEnd, clip.id, pixelsPerSecond, onMove, onTrimStart, onTrimEnd, snapOptions, isPanningTimeline])

  return (
    <div
      className={`sticker-clip-item ${isSelected ? 'selected' : ''} ${clip.hidden ? 'hidden' : ''} ${isLocked ? 'locked' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
        height: '18px',
        top: '7px',
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(123, 92, 255, 0.8), rgba(88, 101, 242, 0.7))'
          : 'linear-gradient(135deg, rgba(123, 92, 255, 0.6), rgba(88, 101, 242, 0.5))',
        border: isSelected ? '2px solid rgba(123, 92, 255, 1)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        cursor: isLocked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        opacity: clip.hidden ? 0.4 : 1,
        transition: isDragging || isTrimmingStart || isTrimmingEnd ? 'none' : 'all 0.15s ease',
        userSelect: 'none',
        boxShadow: isSelected 
          ? '0 4px 12px rgba(123, 92, 255, 0.4)' 
          : '0 2px 6px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'body')}
      onContextMenu={handleContextMenu}
    >
      {/* Левый тример */}
      <div
        className="clip-trim-handle clip-trim-start"
        onMouseDown={(e) => handleMouseDown(e, 'trimStart')}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRight: '2px solid rgba(255, 255, 255, 0.5)',
          zIndex: 2
        }}
      />

      {/* Тело клипа */}
      <div style={{
        padding: '4px 12px',
        fontSize: '11px',
        color: 'white',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
      }}>
        Стикер
      </div>

      {/* Правый тример */}
      <div
        className="clip-trim-handle clip-trim-end"
        onMouseDown={(e) => handleMouseDown(e, 'trimEnd')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize',
          background: 'rgba(255, 255, 255, 0.2)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.5)',
          zIndex: 2
        }}
      />

      {/* Иконка стикера */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '18px',
        opacity: 0.5,
        pointerEvents: 'none'
      }}>
        {isLocked ? '🔒' : '🎨'}
      </div>

      {/* Маркер анимации входа */}
      {inTransitionWidth > 0 && (
        <div
          className="transition-marker transition-in"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${inTransitionWidth}px`,
            background: 'linear-gradient(90deg, rgba(123, 255, 92, 0.3), transparent)',
            borderRight: '2px solid rgba(123, 255, 92, 0.6)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            left: 2,
            top: 2,
            fontSize: '10px',
            color: 'rgba(123, 255, 92, 1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            в–¶
          </div>
        </div>
      )}

      {/* Маркер анимации выхода */}
      {outTransitionWidth > 0 && (
        <div
          className="transition-marker transition-out"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${outTransitionWidth}px`,
            background: 'linear-gradient(90deg, transparent, rgba(255, 92, 92, 0.3))',
            borderLeft: '2px solid rgba(255, 92, 92, 0.6)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            right: 2,
            top: 2,
            fontSize: '10px',
            color: 'rgba(255, 92, 92, 1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            в-Ђ
          </div>
        </div>
      )}
    </div>
  )
}

