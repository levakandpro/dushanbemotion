// ============================================================================
// D MOTION - МОБИЛЬНАЯ ПАНЕЛЬ FULLSCREEN
// ============================================================================

import React from 'react'
import { useIsMobile } from '../../hooks/useMobileGestures'

export default function MobilePanel({ isOpen, onClose, title, children, headerContent }) {
  const isMobile = useIsMobile()
  const [pullDistance, setPullDistance] = React.useState(0)
  const startY = React.useRef(0)
  const isPulling = React.useRef(false)
  
  // Pull-to-close жест
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    startY.current = touch.clientY
    isPulling.current = true
  }
  
  const handleTouchMove = (e) => {
    if (!isPulling.current) return
    const touch = e.touches[0]
    const delta = touch.clientY - startY.current
    // Только если тянем вниз и в начале панели
    if (delta > 0 && e.target.scrollTop === 0) {
      setPullDistance(Math.min(delta, 200))
      e.preventDefault()
    }
  }
  
  const handleTouchEnd = () => {
    isPulling.current = false
    // Если потянули больше 100px - закрываем
    if (pullDistance > 100) {
      onClose()
    }
    setPullDistance(0)
  }
  
  if (!isMobile || !isOpen) return null

  return (
    <div 
      className="mobile-panel" 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        background: '#080a0c',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        transform: `translateY(${pullDistance}px)`,
        opacity: pullDistance > 50 ? 1 - (pullDistance / 200) : 1,
        transition: pullDistance === 0 ? 'transform 0.3s, opacity 0.3s' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header всегда: кнопка назад в канвас */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10000000,
        background: '#080a0c',
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.95)',
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10000001,
          }}
          aria-label="Назад"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {headerContent ? (
          <div style={{ 
            flex: 1, 
            minWidth: 0, // Критично для прокрутки в flex
            overflow: 'hidden', // Скрываем переполнение родителя, но разрешаем прокрутку внутри
            position: 'relative',
            width: '100%',
          }}>
            {headerContent}
          </div>
        ) : title ? (
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1,
          }}>
            {title}
          </div>
        ) : null}
      </div>

      {/* Контент */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {typeof children === 'function' ? children({ onClose }) : children}
      </div>
    </div>
  )
}
