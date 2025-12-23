import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Хук для обработки перемещения, масштабирования и вращения текстового слоя
 * ВАЖНО: 
 * - Drag меняет ТОЛЬКО позицию (x, y)
 * - Resize меняет ТОЛЬКО fontSize (без scale transform)
 * - Rotate меняет ТОЛЬКО rotation
 * - Поддержка TOUCH событий для мобильных
 */
export function useTextTransform(layer, onChangeLayer, canvasRef, isSpacePressed = false) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)
  
  const dragStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 })
  const resizeStartRef = useRef({ 
    clientX: 0, clientY: 0, 
    fontSize: 48, 
    centerX: 0, centerY: 0
  })
  const rotateStartRef = useRef({ 
    rotation: 0,
    centerX: 0, centerY: 0,
    startAngle: 0
  })

  // Получаем позицию мыши/touch относительно холста (в процентах)
  const getCanvasPosition = useCallback((e) => {
    if (!canvasRef?.current) return { x: 50, y: 50 }
    const rect = canvasRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return { x: 50, y: 50 }
    
    // Поддержка touch событий
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    }
  }, [canvasRef])

  // Начало перемещения - ТОЛЬКО позиция (mouse + touch)
  const handleMoveStart = useCallback((e) => {
    if (!layer || !onChangeLayer || !layer.id) return
    if (isSpacePressed) return
    if (layer.locked) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const pos = getCanvasPosition(e)
    const transformData = layer.transform || {}
    const currentX = transformData.x ?? layer.x ?? 50
    const currentY = transformData.y ?? layer.y ?? 50
    
    dragStartRef.current = {
      x: pos.x,
      y: pos.y,
      layerX: currentX,
      layerY: currentY
    }
    setIsDragging(true)
  }, [layer, onChangeLayer, getCanvasPosition, isSpacePressed])

  // Touch версия handleMoveStart
  const handleTouchMoveStart = useCallback((e) => {
    if (!layer || !onChangeLayer || !layer.id) return
    if (layer.locked) return
    if (e.touches.length !== 1) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const pos = getCanvasPosition(e)
    const transformData = layer.transform || {}
    const currentX = transformData.x ?? layer.x ?? 50
    const currentY = transformData.y ?? layer.y ?? 50
    
    dragStartRef.current = {
      x: pos.x,
      y: pos.y,
      layerX: currentX,
      layerY: currentY
    }
    setIsDragging(true)
  }, [layer, onChangeLayer, getCanvasPosition])

  // Обработка drag - ТОЛЬКО позиция
  useEffect(() => {
    if (!isDragging) return
    if (isSpacePressed) {
      setIsDragging(false)
      return
    }

    const handleMouseMove = (e) => {
      if (isSpacePressed) return
      if (!layer || !onChangeLayer || !layer.id) return

      const pos = getCanvasPosition(e)
      const deltaX = pos.x - dragStartRef.current.x
      const deltaY = pos.y - dragStartRef.current.y

      // Перемещение - ТОЛЬКО x, y. Никаких других свойств!
      const newX = dragStartRef.current.layerX + deltaX
      const newY = dragStartRef.current.layerY + deltaY
      
      const currentTransform = layer.transform || {}
      onChangeLayer({
        transform: {
          ...currentTransform,
          x: newX,
          y: newY
        }
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleMouseMove, { passive: false })
    window.addEventListener('touchend', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, layer, onChangeLayer, getCanvasPosition, isSpacePressed])

  // Начало resize
  const handleResizeStart = useCallback((e, handle) => {
    if (!layer || !onChangeLayer || !layer.id) return
    if (layer.locked) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = canvasRef?.current?.getBoundingClientRect()
    if (!rect) return
    
    const transformData = layer.transform || {}
    const currentX = transformData.x !== undefined ? transformData.x : (layer.x ?? 50)
    const currentY = transformData.y !== undefined ? transformData.y : (layer.y ?? 50)
    
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      fontSize: layer.fontSize || 48,
      layerX: currentX,
      layerY: currentY,
      centerX: rect.left + (currentX / 100) * rect.width,
      centerY: rect.top + (currentY / 100) * rect.height
    }
    
    setResizeHandle(handle)
    setIsResizing(true)
  }, [layer, onChangeLayer, canvasRef])

  // Начало rotate
  const handleRotateStart = useCallback((e) => {
    if (!layer || !onChangeLayer || !layer.id) return
    if (layer.locked) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = canvasRef?.current?.getBoundingClientRect()
    if (!rect) return
    
    const transformData = layer.transform || {}
    const currentX = transformData.x !== undefined ? transformData.x : (layer.x ?? 50)
    const currentY = transformData.y !== undefined ? transformData.y : (layer.y ?? 50)
    const currentRotation = transformData.rotation ?? (layer.rotation ?? 0)
    
    const centerX = rect.left + (currentX / 100) * rect.width
    const centerY = rect.top + (currentY / 100) * rect.height
    
    rotateStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      rotation: currentRotation,
      centerX,
      centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
    }
    
    setIsRotating(true)
  }, [layer, onChangeLayer, canvasRef])

  // Обработка resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      if (!layer || !onChangeLayer) return
      
      const { clientX: startX, clientY: startY, fontSize: startFontSize, centerX, centerY } = resizeStartRef.current
      
      // Вычисляем расстояние от центра до мыши
      const startDist = Math.sqrt(
        Math.pow(startX - centerX, 2) + Math.pow(startY - centerY, 2)
      )
      const currentDist = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      )
      
      if (startDist === 0) return
      
      // Пропорциональное изменение fontSize
      const scale = currentDist / startDist
      const newFontSize = Math.max(12, Math.min(500, Math.round(startFontSize * scale)))
      
      // Обновляем только fontSize - БЕЗ scale transform
      onChangeLayer({ fontSize: newFontSize })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, layer, onChangeLayer])

  // Обработка rotate
  useEffect(() => {
    if (!isRotating) return

    const handleMouseMove = (e) => {
      if (!layer || !onChangeLayer) return
      
      const { centerX, centerY, rotation: startRotation, startAngle } = rotateStartRef.current
      
      // Вычисляем текущий угол
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      const deltaAngle = currentAngle - startAngle
      
      let newRotation = startRotation + deltaAngle
      
      // Snap к 0, 90, 180, 270 при зажатом Shift
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 45) * 45
      }
      
      // Нормализуем угол
      while (newRotation < -180) newRotation += 360
      while (newRotation > 180) newRotation -= 360
      
      const currentTransform = layer.transform || {}
      onChangeLayer({
        transform: {
          ...currentTransform,
          rotation: newRotation
        }
      })
    }

    const handleMouseUp = () => {
      setIsRotating(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isRotating, layer, onChangeLayer])

  return {
    handleMoveStart,
    handleTouchMoveStart,
    handleResizeStart,
    handleRotateStart,
    isDragging,
    isResizing,
    isRotating
  }
}


