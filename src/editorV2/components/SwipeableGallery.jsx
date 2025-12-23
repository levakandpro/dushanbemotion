import React, { useRef, useState, useCallback } from 'react'
import './SwipeableGallery.css'

/**
 * Swipeable Gallery - галерея с свайпами влево/вправо как в знакомствах
 */
export default function SwipeableGallery({ items, onSelectItem, renderItem }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const containerRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return
    const currentX = e.touches[0].clientX
    const deltaX = currentX - startXRef.current
    setOffset(deltaX)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    const threshold = 100

    if (offset > threshold && currentIndex > 0) {
      // Свайп вправо - предыдущий
      setCurrentIndex(prev => prev - 1)
    } else if (offset < -threshold && currentIndex < items.length - 1) {
      // Свайп влево - следующий
      setCurrentIndex(prev => prev + 1)
    }

    setOffset(0)
  }, [offset, currentIndex, items.length])

  const handleClick = useCallback(() => {
    if (Math.abs(offset) < 10 && items[currentIndex]) {
      onSelectItem(items[currentIndex])
    }
  }, [offset, currentIndex, items, onSelectItem])

  if (items.length === 0) {
    return (
      <div className="dm-swipeable-gallery-empty">
        В этой категории пока нет фонов
      </div>
    )
  }

  return (
    <div className="dm-swipeable-gallery" ref={containerRef}>
      {/* Индикаторы */}
      <div className="dm-swipeable-gallery-indicators">
        {items.map((_, idx) => (
          <div
            key={idx}
            className={`dm-swipeable-gallery-indicator ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Карточки */}
      <div
        className="dm-swipeable-gallery-cards"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${offset}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.key || idx}
            className="dm-swipeable-gallery-card"
            style={{
              opacity: Math.max(0.3, 1 - Math.abs(idx - currentIndex) * 0.3)
            }}
          >
            {renderItem ? renderItem(item) : (
              <img src={item.url} alt="" className="dm-swipeable-gallery-image" />
            )}
          </div>
        ))}
      </div>

      {/* Кнопки навигации */}
      {currentIndex > 0 && (
        <button
          className="dm-swipeable-gallery-btn dm-swipeable-gallery-btn-prev"
          onClick={(e) => {
            e.stopPropagation()
            setCurrentIndex(prev => prev - 1)
          }}
        >
          ‹
        </button>
      )}
      {currentIndex < items.length - 1 && (
        <button
          className="dm-swipeable-gallery-btn dm-swipeable-gallery-btn-next"
          onClick={(e) => {
            e.stopPropagation()
            setCurrentIndex(prev => prev + 1)
          }}
        >
          ›
        </button>
      )}

      {/* Счётчик */}
      <div className="dm-swipeable-gallery-counter">
        {currentIndex + 1} / {items.length}
      </div>

      {/* Текст подсказки */}
      <div className="dm-swipeable-gallery-hint">
        ← Свайп → для навигации<br />
        Тап для выбора
      </div>
    </div>
  )
}

