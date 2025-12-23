// src/editorV2/panels/VideoSettingsPanel.jsx
import React, { useState } from 'react'
import settingIcon from '../../assets/seting.svg'

export default function VideoSettingsPanel({ video, onUpdate, onDelete, onDuplicate }) {
  const [expandedSections, setExpandedSections] = useState({
    position: true,
    opacity: true,
    transform: true,
    blend: true,
    flip: true,
    style: true,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleChange = (updates) => {
    if (video && onUpdate) {
      onUpdate({ ...video, ...updates })
    }
  }
  
  // Если видео не передан, показываем заглушку
  if (!video) {
    return (
      <div className="dm-sticker-settings-empty">
        <div className="dm-sticker-settings-empty-icon">
          <img src={settingIcon} alt="Settings" style={{ width: '120px', height: '120px', opacity: 0.3 }} />
        </div>
        <p>Выберите видео для настройки</p>
      </div>
    )
  }

  return (
    <div className="dm-sticker-settings-panel">
      {/* Заголовок */}
      <div className="dm-sticker-settings-header">
        <h3>Настройки видео</h3>
      </div>

      {/* Действия - в одну строку */}
      <div className="dm-sticker-settings-actions" style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="dm-sticker-action-btn dm-sticker-action-duplicate"
          onClick={onDuplicate}
          title="Дублировать"
          style={{ flex: 1 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M2 9V3C2 2.44772 2.44772 2 3 2H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Дублировать
        </button>
        <button 
          className="dm-sticker-action-btn dm-sticker-action-delete"
          onClick={onDelete}
          title="Удалить"
          style={{ flex: 1 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 4H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M5.5 2H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M3.5 4V11C3.5 11.5523 3.94772 12 4.5 12H9.5C10.0523 12 10.5 11.5523 10.5 11V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Удалить
        </button>
      </div>

      <div className="dm-sticker-settings-content">
        
        {/* Позиция и размер */}
        <Section 
          title="Позиция и размер" 
          expanded={expandedSections.position}
          onToggle={() => toggleSection('position')}
        >
          <div className="dm-settings-row">
            <label>Позиция X (%)</label>
            <input 
              type="number" 
              value={Math.round(video.x || 50)}
              onChange={(e) => handleChange({ x: Number(e.target.value) })}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Позиция Y (%)</label>
            <input 
              type="number" 
              value={Math.round(video.y || 50)}
              onChange={(e) => handleChange({ y: Number(e.target.value) })}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Масштаб</label>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.01"
              value={video.scale || 1}
              onChange={(e) => handleChange({ scale: Number(e.target.value) })}
              className="dm-settings-slider"
            />
            <input 
              type="number" 
              value={Math.round((video.scale || 1) * 100)}
              onChange={(e) => handleChange({ scale: Number(e.target.value) / 100 })}
              className="dm-settings-input-small"
            />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>%</span>
          </div>
        </Section>

        {/* Трансформация */}
        <Section 
          title="Трансформация" 
          expanded={expandedSections.transform}
          onToggle={() => toggleSection('transform')}
        >
          <div className="dm-settings-row">
            <label>Поворот</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={video.rotation || 0}
              onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
              className="dm-settings-slider"
            />
            <input 
              type="number" 
              value={video.rotation || 0}
              onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
              className="dm-settings-input-small"
            />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>В°</span>
          </div>
        </Section>

        {/* Прозрачность */}
        <Section 
          title="Прозрачность" 
          expanded={expandedSections.opacity}
          onToggle={() => toggleSection('opacity')}
        >
          <div className="dm-settings-row">
            <label>{Math.round((video.opacity || 1) * 100)}%</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={video.opacity || 1}
              onChange={(e) => handleChange({ opacity: Number(e.target.value) })}
              className="dm-settings-slider"
            />
          </div>
        </Section>

        {/* Blend Mode */}
        <Section 
          title="Режим смешивания" 
          expanded={expandedSections.blend}
          onToggle={() => toggleSection('blend')}
        >
          <div className="dm-settings-row">
            <label>Режим</label>
            <select
              className="dm-settings-select"
              value={video.blendMode || 'normal'}
              onChange={(e) => handleChange({ blendMode: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="screen">Screen</option>
              <option value="multiply">Multiply</option>
              <option value="overlay">Overlay</option>
              <option value="soft-light">Soft Light</option>
            </select>
          </div>
        </Section>

        {/* Flip */}
        <Section 
          title="Отражение" 
          expanded={expandedSections.flip}
          onToggle={() => toggleSection('flip')}
        >
          <div className="dm-settings-row">
            <label>
              <input 
                type="checkbox" 
                checked={video.flipX || false}
                onChange={(e) => handleChange({ flipX: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Отражение по горизонтали
            </label>
          </div>
          <div className="dm-settings-row">
            <label>
              <input 
                type="checkbox" 
                checked={video.flipY || false}
                onChange={(e) => handleChange({ flipY: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Отражение по вертикали
            </label>
          </div>
        </Section>

        {/* Style (Corner Radius, Crop) */}
        <Section 
          title="Стиль" 
          expanded={expandedSections.style}
          onToggle={() => toggleSection('style')}
        >
          <div className="dm-settings-row">
            <label>Скругление углов (px)</label>
            <input 
              type="range" 
              min="0" 
              max="40" 
              step="1"
              value={video.cornerRadius || 0}
              onChange={(e) => handleChange({ cornerRadius: Number(e.target.value) })}
              className="dm-settings-slider"
            />
            <input 
              type="number" 
              value={video.cornerRadius || 0}
              onChange={(e) => handleChange({ cornerRadius: Number(e.target.value) })}
              className="dm-settings-input-small"
            />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>px</span>
          </div>
          <div className="dm-settings-row">
            <label>Позиция объекта</label>
            <select
              className="dm-settings-select"
              value={video.objectPosition || 'center'}
              onChange={(e) => handleChange({ objectPosition: e.target.value })}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom right">Bottom Right</option>
            </select>
          </div>
        </Section>

      </div>
    </div>
  )
}

// Компонент секции
function Section({ title, expanded, onToggle, children }) {
  return (
    <div className="dm-settings-section">
      <button 
        className="dm-settings-section-header"
        onClick={onToggle}
      >
        <span>{title}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
          style={{ 
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && (
        <div className="dm-settings-section-content">
          {children}
        </div>
      )}
    </div>
  )
}

