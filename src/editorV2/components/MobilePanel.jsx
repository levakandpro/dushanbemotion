// ============================================================================
// D MOTION - МОБИЛЬНАЯ ПАНЕЛЬ FULLSCREEN
// ============================================================================

import React from 'react'
import { useIsMobile } from '../../hooks/useMobileGestures'

export default function MobilePanel({ isOpen, onClose, title, children, headerContent }) {
  const isMobile = useIsMobile()
  
  if (!isMobile || !isOpen) return null

  return (
    <div className="mobile-panel" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999999,
      display: 'flex',
      flexDirection: 'column',
      background: '#080a0c',
      overflow: 'hidden',
    }}>
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
