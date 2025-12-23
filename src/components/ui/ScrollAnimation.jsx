import React, { useEffect, useRef, useState } from 'react';
import './ScrollAnimation.css';

/**
 * Компонент для анимации появления при скролле
 */
export function ScrollReveal({ 
  children, 
  animation = 'fadeUp', 
  delay = 0,
  threshold = 0.1,
  className = '' 
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal scroll-reveal--${animation} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Hook для staggered анимации списка
 */
export function useStaggerAnimation(items, baseDelay = 50) {
  return items.map((item, index) => ({
    ...item,
    animationDelay: index * baseDelay,
  }));
}

export default ScrollReveal;
