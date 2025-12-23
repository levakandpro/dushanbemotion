// src/editorV2/timeline/stickers/StickerClipContextMenu.jsx
import React from 'react'

export default function StickerClipContextMenu({
  clip,
  position,
  onClose,
  onSplitAtPlayhead,
  onDuplicate,
  onToggleHidden,
  onDelete,
  onSelectOnCanvas,
  onGoToStart,
  onGoToEnd,
  onSnapStartToBeat,
  onSnapEndToBeat,
  canSnapToBeats
}) {
  
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.sticker-clip-context-menu')) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const menuItems = [
    { 
      label: 'Разрезать по плейхеду', 
      icon: '✂️', 
      action: () => { onSplitAtPlayhead(); onClose(); }
    },
    { 
      label: 'Дублировать клип', 
      icon: '📋', 
      action: () => { onDuplicate(); onClose(); }
    },
    { 
      label: clip.hidden ? 'Показать клип' : 'Скрыть клип', 
      icon: clip.hidden ? '👁️' : '🙈', 
      action: () => { onToggleHidden(); onClose(); }
    },
    { type: 'divider' },
    { 
      label: 'Выделить на сцене', 
      icon: '🎯', 
      action: () => { onSelectOnCanvas(); onClose(); }
    },
    { 
      label: 'Перейти к началу', 
      icon: '⏮', 
      action: () => { onGoToStart(); onClose(); }
    },
    { 
      label: 'Перейти к концу', 
      icon: '⏭', 
      action: () => { onGoToEnd(); onClose(); }
    },
  ]

  // Добавляем опции снэпа к битам если доступно
  if (canSnapToBeats) {
    menuItems.push(
      { type: 'divider' },
      { 
        label: 'Начало → Ближайший бит', 
        icon: '🎵', 
        action: () => { onSnapStartToBeat(); onClose(); }
      },
      { 
        label: 'Конец → Ближайший бит', 
        icon: '🎵', 
        action: () => { onSnapEndToBeat(); onClose(); }
      }
    )
  }

  menuItems.push(
    { type: 'divider' },
    { 
      label: 'Удалить клип', 
      icon: '🗑️', 
      action: () => { onDelete(); onClose(); },
      danger: true
    }
  )

  return (
    <div
      className="sticker-clip-context-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className="context-menu-divider" />
        }
        
        return (
          <button
            key={index}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={item.action}
          >
            <span className="context-menu-icon">{item.icon}</span>
            <span className="context-menu-label">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

