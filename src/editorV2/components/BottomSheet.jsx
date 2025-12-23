// ============================================================================
// D MOTION - BOTTOM SHEET (мировой уровень)
// ============================================================================

import React, { useEffect, useRef, useState } from 'react'

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxHeight = '85vh',
  snapPoints = [0.5, 0.85]
}) {
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY
    currentY.current = translateY
    setIsDragging(true)
  }
  
  const handleTouchMove = (e) => {
    if (!isDragging) return
    const delta = e.touches[0].clientY - startY.current
    // Только если тянем вниз
    if (delta > 0) {
      setTranslateY(delta)
    }
  }
  
  const handleTouchEnd = () => {
    setIsDragging(false)
    // Если потянули больше 150px - закрываем
    if (translateY > 150) {
      onClose()
    }
    setTranslateY(0)
  }
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight,
          background: 'linear-gradient(180deg, #0a0c0e 0%, #080a0c 100%)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull handle */}
        <div style={{
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: 48,
            height: 5,
            background: 'rgba(61, 191, 160, 0.4)',
            borderRadius: 10,
          }} />
        </div>
        
        {/* Title */}
        {title && (
          <div style={{
            padding: '0 20px 16px',
            fontSize: 18,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            flexShrink: 0,
          }}>
            {title}
          </div>
        )}
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px 32px',
        }}>
          {children}
        </div>
      </div>
    </>
  )
}

