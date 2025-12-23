import React, { useState, useEffect, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import Loader from '../../components/ui/Loader'

// Категории иконок
const ICON_CATEGORIES = [
  {
    id: 'all',
    label: 'Все',
    keywords: []
  },
  {
    id: 'navigation',
    label: 'Навигация',
    keywords: [
      'arrow', 'chevron', 'caret', 'switch-horizontal', 'switch-vertical',
      'arrows', 'backspace', 'forward', 'backward'
    ],
  },
  {
    id: 'ui',
    label: 'Интерфейс',
    keywords: [
      'home', 'menu', 'x-mark', 'plus', 'minus', 'adjustments', 'funnel',
      'ellipsis', 'dots', 'switch', 'window', 'panel', 'command-line'
    ],
  },
  {
    id: 'user',
    label: 'Пользователи',
    keywords: [
      'user', 'users', 'profile', 'account'
    ],
  },
  {
    id: 'media',
    label: 'Медиа',
    keywords: [
      'play', 'pause', 'stop', 'backward', 'forward', 'speaker', 'volume',
      'microphone', 'video', 'musical-note', 'photo', 'camera'
    ],
  },
  {
    id: 'files',
    label: 'Файлы и документы',
    keywords: [
      'document', 'folder', 'file', 'clipboard', 'inbox', 'archive-box',
      'newspaper', 'bookmark'
    ],
  },
  {
    id: 'commerce',
    label: 'Платежи и продажи',
    keywords: [
      'credit-card', 'banknotes', 'wallet', 'shopping', 'cart', 'tag',
      'receipt-refund', 'receipt-percent', 'currency', 'gift'
    ],
  },
  {
    id: 'system',
    label: 'Система',
    keywords: [
      'settings', 'cog', 'cog-6-tooth', 'wrench', 'cpu-chip', 'shield',
      'lock', 'key', 'bug-ant', 'server'
    ],
  },
  {
    id: 'status',
    label: 'Статусы и уведомления',
    keywords: [
      'bell', 'exclamation', 'question-mark', 'information-circle',
      'check', 'x-mark-circle', 'stop-circle', 'alert', 'flag'
    ],
  },
  {
    id: 'social',
    label: 'Соц. и общение',
    keywords: [
      'chat', 'bubble', 'envelope', 'phone', 'rss', 'share'
    ],
  },
  {
    id: 'objects',
    label: 'Объекты и символы',
    keywords: [
      'heart', 'star', 'fire', 'bolt', 'sun', 'moon', 'cloud', 'globe',
      'map', 'truck', 'rocket', 'light-bulb', 'beaker', 'cube', 'puzzle',
      'trophy', 'academic-cap'
    ],
  },
  {
    id: 'layout',
    label: 'Сетки и диаграммы',
    keywords: [
      'chart', 'square-3-stack-3d', 'squares-2x2', 'squares-plus',
      'table-cells', 'view-columns', 'viewfinder-circle'
    ],
  },
  {
    id: 'other',
    label: 'Разное',
    keywords: [],
  },
]

// Определение категории иконки
function getIconCategory(iconName) {
  const lower = iconName.toLowerCase()

  for (const cat of ICON_CATEGORIES) {
    if (cat.id === 'all' || cat.id === 'other') continue

    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat.id
    }
  }

  return 'other'
}

