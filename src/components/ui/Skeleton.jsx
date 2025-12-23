import React from 'react';
import './Skeleton.css';

/**
 * Skeleton компонент для загрузки
 */
export function Skeleton({ width, height, variant = 'rect', className = '' }) {
  const style = {
    width: width || '100%',
    height: height || '20px',
  };

  return (
    <div 
      className={`skeleton skeleton--${variant} ${className}`} 
      style={style}
    />
  );
}

/**
 * Skeleton для карточки работы
 */
export function WorkCardSkeleton() {
  return (
    <div className="skeleton-work-card">
      <Skeleton variant="rect" height="180px" className="skeleton-work-card__image" />
      <div className="skeleton-work-card__content">
        <Skeleton width="70%" height="16px" />
        <Skeleton width="50%" height="12px" />
        <div className="skeleton-work-card__footer">
          <Skeleton variant="circle" width="24px" height="24px" />
          <Skeleton width="60px" height="12px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton для карточки автора
 */
export function AuthorCardSkeleton() {
  return (
    <div className="skeleton-author-card">
      <Skeleton variant="circle" width="60px" height="60px" />
      <Skeleton width="80px" height="14px" />
      <Skeleton width="50px" height="10px" />
    </div>
  );
}

/**
 * Skeleton для карточки услуги
 */
export function ServiceCardSkeleton() {
  return (
    <div className="skeleton-service-card">
      <Skeleton variant="rect" height="120px" />
      <div className="skeleton-service-card__content">
        <Skeleton width="80%" height="14px" />
        <Skeleton width="60%" height="12px" />
        <Skeleton width="40%" height="16px" />
      </div>
    </div>
  );
}

/**
 * Skeleton для коллекции
 */
export function CollectionSkeleton() {
  return (
    <div className="skeleton-collection">
      <div className="skeleton-collection__covers">
        <Skeleton variant="rect" height="100px" />
        <Skeleton variant="rect" height="100px" />
        <Skeleton variant="rect" height="100px" />
      </div>
      <Skeleton width="70%" height="14px" />
      <Skeleton width="50%" height="12px" />
    </div>
  );
}

/**
 * Skeleton для ленты (несколько карточек)
 */
export function FeedSkeleton({ count = 4, type = 'work' }) {
  const SkeletonComponent = {
    work: WorkCardSkeleton,
    author: AuthorCardSkeleton,
    service: ServiceCardSkeleton,
    collection: CollectionSkeleton,
  }[type] || WorkCardSkeleton;

  return (
    <div className={`skeleton-feed skeleton-feed--${type}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
