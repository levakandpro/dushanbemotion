// src/editorV2/timeline/text/TextClipItem.jsx

import React, { useState, useRef, useEffect } from 'react'

export default function TextClipItem({
  clip,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onMove,
  onTrimStart,
  onTrimEnd,
  isPanningTimeline = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isTrimmingStart, setIsTrimmingStart] = useState(false)
  const [isTrimmingEnd, setIsTrimmingEnd] = useState(false)
  const dragStartRef = useRef(null)

  const left = clip.startTime * pixelsPerSecond
  const width = (clip.endTime - clip.startTime) * pixelsPerSecond

  const handleMouseDown = (e, action) => {
    e.stopPropagation()

    // Если включена панорама таймлайна - не обрабатываем drag клипа
    if (isPanningTimeline) return

    if (action === 'body') {
      setIsDragging(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: clip.startTime,
      }
      onSelect(clip.id, e)
    } else if (action === 'trimStart') {
      setIsTrimmingStart(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipStart: clip.startTime,
      }
    } else if (action === 'trimEnd') {
      setIsTrimmingEnd(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        clipEnd: clip.endTime,
      }
    }
  }

  useEffect(() => {
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
        onMove(clip.id, newStartTime)
      } else if (isTrimmingStart) {
        const newStartTime = dragStartRef.current.clipStart + deltaTime
        onTrimStart(clip.id, newStartTime)
      } else if (isTrimmingEnd) {
        const newEndTime = dragStartRef.current.clipEnd + deltaTime
        onTrimEnd(clip.id, newEndTime)
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
  }, [isDragging, isTrimmingStart, isTrimmingEnd, clip.id, pixelsPerSecond, onMove, onTrimStart, onTrimEnd, isPanningTimeline])

  return (
    <div
      className={`text-clip-item ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
        height: '18px',
        top: '7px',
        background: isSelected ? 'var(--dm-accent-soft)' : 'rgba(0, 0, 0, 0.5)',
        border: isSelected ? '2px solid var(--dm-accent)' : '1px solid var(--dm-border-soft)',
        borderRadius: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging || isTrimmingStart || isTrimmingEnd ? 'none' : 'all 0.12s ease',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'body')}
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
          width: '6px',
          cursor: 'ew-resize',
          background: 'rgba(255, 255, 255, 0.12)',
        }}
      />

      {/* Тело клипа */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          right: '8px',
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          fontSize: '9px',
          color: 'var(--dm-text)',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Текст
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
          width: '6px',
          cursor: 'ew-resize',
          background: 'rgba(255, 255, 255, 0.12)',
        }}
      />
    </div>
  )
}


