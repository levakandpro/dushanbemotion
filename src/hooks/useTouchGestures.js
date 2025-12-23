// ============================================================================
// D MOTION - TOUCH ЖЕСТЫ ДЛЯ ЭЛЕМЕНТОВ КАНВАСА
// Перемещение, resize, долгое нажатие = контекстное меню
// ============================================================================

import { useRef, useCallback, useEffect } from 'react'

/**
 * Хук для долгого нажатия (long press) = контекстное меню
 */
export function useLongPress(callback, delay = 500) {
  const timeoutRef = useRef(null)
  const targetRef = useRef(null)

  const start = useCallback((e) => {
    targetRef.current = e.target
    timeoutRef.current = setTimeout(() => {
      callback(e)
    }, delay)
  }, [callback, delay])

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  }
}

/**
 * Хук для touch drag (перемещение элемента)
 */
export function useTouchDrag(onDrag, onDragEnd) {
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const elementStartPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e, elementX, elementY) => {
    if (e.touches.length !== 1) return
    
    isDragging.current = true
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    elementStartPos.current = { x: elementX, y: elementY }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || e.touches.length !== 1) return

    const deltaX = e.touches[0].clientX - startPos.current.x
    const deltaY = e.touches[0].clientY - startPos.current.y

    onDrag?.({
      x: elementStartPos.current.x + deltaX,
      y: elementStartPos.current.y + deltaY,
      deltaX,
      deltaY
    })
  }, [onDrag])

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      onDragEnd?.()
    }
  }, [onDragEnd])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging: isDragging.current
  }
}

/**
 * Хук для pinch-to-zoom (resize двумя пальцами)
 */
export function usePinchZoom(onScale, onScaleEnd) {
  const initialDistance = useRef(0)
  const initialScale = useRef(1)

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e, currentScale = 1) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches)
      initialScale.current = currentScale
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialDistance.current > 0) {
      const currentDistance = getDistance(e.touches)
      const scale = (currentDistance / initialDistance.current) * initialScale.current
      onScale?.(Math.max(0.1, Math.min(5, scale)))
    }
  }, [onScale])

  const handleTouchEnd = useCallback(() => {
    initialDistance.current = 0
    onScaleEnd?.()
  }, [onScaleEnd])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

/**
 * Комбинированный хук для элементов канваса
 * - Одно касание: перемещение
 * - Два касания: resize
 * - Долгое нажатие: контекстное меню
 */
export function useCanvasElementTouch({
  onMove,
  onMoveEnd,
  onResize,
  onResizeEnd,
  onContextMenu,
  longPressDelay = 500
}) {
  const touchMode = useRef(null) // 'drag' | 'pinch' | null
  const longPressTimer = useRef(null)
  const startPos = useRef({ x: 0, y: 0 })
  const elementStart = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const initialPinchDistance = useRef(0)
  const hasMoved = useRef(false)

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchStart = useCallback((e, element) => {
    e.preventDefault?.()
    hasMoved.current = false

    if (e.touches.length === 1) {
      touchMode.current = 'drag'
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      elementStart.current = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      }

      // Long press для контекстного меню
      longPressTimer.current = setTimeout(() => {
        if (!hasMoved.current) {
          onContextMenu?.(e, element)
          touchMode.current = null
        }
      }, longPressDelay)

    } else if (e.touches.length === 2) {
      clearLongPress()
      touchMode.current = 'pinch'
      initialPinchDistance.current = getDistance(e.touches)
      elementStart.current = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      }
    }
  }, [onContextMenu, longPressDelay])

  const handleTouchMove = useCallback((e) => {
    if (!touchMode.current) return

    const moveThreshold = 10
    
    if (touchMode.current === 'drag' && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - startPos.current.x
      const deltaY = e.touches[0].clientY - startPos.current.y

      if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
        hasMoved.current = true
        clearLongPress()
      }

      onMove?.({
        x: elementStart.current.x + deltaX,
        y: elementStart.current.y + deltaY
      })

    } else if (touchMode.current === 'pinch' && e.touches.length === 2) {
      hasMoved.current = true
      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / initialPinchDistance.current

      onResize?.({
        width: elementStart.current.width * scale,
        height: elementStart.current.height * scale
      })
    }
  }, [onMove, onResize])

  const handleTouchEnd = useCallback(() => {
    clearLongPress()

    if (touchMode.current === 'drag') {
      onMoveEnd?.()
    } else if (touchMode.current === 'pinch') {
      onResizeEnd?.()
    }

    touchMode.current = null
  }, [onMoveEnd, onResizeEnd])

  // Cleanup
  useEffect(() => {
    return () => clearLongPress()
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

export default {
  useLongPress,
  useTouchDrag,
  usePinchZoom,
  useCanvasElementTouch
}
