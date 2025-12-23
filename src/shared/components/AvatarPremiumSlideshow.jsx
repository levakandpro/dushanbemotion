// src/shared/components/AvatarPremiumSlideshow.jsx

import React, { useEffect, useState } from 'react'
import './AvatarPremiumSlideshow.css'

export default function AvatarPremiumSlideshow({
  urls,
  size = 48,
  className = ''
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Если только один аватар, не запускаем слайдшоу
    if (urls.length <= 1) {
      return
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % urls.length)
    }, 3000) // Меняем каждые 3 секунды

    return () => clearInterval(interval)
  }, [urls.length])

  if (urls.length === 0) {
    return null
  }

  // Если только один аватар, показываем без анимации
  if (urls.length === 1) {
    return (
      <div
        className={`avatar-slideshow ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={urls[0]} alt="Avatar" />
      </div>
    )
  }

  return (
    <div
      className={`avatar-slideshow ${className}`}
      style={{ width: size, height: size }}
    >
      {urls.map((url, index) => (
        <img
          key={url}
          src={url}
          alt={`Avatar ${index + 1}`}
          className={`avatar-slideshow-image ${
            index === currentIndex ? 'active' : ''
          }`}
        />
      ))}
    </div>
  )
}