// Модальное окно для выбора формата скачивания
function DownloadModal({ isOpen, onClose, icon, onDownloadSVG, onDownloadPNG, onDownloadJPEG }) {
  if (!isOpen) return null

  const handleDownload = (format) => {
    if (format === 'jpeg') {
      onDownloadJPEG(icon, { stopPropagation: () => {} })
    } else if (format === 'png') {
      onDownloadPNG(icon, { stopPropagation: () => {} })
    } else if (format === 'svg') {
      onDownloadSVG(icon, { stopPropagation: () => {} })
    }
    onClose()
  }

  // SVG иконки для форматов
  const FormatIcon = ({ format }) => {
    const icons = {
      jpeg: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M9 9h6v6H9z" />
          <circle cx="11" cy="11" r="1.5" fill="currentColor" />
          <circle cx="13" cy="13" r="1.5" fill="currentColor" />
        </svg>
      ),
      png: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 9l6 6M15 9l-6 6" strokeWidth="1.5" />
        </svg>
      ),
      svg: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v16H4z" />
          <path d="M8 8l4 4-4 4" />
          <path d="M12 8h4" />
          <path d="M12 16h4" />
        </svg>
      )
    }
    return icons[format] || null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f1714',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          minWidth: '280px',
          maxWidth: '90%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#fff',
          textAlign: 'center'
        }}>
          Выберите формат
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* JPEG */}
          <button
            onClick={() => handleDownload('jpeg')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <FormatIcon format="jpeg" />
            <span style={{ flex: 1, textAlign: 'left' }}>JPEG</span>
          </button>
          
          {/* PNG */}
          <button
            onClick={() => handleDownload('png')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <FormatIcon format="png" />
            <span style={{ flex: 1, textAlign: 'left' }}>PNG</span>
          </button>
          
          {/* SVG - PREMIUM */}
          <button
            onClick={() => handleDownload('svg')}
            style={{
              padding: '14px 16px',
              border: '1px solid rgba(0, 228, 155, 0.3)',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 228, 155, 0.1), rgba(0, 228, 155, 0.05))',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 228, 155, 0.15), rgba(0, 228, 155, 0.1))'
              e.currentTarget.style.borderColor = 'rgba(0, 228, 155, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 228, 155, 0.1), rgba(0, 228, 155, 0.05))'
              e.currentTarget.style.borderColor = 'rgba(0, 228, 155, 0.3)'
            }}
          >
            <FormatIcon format="svg" />
            <span style={{ flex: 1, textAlign: 'left' }}>SVG</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#00c584',
              background: 'rgba(0, 197, 132, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              PREMIUM
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          Отмена
        </button>
        
        {/* Социальные сети */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '400'
          }}>
            Подпишитесь за благодарность
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            alignItems: 'center'
          }}>
            <a
              href="https://t.me/dushanbemotion"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(37, 150, 190, 0.15)',
                border: '1px solid rgba(37, 150, 190, 0.3)',
                color: '#2596be',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 150, 190, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(37, 150, 190, 0.5)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(37, 150, 190, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(37, 150, 190, 0.3)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@dushanbemotion"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(255, 0, 0, 0.15)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff0000',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент иконки в сетке с кнопкой скачать
function IconGridItem({ icon, variant, selectedIconColor, loadingIcon, onLoadIcon, onDownloadSVG, onDownloadPNG, onDownloadJPEG }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const iconKey = `${icon.provider}-${icon.name}`

  const handleDownloadClick = (e) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid var(--dm-border)',
        borderRadius: '8px',
        background: 'var(--dm-bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        overflow: 'visible'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Иконка */}
      <div
        style={{
          aspectRatio: '1',
          position: 'relative',
          cursor: loadingIcon === iconKey ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: selectedIconColor,
          padding: '12px'
        }}
        onClick={() => onLoadIcon(icon)}
      >
        {loadingIcon === iconKey ? (
          <div style={{ fontSize: '20px' }}>вЏі</div>
        ) : (
          <IconPreview 
            key={`${iconKey}-${variant}-${selectedIconColor}`}
            icon={icon} 
            variant={variant} 
            color={selectedIconColor}
          />
        )}
      </div>
      
      {/* Кнопка скачать - появляется при hover */}
      <button
        onClick={handleDownloadClick}
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '50%',
          width: 'auto',
          padding: '2px 8px',
          border: 'none',
          borderRadius: '4px',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '8px',
          fontWeight: '500',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          lineHeight: '1.2',
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none',
          transform: isHovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(4px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Скачать</span>
      </button>
      
      {/* Модальное окно выбора формата */}
      <DownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        icon={icon}
        onDownloadSVG={onDownloadSVG}
        onDownloadPNG={onDownloadPNG}
        onDownloadJPEG={onDownloadJPEG}
      />
    </div>
  )
}

// Кастомный Color Picker компонент (кнопка-иконка)
function CustomColorPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '20px',
          height: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '3px',
          cursor: 'pointer',
          background: value,
          padding: '0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          flex: '0 0 auto',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
      />
      
      {isOpen && (
        <div
          ref={pickerRef}
          className="dm-color-popup"
          style={{
            position: 'absolute',
            top: '28px',
            left: '0',
            zIndex: 10000,
            background: '#0f1714',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <HexColorPicker
            color={value}
            onChange={onChange}
            style={{
              width: '200px',
              height: '150px'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Кэш для загруженных SVG
const svgCache = new Map()

// Компонент превью иконки
function IconPreview({ icon, variant, color }) {
  const [svgContent, setSvgContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' } // Начинаем загрузку за 50px до появления в viewport
    )
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!icon || !isVisible) return
    
    setLoading(true)
    setError(false)
    
    // Формируем ключ кэша
    const cacheKey = `${icon.provider}-${icon.name}-${icon.provider === 'tabler' ? icon.style : variant}`
    
    // Проверяем кэш
    if (svgCache.has(cacheKey)) {
      setSvgContent(svgCache.get(cacheKey))
      setLoading(false)
      return
    }
    
    // Формируем URL в зависимости от провайдера
    let url
    if (icon.provider === 'tabler') {
      // Tabler Icons: https://unpkg.com/@tabler/icons@latest/icons/{style}/{iconName}.svg
      url = `https://unpkg.com/@tabler/icons@latest/icons/${icon.style}/${icon.name}.svg`
    } else {
      // Heroicons: https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/{variant}/{iconName}.svg
      url = `https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/${variant}/${icon.name}.svg`
    }
    
    // Функция загрузки с retry и таймаутом
    const fetchWithRetry = async (url, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 секунд таймаут
          
          const response = await fetch(url, {
            cache: 'force-cache',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return await response.text()
        } catch (error) {
          if (i === retries) throw error
          await new Promise(resolve => setTimeout(resolve, 300 * (i + 1))) // Экспоненциальная задержка
        }
      }
    }
    
    fetchWithRetry(url)
      .then(text => {
        // Нормализуем для превью
        const currentStyle = icon.provider === 'tabler' ? icon.style : variant
        let normalized = text
          .replace(/fill="#[^"]*"/g, '')
          .replace(/stroke="#[^"]*"/g, '')
          .replace(/fill='#[^']*'/g, '')
          .replace(/stroke='#[^']*'/g, '')
        
        if (currentStyle === 'outline') {
          if (!normalized.includes('stroke=')) {
            normalized = normalized.replace(/<svg/, '<svg stroke="currentColor"')
          } else {
            normalized = normalized.replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
          }
          if (!normalized.includes('fill=')) {
            normalized = normalized.replace(/<svg/, '<svg fill="none"')
          } else {
            normalized = normalized.replace(/fill="[^"]*"/g, 'fill="none"')
          }
        } else {
          // solid или filled
          if (!normalized.includes('fill=')) {
            normalized = normalized.replace(/<svg/, '<svg fill="currentColor"')
          } else {
            normalized = normalized.replace(/fill="[^"]*"/g, 'fill="currentColor"')
          }
        }
        
        // Сохраняем в кэш
        svgCache.set(cacheKey, normalized)
        setSvgContent(normalized)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [icon, variant, isVisible])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || '#ffffff'
      }}
    >
      {!isVisible ? (
        // Пока не видим - показываем placeholder
        <div style={{ fontSize: '12px', opacity: 0.3 }}>в‹Ї</div>
      ) : loading ? (
        <div style={{ fontSize: '12px', opacity: 0.5 }}>вЏі</div>
      ) : error || !svgContent ? (
        <div style={{ fontSize: '12px', opacity: 0.35 }}>Г-</div>
      ) : (
        <div
          dangerouslySetInnerHTML={{ 
            __html: svgContent
              .replace(/currentColor/g, color || '#ffffff')
              .replace(/<svg/, '<svg style="width: 100%; height: 100%; max-width: 32px; max-height: 32px;"')
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}
    </div>
  )
}

// Нормализация SVG: убираем жесткие цвета, ставим currentColor
function normalizeSVG(svgText, variant = 'outline') {
  // Убираем жесткие fill и stroke из путей
  let normalized = svgText
    .replace(/fill="#[^"]*"/g, '')
    .replace(/stroke="#[^"]*"/g, '')
    .replace(/fill='#[^']*'/g, '')
    .replace(/stroke='#[^']*'/g, '')

  // Для outline: stroke="currentColor" fill="none"
  if (variant === 'outline') {
    // Добавляем stroke="currentColor" если его нет
    if (!normalized.includes('stroke=')) {
      normalized = normalized.replace(/<svg/, '<svg stroke="currentColor"')
    } else {
      normalized = normalized.replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      normalized = normalized.replace(/stroke='[^']*'/g, "stroke='currentColor'")
    }
    // Добавляем fill="none" если его нет
    if (!normalized.includes('fill=')) {
      normalized = normalized.replace(/<svg/, '<svg fill="none"')
    } else {
      normalized = normalized.replace(/fill="[^"]*"/g, 'fill="none"')
      normalized = normalized.replace(/fill='[^']*'/g, "fill='none'")
    }
  } else {
    // Для solid или filled: fill="currentColor"
    if (!normalized.includes('fill=')) {
      normalized = normalized.replace(/<svg/, '<svg fill="currentColor"')
    } else {
      normalized = normalized.replace(/fill="[^"]*"/g, 'fill="currentColor"')
      normalized = normalized.replace(/fill='[^']*'/g, "fill='currentColor'")
    }
  }

  return normalized
}

export default function IconsPanel({ project, onChangeProject }) {
  const [variant, setVariant] = useState(() => {
    return localStorage.getItem('dm_icons_variant') || 'outline';
  }); // 'outline' или 'solid'
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    return localStorage.getItem('dm_icons_category') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [loadingIcon, setLoadingIcon] = useState(null)
  const [selectedIconColor, setSelectedIconColor] = useState(() => {
    return localStorage.getItem('dm_icons_color') || '#00c584';
  });
  const [icons, setIcons] = useState([])
  const [loadingIcons, setLoadingIcons] = useState(true)

  // Находим выбранную иконку
  // Находим выбранную иконку (вычисляем напрямую при каждом рендере)
  const selectedIconId = project?.selectedIconId
  const iconLayers = project?.iconLayers || []
  
  // Вычисляем selectedIcon напрямую - это легкая операция, не нужен useMemo
  const selectedIcon = selectedIconId && iconLayers.length > 0
    ? iconLayers.find(i => i && i.id === selectedIconId) || null
    : null
  
  // Загрузка списка иконок через GitHub API (Heroicons + Tabler Icons)
  useEffect(() => {

    setLoadingIcons(true)
    
    // Маппинг вариантов: outline/solid для Heroicons -> outline/filled для Tabler
    const tablerStyle = variant === 'outline' ? 'outline' : 'filled'
    
    // Загружаем Heroicons и Tabler Icons параллельно
    Promise.all([
      // Heroicons
      fetch(`https://api.github.com/repos/tailwindlabs/heroicons/contents/src/24/${variant}`)
        .then(r => r.json())
        .then(data => {
          return data
            .filter(item => item.type === 'file' && item.name.endsWith('.svg'))
            .map(item => {
              const name = item.name.replace('.svg', '')
              return {
                provider: 'heroicons',
                style: variant, // 'outline' или 'solid'
                name,
                fileName: item.name,
                label: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: getIconCategory(name)
              }
            })
        })
        .catch(error => {
          console.error('Ошибка загрузки Heroicons:', error)
          return []
        }),
      
      // Tabler Icons
      fetch(`https://api.github.com/repos/tabler/tabler-icons/contents/icons/${tablerStyle}`)
        .then(r => r.json())
        .then(data => {
          return data
            .filter(item => item.type === 'file' && item.name.endsWith('.svg'))
            .map(item => {
              const name = item.name.replace('.svg', '')
              return {
                provider: 'tabler',
                style: tablerStyle, // 'outline' или 'filled'
                name,
                fileName: item.name,
                label: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: getIconCategory(name)
              }
            })
        })
        .catch(error => {
          console.error('Ошибка загрузки Tabler Icons:', error)
          return []
        })
    ])
    .then(([heroicons, tablerIcons]) => {
      // Объединяем массивы
      const allIcons = [...heroicons, ...tablerIcons]
        .sort((a, b) => a.name.localeCompare(b.name))
      
      setIcons(allIcons)
      setLoadingIcons(false)
    })
    .catch(error => {
      console.error('Ошибка загрузки иконок:', error)
      setLoadingIcons(false)
    })
  }, [variant])

  // Загрузка SVG иконки (Heroicons или Tabler)
  const loadIcon = async (icon) => {
    if (!project || !onChangeProject) return

    const iconKey = `${icon.provider}-${icon.name}`
    setLoadingIcon(iconKey)
    try {
      // Формируем URL в зависимости от провайдера
      let url
      if (icon.provider === 'tabler') {
        url = `https://unpkg.com/@tabler/icons@latest/icons/${icon.style}/${icon.name}.svg`
      } else {
        url = `https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/${variant}/${icon.name}.svg`
      }
      
      const svgText = await fetch(url).then(r => r.text())
      
      // Нормализуем SVG
      const currentStyle = icon.provider === 'tabler' ? icon.style : variant
      const normalizedSVG = normalizeSVG(svgText, currentStyle)

      // Создаем новый слой иконки
      const newIcon = {
        id: `icon_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'icon',
        iconName: icon.name,
        provider: icon.provider,
        style: currentStyle,
        variant,
        svgContent: normalizedSVG,
        color: selectedIconColor,
        x: 50,
        y: 50,
        width: 120,
        height: 120,
        rotation: 0,
        opacity: 1,
        zIndex: 100 + (project.iconLayers?.length || 0),
        visible: true,
        locked: false
      }

      const updatedProject = {
        ...project,
        iconLayers: [...(project.iconLayers || []), newIcon],
        selectedIconId: newIcon.id
      }

      onChangeProject(updatedProject)
    } catch (error) {
      console.error('Ошибка загрузки иконки:', error)
      alert('Не удалось загрузить иконку')
    } finally {
      setLoadingIcon(null)
    }
  }

  // Скачивание SVG иконки
  const downloadIconSVG = async (icon, e) => {
    e?.stopPropagation()
    try {
      // Формируем URL в зависимости от провайдера
      let url
      if (icon.provider === 'tabler') {
        url = `https://unpkg.com/@tabler/icons@latest/icons/${icon.style}/${icon.name}.svg`
      } else {
        url = `https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/${variant}/${icon.name}.svg`
      }
      
      const svgText = await fetch(url).then(r => r.text())
      
      // Нормализуем SVG и подставляем текущий цвет
      const currentStyle = icon.provider === 'tabler' ? icon.style : variant
      let normalized = normalizeSVG(svgText, currentStyle)
      if (selectedIconColor && selectedIconColor !== '#ffffff') {
        normalized = normalized.replace(/currentColor/g, selectedIconColor)
      }
      
      // Скачиваем файл
      const blob = new Blob([normalized], { type: 'image/svg+xml' })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${icon.name}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Ошибка скачивания SVG:', error)
      alert('Не удалось скачать SVG')
    }
  }

  // Скачивание PNG иконки
  const downloadIconPNG = async (icon, e) => {
    e?.stopPropagation()
    try {
      // Формируем URL в зависимости от провайдера
      let url
      if (icon.provider === 'tabler') {
        url = `https://unpkg.com/@tabler/icons@latest/icons/${icon.style}/${icon.name}.svg`
      } else {
        url = `https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/${variant}/${icon.name}.svg`
      }
      
      const svgText = await fetch(url).then(r => r.text())
      
      // Нормализуем SVG и подставляем текущий цвет
      const currentStyle = icon.provider === 'tabler' ? icon.style : variant
      let normalized = normalizeSVG(svgText, currentStyle)
      if (selectedIconColor && selectedIconColor !== '#ffffff') {
        normalized = normalized.replace(/currentColor/g, selectedIconColor)
      }
      
      // Создаем скрытый canvas
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      
      // Создаем изображение из SVG
      const img = new Image()
      const svgBlob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' })
      const urlSvg = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // Очищаем canvas (прозрачный фон)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Рисуем SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Скачиваем PNG
        canvas.toBlob((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = `${icon.name}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
          URL.revokeObjectURL(urlSvg)
        }, 'image/png')
      }
      
      img.onerror = () => {
        console.error('Ошибка загрузки SVG для PNG')
        alert('Не удалось создать PNG')
        URL.revokeObjectURL(urlSvg)
      }
      
      img.src = urlSvg
    } catch (error) {
      console.error('Ошибка скачивания PNG:', error)
      alert('Не удалось скачать PNG')
    }
  }

  // Скачивание JPEG иконки
  const downloadIconJPEG = async (icon, e) => {
    e?.stopPropagation()
    try {
      // Формируем URL в зависимости от провайдера
      let url
      if (icon.provider === 'tabler') {
        url = `https://unpkg.com/@tabler/icons@latest/icons/${icon.style}/${icon.name}.svg`
      } else {
        url = `https://cdn.jsdelivr.net/gh/tailwindlabs/heroicons/src/24/${variant}/${icon.name}.svg`
      }
      
      const svgText = await fetch(url).then(r => r.text())
      
      // Нормализуем SVG и подставляем текущий цвет
      const currentStyle = icon.provider === 'tabler' ? icon.style : variant
      let normalized = normalizeSVG(svgText, currentStyle)
      if (selectedIconColor && selectedIconColor !== '#ffffff') {
        normalized = normalized.replace(/currentColor/g, selectedIconColor)
      }
      
      // Создаем скрытый canvas с белым фоном для JPEG
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      
      // Заполняем белым фоном (JPEG не поддерживает прозрачность)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Создаем изображение из SVG
      const img = new Image()
      const svgBlob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' })
      const urlSvg = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // Рисуем SVG поверх белого фона
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Скачиваем JPEG
        canvas.toBlob((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = `${icon.name}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
          URL.revokeObjectURL(urlSvg)
        }, 'image/jpeg', 0.95)
      }
      
      img.onerror = () => {
        console.error('Ошибка загрузки SVG для JPEG')
        alert('Не удалось создать JPEG')
        URL.revokeObjectURL(urlSvg)
      }
      
      img.src = urlSvg
    } catch (error) {
      console.error('Ошибка скачивания JPEG:', error)
      alert('Не удалось скачать JPEG')
    }
  }

  // Фильтрация иконок по категории и поиску
  const filteredIcons = icons.filter(icon => {
    const byCategory = activeCategoryId === 'all' || icon.category === activeCategoryId
    const byQuery = !searchQuery || icon.name.toLowerCase().includes(searchQuery.toLowerCase())
    return byCategory && byQuery
  })

  return (
    <div className="editor-v2-panel" style={{
      background: 'rgba(11, 15, 14, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Заголовок с кнопками вариантов и поиском */}
      <div
        className="dm-right-panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative'
        }}
      >
        {/* Заголовок или поле поиска - занимают одно место */}
        <div style={{
          position: 'relative',
          flex: '0 0 auto',
          minWidth: isSearchOpen ? '200px' : 'auto'
        }}>
          {/* Заголовок - скрывается при открытом поиске */}
          <h3 
            className="editor-v2-panel-title" 
            style={{ 
              margin: 0, 
              flex: '0 0 auto',
              opacity: isSearchOpen ? 0 : 1,
              position: isSearchOpen ? 'absolute' : 'relative',
              pointerEvents: isSearchOpen ? 'none' : 'auto',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: isSearchOpen ? 0 : 'auto',
              overflow: isSearchOpen ? 'hidden' : 'visible'
            }}
          >
            Иконки
          </h3>
          
          {/* Поле поиска - открывается на месте заголовка */}
          {(
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск иконок..."
              style={{
                position: isSearchOpen ? 'relative' : 'absolute',
                left: 0,
                top: 0,
                width: isSearchOpen ? '200px' : '0',
                padding: isSearchOpen ? '6px 10px' : '0',
                border: 'none',
                background: 'transparent',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isSearchOpen ? 1 : 0,
                outline: 'none',
                pointerEvents: isSearchOpen ? 'auto' : 'none',
                zIndex: 10
              }}
              onBlur={(e) => {
                // Не закрываем если поле в фокусе или есть текст
                if (!searchQuery && !e.currentTarget.value) {
                  setTimeout(() => setIsSearchOpen(false), 200)
                }
              }}
            />
          )}
        </div>
        
        {/* Кнопки Контур/Заливка */}
        {(
          <div style={{ 
            display: 'flex', 
            gap: '3px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            flex: '0 0 auto',
            opacity: isSearchOpen ? 0 : 1,
            pointerEvents: isSearchOpen ? 'none' : 'auto',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: isSearchOpen ? 0 : 'auto',
            overflow: isSearchOpen ? 'hidden' : 'visible'
          }}>
            <button
              className={`dm-icon-variant-btn ${variant === 'outline' ? 'active' : ''}`}
              onClick={() => setVariant('outline')}
              style={{
                padding: '5px 10px',
                border: 'none',
                background: variant === 'outline' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))' 
                  : 'transparent',
                color: variant === 'outline' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: variant === 'outline' ? '600' : '400',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: variant === 'outline' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : 'none',
                textShadow: variant === 'outline' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (variant !== 'outline') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                }
              }}
              onMouseLeave={(e) => {
                if (variant !== 'outline') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                }
              }}
            >
              Контур
            </button>
            <button
              className={`dm-icon-variant-btn ${variant === 'solid' ? 'active' : ''}`}
              onClick={() => setVariant('solid')}
              style={{
                padding: '5px 10px',
                border: 'none',
                background: variant === 'solid' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))' 
                  : 'transparent',
                color: variant === 'solid' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: variant === 'solid' ? '600' : '400',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: variant === 'solid' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : 'none',
                textShadow: variant === 'solid' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (variant !== 'solid') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                }
              }}
              onMouseLeave={(e) => {
                if (variant !== 'solid') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                }
              }}
            >
              Заливка
            </button>
          </div>
        )}

        {/* Иконка поиска и цвет */}
        {(
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            flex: '1 1 auto',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'visible',
              justifyContent: 'flex-end',
              position: 'relative'
            }}>
              {/* Кнопка выбора цвета - скрывается при открытом поиске, но место занимает */}
              <div style={{
                opacity: isSearchOpen ? 0 : 1,
                width: '20px', // Фиксированная ширина кнопки цвета
                height: '20px',
                flex: '0 0 auto',
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isSearchOpen ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CustomColorPicker
                  value={selectedIconColor}
                  onChange={setSelectedIconColor}
                />
              </div>
              
              {/* Иконка поиска - всегда видна, рядом с кнопкой цвета */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen)
                  if (!isSearchOpen) {
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('input[placeholder="Поиск иконок..."]')
                      if (inputs.length > 0) {
                        inputs[inputs.length - 1].focus()
                      }
                    }, 150)
                  } else {
                    setSearchQuery('')
                  }
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: '0',
                  margin: '0',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  borderRadius: '4px',
                  flex: '0 0 auto',
                  position: 'relative',
                  zIndex: 100,
                  visibility: 'visible',
                  opacity: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block' }}>
                  <circle cx="7" cy="7" r="4"/>
                  <path d="m10 10 3 3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Вкладки категорий */}
      <div style={{
        marginBottom: '12px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.12) transparent'
      }}
      className="dm-categories-scroll"
      >
        <div style={{
          display: 'flex',
          gap: '3px',
          paddingBottom: '2px',
          minWidth: 'max-content'
        }}>
          {ICON_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: activeCategoryId === category.id
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                  : 'rgba(255, 255, 255, 0.04)',
                color: activeCategoryId === category.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: activeCategoryId === category.id ? '500' : '400',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeCategoryId === category.id
                  ? '0 1px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  : 'none',
                textShadow: activeCategoryId === category.id ? '0 1px 1px rgba(0, 0, 0, 0.2)' : 'none',
                whiteSpace: 'nowrap',
                flex: '0 0 auto',
                lineHeight: '1.2'
              }}
              onMouseEnter={(e) => {
                if (activeCategoryId !== category.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategoryId !== category.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список иконок */}
      {loadingIcons ? (
        <Loader fullscreen={false} size="minimal" showText={false} />
      ) : (
        <div 
          className="dm-icons-grid-scroll"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: '12px',
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.12) transparent'
          }}
        >
          {filteredIcons.map(icon => (
            <IconGridItem
              key={`${icon.provider}-${icon.name}`}
              icon={icon}
              variant={variant}
              selectedIconColor={selectedIconColor}
              loadingIcon={loadingIcon}
              onLoadIcon={loadIcon}
              onDownloadSVG={downloadIconSVG}
              onDownloadPNG={downloadIconPNG}
              onDownloadJPEG={downloadIconJPEG}
            />
          ))}
        </div>
      )}

      {!loadingIcons && filteredIcons.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--dm-text-soft)', fontSize: '13px', marginTop: '20px' }}>
          Иконки не найдены
        </p>
      )}
    </div>
  )
}
