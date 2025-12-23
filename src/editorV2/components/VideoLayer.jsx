// src/editorV2/components/VideoLayer.jsx
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Icons from './ContextMenuIcons'

export default function VideoLayer({ 
  layer, 
  isSelected, 
  onSelect, 
  onChangeLayer,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  canvasRef,
  isSpacePressed = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [resizeStart, setResizeStart] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const didDragRef = useRef(false) // Флаг, что был drag (чтобы не запускать play/pause после drag)
  const videoRef = useRef(null)
  const contextMenuRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [isRotating, setIsRotating] = useState(false)
  const [rotateStart, setRotateStart] = useState(null)

  if (!layer || !layer.srcHd) return null

  const effects = layer.effects || {}

  const shouldContain = layer.objectFit === 'contain' || layer.subType === 'premium'

  // При выборе видео растягиваем на весь канвас с небольшим запасом (cover)
  useEffect(() => {
    if (!isSelected || !canvasRef?.current || !onChangeLayer) return

    // Находим canvas-frame для получения реальных размеров канваса
    const canvasFrame = canvasRef.current.closest('.editor-v2-canvas-frame')
    if (!canvasFrame) return
    
    const rect = canvasFrame.getBoundingClientRect()
    const canvasWidth = rect.width
    const canvasHeight = rect.height

    const baseW = layer.width || 1920
    const baseH = layer.height || 1080

    if (shouldContain) {
      // contain: вписываем видео в канвас без кропа
      const padding = 0.98
      const targetW = canvasWidth * padding
      const targetH = canvasHeight * padding

      const scaleX = targetW / baseW
      const scaleY = targetH / baseH
      const newScale = Math.min(scaleX, scaleY)

      if (Number.isFinite(newScale) && Math.abs((layer.scale || 1) - newScale) > 0.001) {
        onChangeLayer({
          scale: newScale,
          x: 50,
          y: 50,
        })
      }
      return
    }

    // cover: заполняем весь канвас (может кропать)
    if (isSelected && canvasRef?.current && onChangeLayer) {
      // Находим canvas-frame для получения реальных размеров канваса
      const canvasFrame = canvasRef.current.closest('.editor-v2-canvas-frame')
      if (!canvasFrame) return
      
      const rect = canvasFrame.getBoundingClientRect()
      const canvasWidth = rect.width
      const canvasHeight = rect.height
      
      // Проверяем, нужно ли обновить размер
      const currentWidth = (layer.width || 1920) * (layer.scale || 1)
      const currentHeight = (layer.height || 1080) * (layer.scale || 1)
      
      // Добавляем небольшой запас (2%) чтобы гарантированно заполнить весь канвас
      const padding = 1.02
      const paddedWidth = canvasWidth * padding
      const paddedHeight = canvasHeight * padding
      
      // Если размер не совпадает с канвасом, растягиваем с запасом (cover)
      if (Math.abs(currentWidth - paddedWidth) > 1 || Math.abs(currentHeight - paddedHeight) > 1) {
        const videoAspectRatio = (layer.width || 1920) / (layer.height || 1080)
        const canvasAspectRatio = canvasWidth / canvasHeight
        
        let newScale
        
        // Используем cover - выбираем больший масштаб с запасом, чтобы заполнить весь канвас
        if (canvasAspectRatio > videoAspectRatio) {
          // Канвас шире - подгоняем по высоте с запасом
          newScale = paddedHeight / (layer.height || 1080)
        } else {
          // Канвас выше - подгоняем по ширине с запасом
          newScale = paddedWidth / (layer.width || 1920)
        }
        
        onChangeLayer({
          scale: newScale,
          x: 50,
          y: 50
        })
      }
    }
  }, [isSelected, canvasRef, layer.width, layer.height, layer.scale, onChangeLayer, shouldContain])

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

  // Поворот
  const handleRotateStart = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (layer.locked) return
    
    const canvas = canvasRef?.current
    if (!canvas) return
    
    setRotateStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startRotation: layer.rotation || 0
    })
    setIsRotating(true)
  }

  useEffect(() => {
    if (!isRotating || !rotateStart) return

    const handleMouseMove = (e) => {
      const canvas = canvasRef?.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.left + (layer.x / 100) * rect.width
      const centerY = rect.top + (layer.y / 100) * rect.height
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      onChangeLayer({ rotation: angle + 90 })
    }

    const handleMouseUp = () => {
      setIsRotating(false)
      setRotateStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isRotating, rotateStart, layer.x, layer.y, onChangeLayer, canvasRef])

  // Обработчик клика для play/pause
  const handleVideoClick = (e) => {
    // Если был drag - не обрабатываем клик (чтобы не запускать play/pause после перетаскивания)
    if (didDragRef.current) {
      didDragRef.current = false // Сбрасываем флаг
      return
    }
    
    // Если идет drag или resize - не обрабатываем клик
    if (isDragging || isResizing) return
    
    // Если кликнули на handle - не обрабатываем
    if (e.target.classList.contains('video-resize-handle')) {
      return
    }
    
    e.stopPropagation()
    
    if (!videoRef.current) return
    
    // Переключаем play/pause
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch((err) => {
        console.warn('Failed to play video:', err)
      })
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleMouseDown = (e) => {
    e.stopPropagation()
    
    // Если зажат Space - не обрабатываем drag слоя
    if (isSpacePressed) return
    
    onSelect(layer.id)
    
    if (layer.locked) return
    
    // Проверяем, не кликнули ли на handle
    if (e.target.classList.contains('video-resize-handle')) {
      return
    }
    
    // Сбрасываем флаг drag при начале mousedown
    didDragRef.current = false
    
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

  const handleResizeStart = (e, corner) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (layer.locked) return
    
    const canvas = canvasRef?.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const currentWidth = (layer.width || 1920) * (layer.scale || 1)
    const currentHeight = (layer.height || 1080) * (layer.scale || 1)
    const aspectRatio = (layer.width || 1920) / (layer.height || 1080)
    
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
      startScale: layer.scale || 1,
      startX: layer.x,
      startY: layer.y,
      corner,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      aspectRatio
    })
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isDragging || !dragStart) return

    const handleMouseMove = (e) => {
      const canvas = canvasRef?.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = dragStart.canvasWidth / rect.width
      const scaleY = dragStart.canvasHeight / rect.height

      const deltaX = (e.clientX - dragStart.mouseX) / scaleX
      const deltaY = (e.clientY - dragStart.mouseY) / scaleY

      // Если мышь сдвинулась больше чем на 3px - это drag, а не клик
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (distance > 3) {
        didDragRef.current = true
      }

      onChangeLayer({
        x: dragStart.layerX + deltaX,
        y: dragStart.layerY + deltaY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, onChangeLayer, canvasRef])

  useEffect(() => {
    if (!isResizing || !resizeStart) return

    const handleMouseMove = (e) => {
      if (!resizeStart || !onChangeLayer) return
      
      const canvas = canvasRef?.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = resizeStart.canvasWidth / rect.width
      const scaleY = resizeStart.canvasHeight / rect.height
      
      const dx = (e.clientX - resizeStart.mouseX) / scaleX
      const dy = (e.clientY - resizeStart.mouseY) / scaleY
      
      // Вычисляем изменение размера с учётом соотношения сторон
      const distance = Math.sqrt(dx * dx + dy * dy)
      const direction = (dx + dy) > 0 ? 1 : -1
      const scale = 1 + (direction * distance / 200)
      
      const newScale = Math.max(0.1, Math.min(5, resizeStart.startScale * scale))
      
      onChangeLayer({
        scale: newScale
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, onChangeLayer, canvasRef])

  // Вычисляем размеры с учетом scale
  const displayWidth = (layer.width || 1920) * (layer.scale || 1)
  const displayHeight = (layer.height || 1080) * (layer.scale || 1)

  // Применяем FX эффекты из fxStack
  const [fxFilterString, setFxFilterString] = React.useState('none')

  const effectiveLutStack = React.useMemo(() => {
    if (effects.lut) return [{ id: effects.lut, enabled: true, intensity: 1 }]
    return layer.lutStack
  }, [effects.lut, layer.lutStack])
  
  React.useEffect(() => {
    Promise.all([
      layer.fxStack && Array.isArray(layer.fxStack) && layer.fxStack.length > 0
        ? import('../fx/fxToCss').then(m => m.fxStackToCssFilter(layer.fxStack)).catch(() => 'none')
        : Promise.resolve('none'),
      effectiveLutStack && Array.isArray(effectiveLutStack) && effectiveLutStack.length > 0
        ? import('../luts/lutToCss').then(m => m.lutStackToCssFilter(effectiveLutStack)).catch(() => '')
        : Promise.resolve('')
    ]).then(([fxFilter, lutFilter]) => {
      const filters = [fxFilter !== 'none' ? fxFilter : '', lutFilter].filter(Boolean)
      setFxFilterString(filters.length > 0 ? filters.join(' ') : 'none')
    }).catch(e => {
      console.warn('Failed to load filters:', e)
      setFxFilterString('none')
    })
  }, [layer.fxStack, effectiveLutStack])

  // Premium effects -> css filters (approx)
  const extraParts = []
  const presetTemp = Number(effects.temperature || 0)
  const presetContrast = Number(effects.contrast || 0)
  const presetVibrance = Number(effects.vibrance || 0)
  const presetShadows = Number(effects.shadows || 0)
  const presetHighlights = Number(effects.highlights || 0)

  if (presetContrast) extraParts.push(`contrast(${(1 + presetContrast / 200).toFixed(3)})`)
  if (presetVibrance) extraParts.push(`saturate(${(1 + presetVibrance / 200).toFixed(3)})`)
  if (presetTemp) {
    const sep = Math.min(0.25, Math.max(0, presetTemp / 100 * 0.20))
    if (sep > 0) extraParts.push(`sepia(${Math.round(sep * 100)}%)`)
    extraParts.push(`hue-rotate(${(presetTemp * 0.25).toFixed(1)}deg)`)
  }
  if (presetShadows) extraParts.push(`brightness(${(1 + presetShadows / 400).toFixed(3)})`)
  if (presetHighlights) extraParts.push(`contrast(${(1 + presetHighlights / 500).toFixed(3)})`)

  if (effects.curveId === 'soft') extraParts.push('contrast(0.96)')
  else if (effects.curveId === 'contrast') extraParts.push('contrast(1.15)')
  else if (effects.curveId === 'fade') { extraParts.push('contrast(0.92)'); extraParts.push('brightness(1.04)') }

  const clarity = Number(effects.clarity || 0)
  const texture = Number(effects.texture || 0)
  if (clarity) extraParts.push(`contrast(${(1 + clarity / 250).toFixed(3)})`)
  if (texture) extraParts.push(`saturate(${(1 + texture / 300).toFixed(3)})`)

  if (effects.aiEnhanceApplied) {
    const cb = Number(effects.contrastBoost || 0)
    if (cb) extraParts.push(`contrast(${(1 + cb).toFixed(3)})`)
    extraParts.push('brightness(1.02)')
  }

  const cinematicBW = !!effects.cinematicBW
  if (cinematicBW) {
    extraParts.push('grayscale(100%)')
    extraParts.push('contrast(1.12)')
    extraParts.push('brightness(0.97)')
  }

  const vignetteEnabled = !!effects.vignette || !!layer.vignette?.enabled
  const fisheyeEnabled = !!effects.fisheye
  const fisheyeFilterId = `dm-fisheye-${layer.id}`

  const combinedFilter = [
    fisheyeEnabled ? `url(#${fisheyeFilterId})` : null,
    extraParts.length ? extraParts.join(' ') : null,
    fxFilterString !== 'none' ? fxFilterString : null
  ].filter(Boolean).join(' ')

  // Вычисляем transform с учетом flip
  const flipX = layer.flipX ? -1 : 1
  const flipY = layer.flipY ? -1 : 1
  const transformParts = [
    'translate(-50%, -50%)',
    `rotate(${layer.rotation || 0}deg)`,
    `scaleX(${flipX})`,
    `scaleY(${flipY})`
  ]

  const style = {
    position: 'absolute',
    left: `${layer.x || 50}%`,
    top: `${layer.y || 50}%`,
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    transform: transformParts.join(' '),
    opacity: layer.opacity !== undefined ? layer.opacity : 1,
    mixBlendMode: layer.blendMode || 'normal',
    pointerEvents: layer.locked ? 'none' : 'auto',
    cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : layer.locked ? 'default' : 'move',
    zIndex: layer.zIndex || 0,
    border: 'none',
    borderRadius: `${layer.cornerRadius || 0}px`,
    overflow: 'hidden',
    filter: combinedFilter || undefined,
    boxShadow: 'none',
    clipPath: 'inset(0)' // Обрезаем края, чтобы не было видно за границами
  }

  return (
    <>
      <div
        className={`video-layer ${isSelected ? 'video-layer-selected' : ''}`}
        style={style}
        onMouseDown={handleMouseDown}
        onClick={handleVideoClick}
        onContextMenu={handleContextMenu}
      >
        {/* Vignette overlay */}
        {vignetteEnabled && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: Math.max(0, Math.min(1, layer.vignette?.intensity ?? 0.35)),
              background: `radial-gradient(circle, rgba(0,0,0,0) ${(1 - (layer.vignette?.size ?? 0.55)) * 70}%, rgba(0,0,0,0.85) 100%)`,
              mixBlendMode: 'multiply',
              zIndex: 2
            }}
          />
        )}

        {/* Film wash overlay */}
        {(layer.filmWash > 0 || cinematicBW) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: Math.max(0, Math.min(0.25, layer.filmWash || 0.06)),
              background: 'linear-gradient(135deg, rgba(255, 210, 160, 0.18), rgba(160, 210, 255, 0.12))',
              mixBlendMode: 'overlay',
              zIndex: 2
            }}
          />
        )}

        {/* Film grain overlay */}
        {(layer.filmGrain > 0 || cinematicBW) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: Math.max(0, Math.min(0.35, layer.filmGrain || 0.08)),
              backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(%23n)' opacity='0.55'/></svg>`)}")`,
              backgroundSize: '220px 220px',
              mixBlendMode: 'overlay',
              zIndex: 2
            }}
          />
        )}

        <video
          ref={videoRef}
          src={layer.srcHd}
          style={{
            width: shouldContain ? '100%' : '102%',
            height: shouldContain ? '100%' : '102%',
            objectFit: shouldContain ? 'contain' : 'cover',
            objectPosition: layer.objectPosition || 'center',
            display: 'block',
            pointerEvents: 'none',
            marginLeft: shouldContain ? '0%' : '-1%',
            marginTop: shouldContain ? '0%' : '-1%'
          }}
          autoPlay={false}
          muted
          loop
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = layer.startTime || 0
              setIsPlaying(false) // Видео загружено, но не играет
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Overlay-иконка play когда paused */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 3,
              fontSize: '48px',
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              opacity: 0.85,
            }}
          >
            ▶
          </div>
        )}

        {/* SVG filter defs (fisheye-like) */}
        {fisheyeEnabled && (
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <filter id={fisheyeFilterId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        )}

        {/* Обводка и controls при выделении */}
        {isSelected && !layer.locked && (
          <div className="video-layer-controls" style={{
            position: 'absolute',
            inset: -2,
            border: '1px solid #00ffa2',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {/* Кнопка поворота */}
            <div 
              className="video-rotate-handle"
              onMouseDown={handleRotateStart}
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
              transform: 'translateX(-50%)'
            }} />
            {/* Углы resize */}
            {['nw', 'ne', 'sw', 'se'].map(corner => (
              <div
                key={corner}
                className="video-resize-handle"
                onMouseDown={(e) => handleResizeStart(e, corner)}
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
              onClick={() => { onChangeLayer({ effects: { ...effects, cinematicBW: !effects.cinematicBW } }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.GrayscaleIcon /> <span>{effects.cinematicBW ? 'Убрать ЧБ' : 'Сделать ЧБ'}</span>
            </button>
            <button 
              onClick={() => { onChangeLayer({ rotation: (layer.rotation || 0) + 90 }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.RotateIcon /> <span>Повернуть 90°</span>
            </button>
            <button 
              onClick={() => { onChangeLayer({ flipX: !layer.flipX }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.FlipHorizontalIcon /> <span>Отразить по горизонтали</span>
            </button>
            <button 
              onClick={() => { onChangeLayer({ flipY: !layer.flipY }); setContextMenu(null); }}
              className="video-ctx-menu-item"
            >
              <Icons.FlipVerticalIcon /> <span>Отразить по вертикали</span>
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
