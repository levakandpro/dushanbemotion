// src/editorV2/components/StickerCategoriesRail.jsx
import React, { useCallback, useRef } from 'react'
import s from './StickerCategoriesRail.module.css'

const FemaleCrownIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 18C3 18 4 10 6 10C7 10 8 13 9 13C10 13 11 6 12 6C13 6 14 13 15 13C16 13 17 10 18 10C20 10 21 18 21 18H3Z" fill="#FF69B4" stroke="#DB7093" strokeWidth="1"/>
    <path d="M12 4c.5 0 1.5 1 1.5 2 0 1-1.5 2.5-1.5 2.5S10.5 7 10.5 6c0-1 1-2 1.5-2z" fill="#FF1493" stroke="#C71585" strokeWidth="0.5"/>
    <rect x="3" y="18" width="18" height="2.5" rx="1" fill="#FF69B4" stroke="#DB7093" strokeWidth="0.5"/>
  </svg>
);

const MaleCrownIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 17L4 7L8 12L12 4L16 12L20 7L22 17H2Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
    <circle cx="12" cy="4" r="2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
    <rect x="2" y="17" width="20" height="3" rx="1" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
  </svg>
);

export default function StickerCategoriesRail({ 
  activeCategory, onCategoryChange, categories = [], isVisible = false,
  isCollapsed = false, onToggleCollapse, onPrefetchCategory, title = 'Категории',
  expandedWidth = 100, collapsedWidth = 32, renderCollapsedIcon, showTooltips = true, isFemale = false
}) {
  const prefetchTimeoutRef = useRef(null)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  if (!isVisible || !categories || categories.length === 0) return null

  return (
    <div className={`${s['dm-sticker-categories-rail']} ${isFemale ? s['dm-sticker-categories-rail-feminine'] : ''} ${isCollapsed ? s['dm-sticker-categories-rail-collapsed'] : ''}`}
         style={{ width: isCollapsed ? `${collapsedWidth}px` : `${expandedWidth}px` }}>
      
      <div className={s['dm-sticker-categories-rail-header']}>
        {!isCollapsed && <span className={s['dm-sticker-categories-rail-title']}>{title}</span>}
        <button type="button" className={s['dm-sticker-categories-rail-toggle']} onClick={onToggleCollapse}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={isCollapsed ? "M4 2l4 4-4 4" : "M8 2l-4 4 4 4"} />
          </svg>
        </button>
      </div>

      <div className={s['dm-sticker-categories-rail-list']}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onMouseMove={handleMouseMove}
            title={showTooltips ? cat.label : undefined}
            className={`${s['dm-sticker-category-rail-btn']} ${activeCategory === cat.id ? s['dm-sticker-category-rail-btn-active'] : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {isCollapsed ? (
              <div className={s['dm-collapsed-content']}>
                {typeof renderCollapsedIcon === 'function' ? (
                  renderCollapsedIcon(cat)
                ) : (
                  <span className={s['dm-collapsed-letter']} aria-hidden="true">
                    {(cat.label || '?').trim().slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
            ) : (
              <div className={s['dm-btn-content']}>
                <span className={s['dm-label-text']}>{cat.label}</span>
                {cat.isPremium && (
                  <span className={s['dm-rail-crown']}>
                    {isFemale ? <FemaleCrownIcon size={12} /> : <MaleCrownIcon size={12} />}
                  </span>
                )}
              </div>
            )}
            {activeCategory === cat.id && <div className={s['dm-active-indicator']} />}
          </button>
        ))}
      </div>
    </div>
  )
}