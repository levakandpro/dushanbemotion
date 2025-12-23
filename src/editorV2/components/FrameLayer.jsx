// src/editorV2/components/FrameLayer.jsx
import React, { useRef, useState, useEffect } from 'react'

export default function FrameLayer({ 
  layer, 
  isSelected, 
  onSelect, 
  onChangeLayer,
  canvasRef,
  isSpacePressed = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [fxFilterString, setFxFilterString] = useState('none')

  if (!layer || !layer.src) return null

  // Логика перетаскивания (Drag & Drop)
  const handleMouseDown = (e) => {
    if (isSpacePressed || layer.locked) return
    e.stopPropagation()
    onSelect(layer.id)
    
    const canvas = canvasRef?.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging || !dragStart) return

    const handleMouseMove = (e) => {
      const dx = ((e.clientX - dragStart.mouseX) / dragStart.canvasWidth) * 100
      const dy = ((e.clientY - dragStart.mouseY) / dragStart.canvasHeight) * 100
      
      onChangeLayer(layer.id, {
        x: dragStart.layerX + dx,
        y: dragStart.layerY + dy
      })
    }

    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, layer.id, onChangeLayer])

  // Стиль самого слоя
  const style = {
    position: 'absolute',
    left: `${layer.x || 50}%`,
    top: `${layer.y || 50}%`,
    width: `${layer.width || 200}px`,
    height: `${layer.height || 200}px`,
    transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg)`,
    opacity: layer.opacity ?? 1,
    zIndex: layer.zIndex || 0,
    pointerEvents: layer.locked ? 'none' : 'auto',
    cursor: layer.locked ? 'default' : 'move',
    border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: isSelected ? '0 0 20px rgba(0, 255, 162, 0.3)' : 'none',
    transition: 'border 0.2s, box-shadow 0.2s'
  }

  return (
    <div
      className={`dm-frame-layer ${isSelected ? 'active' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={layer.src} 
        alt="" 
        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
      />
      
      {/* Маленький значок замочка, если слой нельзя двигать */}
      {layer.locked && (
        <div className="dm-layer-lock-indicator">🔒</div>
      )}
    </div>
  )
}