import React, { useState } from 'react';
import './SubscribeButton.css';

/**
 * Кнопка подписки в стиле YouTube
 */
export function SubscribeButton({ 
  isSubscribed = false, 
  onSubscribe, 
  size = 'small',
  showText = true 
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    
    setLoading(true);
    try {
      await onSubscribe?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`subscribe-btn subscribe-btn--${size} ${isSubscribed ? 'is-subscribed' : ''} ${loading ? 'is-loading' : ''}`}
      onClick={handleClick}
      type="button"
      disabled={loading}
    >
      {isSubscribed ? (
        <>
          <span className="subscribe-btn__icon">✓</span>
          {showText && <span className="subscribe-btn__text">Подписка</span>}
        </>
      ) : (
        <>
          <span className="subscribe-btn__icon">+</span>
          {showText && <span className="subscribe-btn__text">Подписаться</span>}
        </>
      )}
    </button>
  );
}

export default SubscribeButton;
