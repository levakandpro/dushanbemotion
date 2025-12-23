import React, { useState, useCallback } from 'react';
import './HeartAnimation.css';

/**
 * Hook для создания анимации разлетающихся сердечек
 * Использование: const { triggerHearts, HeartsContainer } = useHeartAnimation();
 * Вызов: triggerHearts(event) при клике
 * Рендер: <HeartsContainer /> в конце компонента
 */
export function useHeartAnimation() {
  const [hearts, setHearts] = useState([]);

  const triggerHearts = useCallback((e, count = 15) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Зелёные оттенки: тёмно-зелёный, неоновый, акцентный
    const heartColors = [
      '#2be7a6', // неоновый зелёный (акцент)
      '#19c98c', // яркий зелёный
      '#0f9d6e', // средний зелёный
      '#0a7a55', // тёмно-зелёный
      '#06543b', // очень тёмный
      '#4fffb0', // светлый неон
      '#00ff88', // яркий неон
      '#1aff9c', // мятный неон
    ];
    const newHearts = [];
    
    for (let i = 0; i < count; i++) {
      // Случайный угол для разлёта во все стороны
      const angle = (Math.random() * 360) * (Math.PI / 180);
      // Разная дистанция для эффекта взрыва
      const distance = 80 + Math.random() * 120;
      // Случайное вращение
      const rotate = Math.random() * 60 - 30;
      
      newHearts.push({
        id: Date.now() + i + Math.random(),
        x,
        y,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 50 - Math.random() * 30,
        scale: 0.8 + Math.random() * 0.8,
        duration: 0.8 + Math.random() * 0.5,
        rotate,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
      });
    }

    setHearts(prev => [...prev, ...newHearts]);

    // Удаляем сердечки после анимации
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 1500);
  }, []);

  const HeartsContainer = useCallback(() => (
    <div className="hearts-container">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="flying-heart"
          style={{
            left: heart.x,
            top: heart.y,
            '--tx': `${heart.tx}px`,
            '--ty': `${heart.ty}px`,
            '--scale': heart.scale,
            '--duration': `${heart.duration}s`,
            '--rotate': `${heart.rotate}deg`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={heart.color} style={{ filter: `drop-shadow(0 0 6px ${heart.color})` }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      ))}
    </div>
  ), [hearts]);

  return { triggerHearts, HeartsContainer };
}

/**
 * SVG иконка сердечка
 */
export const HeartIcon = ({ filled = false, size = 18, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? '#2be7a6' : 'none'} 
    stroke={filled ? '#2be7a6' : 'currentColor'} 
    strokeWidth="2"
    className={className}
    style={filled ? { filter: 'drop-shadow(0 0 4px #2be7a6)' } : {}}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

/**
 * SVG иконка глазика (просмотры)
 */
export const EyeIcon = ({ size = 18, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/**
 * Компонент кнопки лайка с анимацией сердечек
 */
export function LikeButton({ liked, onLike, count, size = 'medium' }) {
  const { triggerHearts, HeartsContainer } = useHeartAnimation();

  const handleClick = (e) => {
    if (!liked) {
      triggerHearts(e, 20);
    }
    onLike?.();
  };

  return (
    <>
      <button
        className={`like-btn like-btn--${size} ${liked ? 'is-liked' : ''}`}
        onClick={handleClick}
        type="button"
      >
        <span className="like-btn__icon">
          <HeartIcon filled={liked} size={size === 'small' ? 14 : size === 'large' ? 24 : 18} />
        </span>
        {count !== undefined && <span className="like-btn__count">{count}</span>}
      </button>
      <HeartsContainer />
    </>
  );
}

export default LikeButton;
