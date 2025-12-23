// ============================================================================
// D MOTION - МОБИЛЬНЫЕ ЖЕСТЫ (СВАЙПЫ)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Хук для определения мобильного устройства
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Хук для свайпов назад/вперёд
 */
export function useSwipeNavigation(options = {}) {
  const {
    threshold = 100,      // Минимальное расстояние свайпа
    velocityThreshold = 0.3, // Минимальная скорость
    edgeWidth = 30,       // Ширина зоны от края для начала свайпа
    enabled = true
  } = options

  const navigate = useNavigate()
  const touchStartRef = useRef(null)
  const touchMoveRef = useRef(null)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      const isLeftEdge = touch.clientX < edgeWidth
      const isRightEdge = touch.clientX > window.innerWidth - edgeWidth

      if (isLeftEdge || isRightEdge) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          edge: isLeftEdge ? 'left' : 'right'
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Игнорируем вертикальные свайпы
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartRef.current = null
        setSwipeProgress(0)
        setSwipeDirection(null)
        return
      }

      touchMoveRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      // Свайп вправо от левого края = назад
      if (touchStartRef.current.edge === 'left' && deltaX > 0) {
        const progress = Math.min(deltaX / threshold, 1)
        setSwipeProgress(progress)
        setSwipeDirection('back')
        
        if (progress > 0.3) {
          e.preventDefault()
        }
      }
      // Свайп влево от правого края = вперёд
      else if (touchStartRef.current.edge === 'right' && deltaX < 0) {
        const progress = Math.min(Math.abs(deltaX) / threshold, 1)
        setSwipeProgress(progress)
        setSwipeDirection('forward')
        
        if (progress > 0.3) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchMoveRef.current) {
        touchStartRef.current = null
        touchMoveRef.current = null
        setSwipeProgress(0)
        setSwipeDirection(null)
        return
      }

      const deltaX = touchMoveRef.current.x - touchStartRef.current.x
      const deltaTime = touchMoveRef.current.time - touchStartRef.current.time
      const velocity = Math.abs(deltaX) / deltaTime

      // Проверяем условия для навигации
      if (Math.abs(deltaX) >= threshold || velocity >= velocityThreshold) {
        if (swipeDirection === 'back') {
          navigate(-1)
        } else if (swipeDirection === 'forward') {
          navigate(1)
        }
      }

      touchStartRef.current = null
      touchMoveRef.current = null
      setSwipeProgress(0)
      setSwipeDirection(null)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, velocityThreshold, edgeWidth, navigate, swipeDirection])

  return { swipeProgress, swipeDirection }
}

/**
 * Хук для свайпа панели вниз (закрытие)
 */
export function useSwipeToClose(onClose, options = {}) {
  const {
    threshold = 100,
    enabled = true
  } = options

  const ref = useRef(null)
  const touchStartRef = useRef(null)
  const [dragOffset, setDragOffset] = useState(0)

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        y: touch.clientY,
        scrollTop: element.scrollTop
      }
    }

    const handleTouchMove = (e) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      const deltaY = touch.clientY - touchStartRef.current.y

      // Только если прокрутка вверху и тянем вниз
      if (touchStartRef.current.scrollTop <= 0 && deltaY > 0) {
        e.preventDefault()
        setDragOffset(Math.min(deltaY, 200))
      }
    }

    const handleTouchEnd = () => {
      if (dragOffset >= threshold) {
        onClose()
      }
      setDragOffset(0)
      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onClose, dragOffset])

  return { ref, dragOffset }
}

/**
 * Хук для горизонтального свайпа между табами
 */
export function useSwipeTabs(tabs, currentIndex, onChange, options = {}) {
  const {
    threshold = 50,
    enabled = true
  } = options

  const ref = useRef(null)
  const touchStartRef = useRef(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }
    }

    const handleTouchMove = (e) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Игнорируем вертикальные свайпы
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return
      }

      e.preventDefault()
      setSwipeOffset(deltaX)
    }

    const handleTouchEnd = () => {
      if (!touchStartRef.current) return

      if (swipeOffset < -threshold && currentIndex < tabs.length - 1) {
        onChange(currentIndex + 1)
      } else if (swipeOffset > threshold && currentIndex > 0) {
        onChange(currentIndex - 1)
      }

      setSwipeOffset(0)
      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, tabs.length, currentIndex, onChange, swipeOffset])

  return { ref, swipeOffset }
}

/**
 * Хук для pull-to-refresh
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    enabled = true
  } = options

  const ref = useRef(null)
  const touchStartRef = useRef(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleTouchStart = (e) => {
      if (element.scrollTop <= 0) {
        touchStartRef.current = {
          y: e.touches[0].clientY
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!touchStartRef.current || isRefreshing) return

      const deltaY = e.touches[0].clientY - touchStartRef.current.y

      if (deltaY > 0 && element.scrollTop <= 0) {
        e.preventDefault()
        setPullDistance(Math.min(deltaY * 0.5, 120))
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onRefresh, pullDistance, isRefreshing])

  return { ref, pullDistance, isRefreshing }
}

/**
 * Хук для предотвращения bounce на iOS
 */
export function usePreventBounce() {
  useEffect(() => {
    const preventBounce = (e) => {
      const target = e.target
      
      // Разрешаем скролл внутри scrollable элементов
      let scrollable = target
      while (scrollable && scrollable !== document.body) {
        const style = window.getComputedStyle(scrollable)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          const isAtTop = scrollable.scrollTop <= 0
          const isAtBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight
          
          if ((isAtTop && e.touches[0].clientY > e.touches[0].clientY) ||
              (isAtBottom && e.touches[0].clientY < e.touches[0].clientY)) {
            return
          }
          return
        }
        scrollable = scrollable.parentElement
      }
      
      e.preventDefault()
    }

    document.addEventListener('touchmove', preventBounce, { passive: false })
    return () => document.removeEventListener('touchmove', preventBounce)
  }, [])
}

export default {
  useIsMobile,
  useSwipeNavigation,
  useSwipeToClose,
  useSwipeTabs,
  usePullToRefresh,
  usePreventBounce
}
