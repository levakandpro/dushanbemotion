import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './MobileIntroSplash.css'

export default function MobileIntroSplash() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // Анимация частиц фона
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let particles = []
    let animationId

    function init() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles = []
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          color: Math.random() > 0.5 ? '#1aff9c' : '#ffffff'
        })
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.3
        ctx.fill()
      })
      
      animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => init()
    window.addEventListener('resize', handleResize)
    
    init()
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const handleWebVersion = () => {
    // Сохраняем выбор пользователя
    localStorage.setItem('dm_version_preference', 'web')
    navigate('/editor')
  }

  const handleMobileVersion = () => {
    // Сохраняем выбор пользователя
    localStorage.setItem('dm_version_preference', 'mobile')
    navigate('/editor')
  }

  return (
    <div className="dm-mobile-intro">
      <canvas ref={canvasRef} className="dm-mobile-intro-canvas" />
      
      <div className="dm-mobile-intro-container">
        <h1 className="dm-mobile-intro-title">D MOTION</h1>
        
        <p className="dm-mobile-intro-subtitle">
          Интеллектуальная адаптация контента.<br />
          Выберите формат для продолжения.
        </p>

        <ul className="dm-mobile-intro-list">
          <li>Вертикальный контент 9:16</li>
          <li>Эксклюзивные мобильные подборки</li>
          <li>Горизонтальный формат только в WEB</li>
          <li>Ultra HD качество материалов</li>
        </ul>

        <div className="dm-mobile-intro-buttons">
          <button 
            className="dm-mobile-intro-btn dm-mobile-intro-btn-web" 
            onClick={handleWebVersion}
          >
            ОТКРЫТЬ WEB-ВЕРСИЮ
          </button>
          <button 
            className="dm-mobile-intro-btn dm-mobile-intro-btn-mobile" 
            onClick={handleMobileVersion}
          >
            ПРОДОЛЖИТЬ В MOBILE
          </button>
        </div>
      </div>
    </div>
  )
}

