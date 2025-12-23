// ============================================================================
// D MOTION - МОБИЛЬНАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ
// ============================================================================

import React from 'react'
import { useIsMobile } from '../../hooks/useMobileGestures'

// Иконки инструментов
const ToolIcons = {
  background: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  text: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>
  ),
  stickers: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  video: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M10 9l5 3-5 3V9z"/>
    </svg>
  ),
  icons: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  bazar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

const tools = [
  { id: 'background', label: 'Фон', icon: ToolIcons.background },
  { id: 'text', label: 'Текст', icon: ToolIcons.text },
  { id: 'stickers', label: 'Стикеры', icon: ToolIcons.stickers },
  { id: 'music', label: 'Музыка', icon: ToolIcons.music },
  { id: 'beats', label: 'Видео', icon: ToolIcons.video },
  { id: 'icons', label: 'Иконки', icon: ToolIcons.icons },
  { id: 'bazar', label: 'BAZAR', icon: ToolIcons.bazar }
]

export default function MobileToolbar({ activeTool, onToolChange, onBazarClick, onOpenPanel, isCanvasActive = false, isPanelOpen = false }) {
  const isMobile = useIsMobile()
  const touchStartY = React.useRef(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [showArrow, setShowArrow] = React.useState(true)
  const hideTimerRef = React.useRef(null)

  // Скрываем стрелку когда канвас активен
  React.useEffect(() => {
    if (isCanvasActive) {
      setShowArrow(false)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      // Показываем стрелку через 1.5 сек после того как канвас в покое
      hideTimerRef.current = setTimeout(() => {
        setShowArrow(true)
      }, 1500)
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isCanvasActive])
  
  if (!isMobile) return null
  if (isPanelOpen) return null

  const handleToolClick = (toolId) => {
    if (toolId === 'bazar') {
      onBazarClick?.()
    } else {
      onToolChange?.(toolId)
    }
  }

  // Свайп вверх для открытия панели
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(false)
  }

  const handleTouchMove = (e) => {
    const deltaY = touchStartY.current - e.touches[0].clientY
    if (deltaY > 30) {
      setIsDragging(true)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      onOpenPanel?.()
    }
    setIsDragging(false)
  }

  const containerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100000,
  }

  const arrowAreaStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '6px 0 2px',
    background: 'transparent',
  }

  const arrowStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    color: '#0d7533',
    animation: 'bounceUp 1.5s ease-in-out infinite',
    opacity: showArrow ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: showArrow ? 'auto' : 'none',
  }

  const toolbarStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 56,
    background: 'rgba(8, 8, 10, 0.98)',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '0 8px',
    paddingBottom: 'env(safe-area-inset-bottom)',
  }

  const btnStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: '6px 8px',
    background: isActive ? 'rgba(0, 255, 162, 0.12)' : 'transparent',
    border: 'none',
    color: isActive ? '#00ffa2' : 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    borderRadius: 10,
    minWidth: 44,
    minHeight: 44,
    transition: 'all 0.2s ease',
  })

  const labelStyle = {
    fontSize: 9,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  }

  // Стрелка вверх
  const ArrowUpIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
    </svg>
  )

  return (
    <>
      {/* CSS анимация */}
      <style>{`
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 0.8; }
        }
      `}</style>
      
      <div 
        style={containerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Анимированная стрелка вверх */}
        <div style={arrowAreaStyle} onClick={() => onOpenPanel?.()}>
          <div style={arrowStyle}>
            {ArrowUpIcon}
            <span style={{ fontSize: 9, fontWeight: 600, color: '#0d7533' }}>Свайп вверх</span>
          </div>
        </div>

        {/* Панель инструментов */}
        <div style={toolbarStyle}>
          {tools.map(tool => (
            <button
              key={tool.id}
              style={btnStyle(activeTool === tool.id)}
              onClick={() => handleToolClick(tool.id)}
            >
              {tool.icon}
              <span style={labelStyle}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
