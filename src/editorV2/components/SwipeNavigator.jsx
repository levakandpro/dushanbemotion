// ============================================================================
// D MOTION - СВАЙП НАВИГАТОР (визуальный индикатор свайпа назад)
// ============================================================================

import React from 'react'
import { useSwipeNavigation, useIsMobile } from '../../hooks/useMobileGestures'

export default function SwipeNavigator({ children }) {
  const isMobile = useIsMobile()
  const { swipeProgress, swipeDirection } = useSwipeNavigation({
    threshold: 100,
    edgeWidth: 30,
    enabled: isMobile
  })

  if (!isMobile) return <>{children}</>

  return (
    <div className="swipe-navigator">
      {/* Индикатор свайпа назад */}
      {swipeDirection === 'back' && swipeProgress > 0 && (
        <div 
          className="swipe-indicator swipe-back"
          style={{
            opacity: swipeProgress,
            transform: `translateX(${swipeProgress * 30 - 30}px) scale(${0.5 + swipeProgress * 0.5})`
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>
      )}

      {/* Индикатор свайпа вперёд */}
      {swipeDirection === 'forward' && swipeProgress > 0 && (
        <div 
          className="swipe-indicator swipe-forward"
          style={{
            opacity: swipeProgress,
            transform: `translateX(${-swipeProgress * 30 + 30}px) scale(${0.5 + swipeProgress * 0.5})`
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      )}

      {/* Контент с эффектом сдвига */}
      <div 
        className="swipe-content"
        style={{
          transform: swipeDirection === 'back' 
            ? `translateX(${swipeProgress * 20}px)` 
            : swipeDirection === 'forward'
            ? `translateX(${-swipeProgress * 20}px)`
            : 'none',
          transition: swipeProgress === 0 ? 'transform 0.2s ease' : 'none'
        }}
      >
        {children}
      </div>

      <style jsx>{`
        .swipe-navigator {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .swipe-content {
          width: 100%;
          height: 100%;
        }

        .swipe-indicator {
          position: fixed;
          top: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 255, 162, 0.9);
          border-radius: 50%;
          color: #000;
          z-index: 9999;
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0, 255, 162, 0.4);
        }

        .swipe-back {
          left: 10px;
        }

        .swipe-forward {
          right: 10px;
        }
      `}</style>
    </div>
  )
}
