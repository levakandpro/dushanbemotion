// src/shared/components/InfoTooltip.jsx
import React, { useState } from 'react'
import './InfoTooltip.css'

export default function InfoTooltip({ text }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div 
      className="info-tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <svg 
        className="info-tooltip-icon" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {isVisible && (
        <div className="info-tooltip">
          {text}
        </div>
      )}
    </div>
  )
}

