// ============================================================================
// D MOTION - МОБИЛЬНАЯ КНОПКА НАЗАД
// ============================================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useMobileGestures'

export default function MobileBackButton({ onClick, className = '' }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <button 
      className={`mobile-back-btn ${className}`}
      onClick={handleClick}
      aria-label="Назад"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
  )
}
