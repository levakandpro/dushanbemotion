import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IntroSplashContent from './IntroSplashContent.jsx'
import AuthModal from './AuthModal.jsx'

function IntroSplash({ onComplete }) {
  const [fading, setFading] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const swipeStartRef = useRef(null)
  const splashRef = useRef(null)
  const navigate = useNavigate()

  const handleButtonClick = () => {
    setFading(true)
    setTimeout(() => {
      // Переход в редактор - модал выбора фона откроется автоматически
      navigate('/editor?new=true')
    }, 250)
  }

  // Обработка свайпов для показа шапки и подвала
  useEffect(() => {
    let mouseDown = false
    let touchStartY = null
    let mouseStartY = null

    // Touch события (мобильные)
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY
        swipeStartRef.current = { y: touchStartY, time: Date.now() }
      }
    }

    const handleTouchMove = (e) => {
      if (!swipeStartRef.current || e.touches.length !== 1) return

      const currentY = e.touches[0].clientY
      const dy = currentY - swipeStartRef.current.y
      const threshold = 100

      // Свайп вниз - показать шапку, если скрыта, или скрыть шапку, если показана
      if (dy > threshold) {
        setHeaderVisible(!headerVisible)
        swipeStartRef.current = null
        touchStartY = null
        e.preventDefault()
        return
      }

      // Свайп вверх - показать подвал, если скрыт, или скрыть подвал, если показан
      if (dy < -threshold) {
        setFooterVisible(!footerVisible)
        swipeStartRef.current = null
        touchStartY = null
        e.preventDefault()
        return
      }
    }

    const handleTouchEnd = () => {
      swipeStartRef.current = null
      touchStartY = null
    }

    // Mouse события (десктоп)
    const handleMouseDown = (e) => {
      if (e.button !== 0) return
      if (e.target.closest('button, .premium-button')) return

      mouseDown = true
      mouseStartY = e.clientY
      swipeStartRef.current = { y: mouseStartY, time: Date.now() }
    }

    const handleMouseMove = (e) => {
      if (!mouseDown || !swipeStartRef.current) return

      const currentY = e.clientY
      const dy = currentY - swipeStartRef.current.y
      const threshold = 80

      // Свайп вниз - показать шапку, если скрыта, или скрыть шапку, если показана
      if (dy > threshold) {
        setHeaderVisible(!headerVisible)
        mouseDown = false
        swipeStartRef.current = null
        mouseStartY = null
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Свайп вверх - показать подвал, если скрыт, или скрыть подвал, если показан
      if (dy < -threshold) {
        setFooterVisible(!footerVisible)
        mouseDown = false
        swipeStartRef.current = null
        mouseStartY = null
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }

    const handleMouseUp = () => {
      mouseDown = false
      swipeStartRef.current = null
      mouseStartY = null
    }

    const container = splashRef.current || document

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseUp)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [headerVisible, footerVisible])

  return (
    <div 
      ref={splashRef}
      className={`dm-intro-splash ${fading ? 'dm-intro-splash-fading' : ''}`}
    >
      <IntroSplashContent 
        onButtonClick={handleButtonClick}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          navigate('/editor')
        }}
      />
    </div>
  )
}

export default IntroSplash

