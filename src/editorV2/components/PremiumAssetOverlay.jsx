// src/editorV2/components/PremiumAssetOverlay.jsx
import React, { useState } from 'react'
import './PremiumAssetOverlay.css'

/**
 * Компонент для отображения премиум-ассетов с затемнением и замком
 */
export default function PremiumAssetOverlay({ 
  asset, 
  children, 
  onPremiumClick,
  isPremium = false 
}) {
  const [showModal, setShowModal] = useState(false)

  const handleClick = (e) => {
    if (isPremium) {
      e.preventDefault()
      e.stopPropagation()
      if (onPremiumClick) {
        onPremiumClick(asset)
      } else {
        setShowModal(true)
      }
    }
  }

  const handleSubscribe = () => {
    // Здесь можно открыть модалку подписки или перенаправить
    console.log('Opening subscription modal...')
    setShowModal(false)
    // TODO: Интегрировать с системой подписки
    alert('Функция подписки будет доступна в ближайшее время')
  }

  if (!isPremium) {
    return <>{children}</>
  }

  return (
    <>
      <div 
        className="premium-asset-overlay"
        onClick={handleClick}
      >
        <div className="premium-asset-content">
          {children}
        </div>
        <div className="premium-asset-darken" />
        <div className="premium-asset-lock">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 1C9.24 1 7 3.24 7 6V8H5C3.9 8 3 8.9 3 10V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V10C21 8.9 20.1 8 19 8H17V6C17 3.24 14.76 1 12 1ZM12 3C13.66 3 15 4.34 15 6V8H9V6C9 4.34 10.34 3 12 3Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="premium-asset-badge">в­ђ Premium</div>
      </div>

      {showModal && (
        <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="premium-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="premium-modal-close"
              onClick={() => setShowModal(false)}
            >
              Г-
            </button>
            <div className="premium-modal-icon">в­ђ</div>
            <h2 className="premium-modal-title">Премиум ассет</h2>
            <p className="premium-modal-text">
              Этот ассет доступен только для премиум-подписчиков.
              Оформите подписку, чтобы получить доступ ко всем премиум-ассетам.
            </p>
            <div className="premium-modal-features">
              <div className="premium-modal-feature">✓ Доступ ко всем премиум-ассетам</div>
              <div className="premium-modal-feature">✓ Без водяных знаков</div>
              <div className="premium-modal-feature">✓ Приоритетная поддержка</div>
            </div>
            <button
              className="premium-modal-subscribe-btn"
              onClick={handleSubscribe}
            >
              Оформить подписку
            </button>
          </div>
        </div>
      )}
    </>
  )
}

