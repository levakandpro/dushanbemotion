// ============================================================================
// D MOTION - PINCH TO ZOOM для Canvas (мировой уровень)
// ============================================================================

import { useEffect, useRef, useState } from 'react'

export function usePinchZoom(canvasRef, { minZoom = 0.5, maxZoom = 3, enabled = true } = {}) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const lastDistance = useRef(0)
  const lastCenter = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled || !canvasRef?.current) return

    const element = canvasRef.current

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        lastDistance.current = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        lastCenter.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        }
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        if (lastDistance.current > 0) {
          const delta = distance / lastDistance.current
          const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * delta))
          setZoom(newZoom)
        }

        lastDistance.current = distance
      }
    }

    const handleTouchEnd = () => {
      lastDistance.current = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, canvasRef, zoom, minZoom, maxZoom])

  return { zoom, offset, setZoom, setOffset }
}

