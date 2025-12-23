// src/editorV2/components/BackgroundCategoriesRail.jsx
import React, { useState, useCallback, useRef } from 'react'

// Твои оригинальные импорты ассетов — сохранено без изменений
import iconPeople from '../../assets/icomenubar/p.svg'
import iconLion from '../../assets/icomenubar/lion.svg'
import iconGori from '../../assets/icomenubar/gori.svg'
import iconKult from '../../assets/icomenubar/kult.svg'
import iconArt from '../../assets/icomenubar/art.svg'
import iconUzori from '../../assets/icomenubar/uzori.svg'
import iconUns from '../../assets/icomenubar/uns.svg'
import icon21st from '../../assets/icomenubar/21st century.svg'
import iconFood from '../../assets/icomenubar/food.svg'
import iconFlags from '../../assets/icomenubar/flags.svg'
import iconWatermelon from '../../assets/icomenubar/watermelon.svg'
import iconSport from '../../assets/icomenubar/sport.svg'
import iconMusic from '../../assets/icomenubar/music.svg'
import iconLove from '../../assets/icomenubar/love.svg'
import iconBardak from '../../assets/icomenubar/bardak.svg'

// Улучшенный компонент иконки с эффектом свечения при активации
const CategoryIcon = ({ categoryKey, isActive }) => {
  const iconMap = {
    people: iconPeople,
    animals: iconLion,
    nature: iconGori,
    culture: iconKult,
    illustrations: iconArt,
    textures: iconUzori,
    architecture: iconUns,
    modern: icon21st,
    food: iconFood,
    flags: iconFlags,
    fo: iconWatermelon,
    sport: iconSport,
    music: iconMusic,
    love: iconLove,
    bardak: iconBardak,
  };

  const IconSrc = iconMap[categoryKey] || iconBardak;

  return (
    <img 
      src={IconSrc} 
      alt="" 
      style={{
        width: '16px',
        height: '16px',
        display: 'block',
        // Неактивные иконки становятся тусклыми, активные светятся под цвет бренда
        filter: isActive ? 'drop-shadow(0 0 5px var(--accent))' : 'grayscale(1) opacity(0.4)',
        transition: 'all 0.3s ease'
      }}
    />
  );
};

const BACKGROUND_CATEGORIES = [
  { label: "Люди", key: "people" },
  { label: "Дастархан", key: "food" },
  { label: "Животные", key: "animals" },
  { label: "Природа", key: "nature" },
  { label: "Культура", key: "culture" },
  { label: "Арт", key: "illustrations" },
  { label: "Текстуры", key: "textures" },
  { label: "Наследие", key: "architecture" },
  { label: "21 Век", key: "modern" },
  { label: "Флаги", key: "flags" },
  { label: "Рынок", key: "fo" },
  { label: "Спорт", key: "sport" },
  { label: "Музыка", key: "music" },
  { label: "Любовь", key: "love" },
  { label: "Бардак", key: "bardak" },
]

export default function BackgroundCategoriesRail({ 
  activeCategory, 
  onCategoryChange,
  isVisible = false,
  isCollapsed = false,
  onToggleCollapse,
  onPrefetchCategory 
}) {
  if (!isVisible) return null
  
  const prefetchTimeoutRef = useRef(null)
  const handleMouseEnter = useCallback((categoryKey) => {
    if (categoryKey === activeCategory) return 
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current)
    
    prefetchTimeoutRef.current = setTimeout(() => {
      if (onPrefetchCategory) onPrefetchCategory(categoryKey)
    }, 300)
  }, [activeCategory, onPrefetchCategory])
  
  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current)
  }, [])

  return (
    <div 
      className={`dm-background-categories-rail ${isCollapsed ? 'dm-background-categories-rail-collapsed' : ''}`}
      style={{
        width: isCollapsed ? '44px' : '135px',
        background: 'rgba(6, 26, 18, 0.45)', // Глубокий темный фон с прозрачностью
        backdropFilter: 'blur(12px)', // Эффект матового стекла
        borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      <div className="dm-background-categories-rail-header" style={{
        padding: '24px 14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!isCollapsed && (
          <span style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.25)',
            fontWeight: '800'
          }}>Библиотека</span>
        )}
        <button
          type="button"
          className="dm-background-categories-rail-toggle"
          onClick={onToggleCollapse}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg 
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" 
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={isCollapsed ? 'dm-rail-toggle-icon-right' : 'dm-rail-toggle-icon-left'}
          >
            {isCollapsed ? <path d="M4 2l4 4-4 4" /> : <path d="M8 2l-4 4 4 4" />}
          </svg>
        </button>
      </div>

      <div className="dm-background-categories-rail-list" style={{
        padding: '0 8px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {BACKGROUND_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`dm-background-category-rail-btn ${isActive ? "dm-background-category-rail-btn-active" : ""}`}
              onClick={() => onCategoryChange(cat.key)}
              onMouseEnter={() => handleMouseEnter(cat.key)}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: isCollapsed ? '12px' : '10px 14px',
                background: isActive ? 'rgba(0, 255, 162, 0.06)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {/* Активный индикатор (неоновая полоса) */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: '-4px',
                  width: '3px',
                  height: '14px',
                  background: 'var(--accent)',
                  borderRadius: '2px',
                  boxShadow: '0 0 12px var(--accent)'
                }} />
              )}
              
              {isCollapsed ? (
                <CategoryIcon categoryKey={cat.key} isActive={isActive} />
              ) : (
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  opacity: isActive ? 1 : 0.8
                }}>
                  {cat.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}