import React from 'react';
import './OnlineStatus.css';

/**
 * Компонент онлайн-статуса с дышащей анимацией
 */
export function OnlineStatus({ isOnline, size = 'medium' }) {
  if (!isOnline) return null;
  
  return (
    <span className={`online-status online-status--${size}`}>
      <span className="online-status__dot" />
    </span>
  );
}

/**
 * Аватар с онлайн-статусом
 */
export function AvatarWithStatus({ 
  src, 
  alt, 
  isOnline, 
  size = 'medium',
  className = '' 
}) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };
  
  const dimension = sizeMap[size] || sizeMap.medium;
  
  return (
    <div className={`avatar-status avatar-status--${size} ${className}`}>
      <img 
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || 'U')}&background=1a3a32&color=2be7a6`}
        alt={alt}
        className="avatar-status__img"
        style={{ width: dimension, height: dimension }}
      />
      <OnlineStatus isOnline={isOnline} size={size} />
    </div>
  );
}

export default OnlineStatus;
