// src/components/PromoModal/PromoModal.jsx
// Рекламное окно акции PREMIUM

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import './PromoModal.css'

export default function PromoModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const dotRef = useRef(null)
  const snowRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  // Анимация появления
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  // Генерация снежинок
  useEffect(() => {
    if (!isVisible || !snowRef.current) return
    
    const container = snowRef.current
    container.innerHTML = ''
    
    for (let i = 0; i < 40; i++) {
      const flake = document.createElement('div')
      flake.className = 'promo-snow-flake'
      const size = Math.random() * 3 + 1 + 'px'
      flake.style.width = size
      flake.style.height = size
      flake.style.left = Math.random() * 100 + '%'
      flake.style.animationDelay = Math.random() * 5 + 's'
      flake.style.animationDuration = Math.random() * 3 + 4 + 's'
      container.appendChild(flake)
    }
  }, [isVisible])

  // Курсор
  const handleMouseMove = (e) => {
    if (!cardRef.current || !dotRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    dotRef.current.style.left = (e.clientX - rect.left) + 'px'
    dotRef.current.style.top = (e.clientY - rect.top) + 'px'
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }

  const handleSubscribe = () => {
    handleClose()
    navigate('/pricing')
  }

  if (!isOpen && !isVisible) return null

  return createPortal(
    <div className={`promo-modal-backdrop ${isVisible ? 'promo-modal-visible' : ''}`} onClick={handleClose}>
      <div 
        ref={cardRef}
        className="promo-card" 
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
      >
        <div ref={dotRef} className="promo-cursor-dot"></div>
        <button className="promo-close" onClick={handleClose}>✕</button>
        <div ref={snowRef} className="promo-snow-container"></div>

        <div className="promo-video-portal">
          <video autoPlay muted loop playsInline>
            <source src="https://archive.org/download/dream-machine-ai-2025-12-19-201046/DREAM-MACHINE-AI-2025-12-19-201046.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="promo-content">
          <h1 className="promo-title">D MOTION<br /><span>PREMIUM</span></h1>
          <p className="promo-text">
            Мировые футажи, звуки <br />
            и визуальные эффекты. <br />
            Премиум уровень в один клик.
          </p>

          <div className="promo-footer">
            <div className="promo-price-main">120<small>TJS</small></div>
            <div className="promo-badge-special">
              <span className="promo-old-price">220 TJS</span>
              <span>Распродажа<br />31.12</span>
            </div>
          </div>
          <button className="promo-btn" onClick={handleSubscribe}>Подключить сейчас</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
