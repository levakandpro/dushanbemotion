// src/editorV2/panels/IconSettingsPanel.jsx
import React, { useState } from 'react'
import settingIcon from '../../assets/seting.svg'
import ColorPicker from '../components/ColorPicker'

export default function IconSettingsPanel({ icon, onUpdate, onDelete, onDuplicate }) {
  console.log('IconSettingsPanel render:', { icon, hasIcon: !!icon, hasOnUpdate: !!onUpdate })
  
  const [expandedSections, setExpandedSections] = useState({
    position: true,
    color: true,
    opacity: true,
    stroke: true,
    shadow: true,
    layer: true,
    filters: true,
    animation: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleChange = (updates) => {
    console.log('IconSettingsPanel handleChange:', { iconId: icon?.id, updates })
    if (icon && onUpdate) {
      onUpdate(updates) // Передаем только обновления, не весь объект
    }
  }
  
  // Если иконка не передана, показываем заглушку
  if (!icon) {
    console.log('IconSettingsPanel: NO ICON')
    return (
      <div className="dm-sticker-settings-empty">
        <div className="dm-sticker-settings-empty-icon">
          <img src={settingIcon} alt="Settings" style={{ width: '120px', height: '120px', opacity: 0.3 }} />
        </div>
        <p>Выберите иконку для настройки</p>
      </div>
    )
  }
  
  console.log('IconSettingsPanel: rendering with icon', icon.id)

  return (
    <div className="dm-sticker-settings-panel">
      {/* Заголовок */}
      <div className="dm-sticker-settings-header">
        <h3>Настройки иконки</h3>
      </div>

      {/* Действия */}
      <div className="dm-sticker-settings-actions">
        <button 
          className="dm-sticker-action-btn dm-sticker-action-duplicate"
          onClick={onDuplicate}
          title="Дублировать"
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
            <label>Ширина</label>
            <input 
              type="number" 
              value={Math.round(icon.width || 100)}
              onChange={(e) => handleChange({ 
                width: Number(e.target.value),
                height: icon.locked ? (Number(e.target.value) / (icon.width / icon.height)) : icon.height
              })}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Высота</label>
            <input 
              type="number" 
              value={Math.round(icon.height || 100)}
              onChange={(e) => handleChange({ 
                height: Number(e.target.value),
                width: icon.locked ? (Number(e.target.value) * (icon.width / icon.height)) : icon.width
              })}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Поворот</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={icon.rotation || 0}
              onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
              className="dm-settings-slider"
            />
            <input 
              type="number" 
              value={icon.rotation || 0}
              onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
              className="dm-settings-input-small"
            />
          </div>
        </Section>

        {/* Цвет */}
        <Section 
          title="Цвет" 
          expanded={expandedSections.color}
          onToggle={() => toggleSection('color')}
        >
          <div className="dm-settings-row">
            <label>Цвет иконки</label>
            <ColorPicker
              value={icon.color || '#00c584'}
              onChange={(color) => handleChange({ color })}
              defaultValue="#00c584"
            />
          </div>
        </Section>

        {/* Прозрачность */}
        <Section 
          title="Прозрачность" 
          expanded={expandedSections.opacity}
          onToggle={() => toggleSection('opacity')}
        >
          <div className="dm-settings-row">
            <label>{Math.round((icon.opacity || 1) * 100)}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={(icon.opacity || 1) * 100}
              onChange={(e) => handleChange({ opacity: Number(e.target.value) / 100 })}
              className="dm-settings-slider"
            />
          </div>
        </Section>

        {/* Обводка */}
        <Section 
          title="Обводка" 
          expanded={expandedSections.stroke}
          onToggle={() => toggleSection('stroke')}
          badge="в­ђ"
        >
          <div className="dm-settings-row">
            <label>Включить</label>
            <input 
              type="checkbox" 
              checked={icon.stroke?.enabled || false}
              onChange={(e) => handleChange({ 
                stroke: { ...(icon.stroke || {}), enabled: e.target.checked }
              })}
              className="dm-settings-checkbox"
            />
          </div>
          {icon.stroke?.enabled && (
            <>
              <div className="dm-settings-row">
                <label>Цвет</label>
                <ColorPicker
                  value={icon.stroke?.color || '#ffffff'}
                  onChange={(color) => handleChange({ 
                    stroke: { ...icon.stroke, color }
                  })}
                  defaultValue="#ffffff"
                />
              </div>
              <div className="dm-settings-row">
                <label>Толщина</label>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={icon.stroke?.width || 2}
                  onChange={(e) => handleChange({ 
                    stroke: { ...icon.stroke, width: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
              </div>
            </>
          )}
        </Section>

        {/* Тень */}
        <Section 
          title="Тень" 
          expanded={expandedSections.shadow}
          onToggle={() => toggleSection('shadow')}
          badge="в­ђ"
        >
          <div className="dm-settings-row">
            <label>Включить</label>
            <input 
              type="checkbox" 
              checked={icon.shadow?.enabled || false}
              onChange={(e) => handleChange({ 
                shadow: { ...(icon.shadow || {}), enabled: e.target.checked }
              })}
              className="dm-settings-checkbox"
            />
          </div>
          {icon.shadow?.enabled && (
            <>
              <div className="dm-settings-row">
                <label>Цвет</label>
                <ColorPicker
                  value={icon.shadow?.color || '#000000'}
                  onChange={(color) => handleChange({ 
                    shadow: { ...icon.shadow, color }
                  })}
                  defaultValue="#000000"
                />
              </div>
              <div className="dm-settings-row">
                <label>Смещение X</label>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={icon.shadow?.offsetX || 0}
                  onChange={(e) => handleChange({ 
                    shadow: { ...icon.shadow, offsetX: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
              </div>
              <div className="dm-settings-row">
                <label>Смещение Y</label>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={icon.shadow?.offsetY || 0}
                  onChange={(e) => handleChange({ 
                    shadow: { ...icon.shadow, offsetY: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
              </div>
              <div className="dm-settings-row">
                <label>Размытие</label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={icon.shadow?.blur || 10}
                  onChange={(e) => handleChange({ 
                    shadow: { ...icon.shadow, blur: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
              </div>
              <div className="dm-settings-row">
                <label>Прозрачность</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={(icon.shadow?.opacity || 0.5) * 100}
                  onChange={(e) => handleChange({ 
                    shadow: { ...icon.shadow, opacity: Number(e.target.value) / 100 }
                  })}
                  className="dm-settings-slider"
                />
              </div>
            </>
          )}
        </Section>

        {/* Слой */}
        <Section 
          title="Слой" 
          expanded={expandedSections.layer}
          onToggle={() => toggleSection('layer')}
        >
          <div className="dm-settings-button-group">
            <button 
              className="dm-settings-btn"
              onClick={() => handleChange({ zIndex: (icon.zIndex || 1) + 1 })}
            >
              в¬† Вперёд
            </button>
            <button 
              className="dm-settings-btn"
              onClick={() => handleChange({ zIndex: Math.max(0, (icon.zIndex || 1) - 1) })}
            >
              в¬‡ Назад
            </button>
          </div>
          <div className="dm-settings-row">
            <label>Заблокировать</label>
            <input 
              type="checkbox" 
              checked={icon.locked || false}
              onChange={(e) => handleChange({ locked: e.target.checked })}
              className="dm-settings-checkbox"
            />
          </div>
        </Section>

        {/* Цветовые фильтры (Premium) */}
        <Section 
          title="Цветовые фильтры" 
          expanded={expandedSections.filters}
          onToggle={() => toggleSection('filters')}
          badge="в­ђ"
        >
          <div className="dm-settings-row">
            <label>Яркость</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={icon.filters?.brightness || 100}
              onChange={(e) => handleChange({ 
                filters: { ...(icon.filters || {}), brightness: Number(e.target.value) }
              })}
              className="dm-settings-slider"
            />
          </div>
          <div className="dm-settings-row">
            <label>Контраст</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={icon.filters?.contrast || 100}
              onChange={(e) => handleChange({ 
                filters: { ...(icon.filters || {}), contrast: Number(e.target.value) }
              })}
              className="dm-settings-slider"
            />
          </div>
          <div className="dm-settings-row">
            <label>Насыщенность</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={icon.filters?.saturation || 100}
              onChange={(e) => handleChange({ 
                filters: { ...(icon.filters || {}), saturation: Number(e.target.value) }
              })}
              className="dm-settings-slider"
            />
          </div>
        </Section>

        {/* Анимация (Premium) */}
        <Section 
          title="Анимация" 
          expanded={expandedSections.animation}
          onToggle={() => toggleSection('animation')}
          badge="в­ђ"
        >
          <AnimationSelector icon={icon} onChange={handleChange} />
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children, expanded, onToggle, badge }) {
  return (
    <div className="dm-settings-section">
      <button className="dm-settings-section-header" onClick={onToggle}>
        <span className="dm-settings-section-title">
          {title}
          {badge && <span className="dm-settings-badge">{badge}</span>}
        </span>
        <span className={`dm-settings-section-arrow ${expanded ? 'expanded' : ''}`}>›</span>
      </button>
      {expanded && (
        <div className="dm-settings-section-content">
          {children}
        </div>
      )}
    </div>
  )
}

function AnimationSelector({ icon, onChange }) {
  const [activeCategory, setActiveCategory] = useState('entrance')
  
  const animations = {
    entrance: [
      { id: 'fadeIn', label: 'Fade In', free: true },
      { id: 'moveIn', label: 'Move In', free: true },
      { id: 'zoomIn', label: 'Zoom In', free: true },
      { id: 'rotateIn', label: 'Rotate In', free: true },
      { id: 'pop', label: 'Pop', free: true },
      { id: 'bounce', label: 'Bounce', free: true },
    ],
    exit: [
      { id: 'fadeOut', label: 'Fade Out', free: true },
      { id: 'moveOut', label: 'Move Out', free: true },
      { id: 'zoomOut', label: 'Zoom Out', free: true },
      { id: 'rotateOut', label: 'Rotate Out', free: true },
    ],
    motion: [
      { id: 'wiggle', label: 'Wiggle', free: false },
      { id: 'shake', label: 'Shake', free: false },
      { id: 'pulse', label: 'Pulse', free: false },
      { id: 'drift', label: 'Drift', free: false },
      { id: 'sway', label: 'Sway', free: false },
      { id: 'float', label: 'Float Up', free: false },
      { id: 'swing', label: 'Swing', free: false },
    ],
    fx: [
      { id: 'neonGlow', label: 'Neon Glow', free: false },
      { id: 'glitch', label: 'Glitch', free: false },
      { id: 'chromatic', label: 'Chromatic', free: false },
      { id: 'fireFlicker', label: 'Fire Flicker', free: false },
      { id: 'vhsWobble', label: 'VHS Wobble', free: false },
      { id: 'liquidWarp', label: 'Liquid Warp', free: false },
      { id: 'shockwave', label: 'Shockwave', free: false },
      { id: 'flashPulse', label: 'Flash Pulse', free: false },
    ],
    beat: [
      { id: 'beatPulse', label: 'Beat Pulse', free: false },
      { id: 'beatGlow', label: 'Beat Glow', free: false },
      { id: 'beatBounce', label: 'Beat Bounce', free: false },
      { id: 'beatShock', label: 'Beat Shock', free: false },
    ]
  }

  const categories = [
    { id: 'entrance', label: 'Вход' },
    { id: 'exit', label: 'Выход' },
    { id: 'motion', label: 'Движение' },
    { id: 'fx', label: 'FX' },
    { id: 'beat', label: '🎵 БИТ', premium: true }
  ]

  return (
    <div className="dm-animation-selector">
      {/* Категории */}
      <div className="dm-animation-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`dm-animation-category-btn ${activeCategory === cat.id ? 'active' : ''} ${cat.premium ? 'premium' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Список анимаций */}
      <div className="dm-animation-list">
        {animations[activeCategory].map(anim => (
          <button
            key={anim.id}
            className={`dm-animation-item ${icon.animation?.type === anim.id ? 'active' : ''} ${!anim.free ? 'premium' : ''}`}
            onClick={() => onChange({ 
              animation: { 
                type: anim.id, 
                duration: icon.animation?.duration || 1, 
                delay: icon.animation?.delay || 0, 
                loop: icon.animation?.loop || 'none',
                easing: icon.animation?.easing || 'ease-in-out'
              } 
            })}
          >
            {anim.label}
            {!anim.free && <span className="dm-animation-premium">в­ђ</span>}
          </button>
        ))}
      </div>

      {/* Настройки анимации */}
      {icon.animation?.type && (
        <div className="dm-animation-settings">
          {/* Если это Beat анимация - показываем специальные настройки */}
          {icon.animation?.type?.startsWith('beat') ? (
            <>
              <div className="dm-settings-row">
                <label>Интенсивность</label>
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  value={icon.animation?.beatIntensity || 100}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, beatIntensity: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
                <span className="dm-settings-value">{icon.animation?.beatIntensity || 100}%</span>
              </div>
              <div className="dm-settings-row">
                <label>Фильтр битов</label>
                <select 
                  value={icon.animation?.beatFilter || 'all'}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, beatFilter: e.target.value }
                  })}
                  className="dm-settings-select"
                >
                  <option value="all">Все удары</option>
                  <option value="strong">Только сильные</option>
                  <option value="1/2">Каждые 2 удара</option>
                  <option value="1/4">Каждые 4 удара</option>
                </select>
              </div>
              <div className="dm-beat-sync-indicator">
                <span>🎵</span>
                <span>Синхронизация с музыкой включена</span>
              </div>
            </>
          ) : (
            <>
              <div className="dm-settings-row">
                <label>Скорость (сек)</label>
                <input 
                  type="range" 
                  min="0.3" 
                  max="3" 
                  step="0.1"
                  value={icon.animation?.duration || 1}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, duration: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
                <span className="dm-settings-value">{icon.animation?.duration || 1}s</span>
              </div>
              <div className="dm-settings-row">
                <label>Задержка (сек)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={icon.animation?.delay || 0}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, delay: Number(e.target.value) }
                  })}
                  className="dm-settings-slider"
                />
                <span className="dm-settings-value">{icon.animation?.delay || 0}s</span>
              </div>
              <div className="dm-settings-row">
                <label>Повтор</label>
                <select 
                  value={icon.animation?.loop || 'none'}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, loop: e.target.value }
                  })}
                  className="dm-settings-select"
                >
                  <option value="none">Нет</option>
                  <option value="once">1 раз</option>
                  <option value="infinite">Бесконечно</option>
                  <option value="pingpong">Ping-Pong</option>
                </select>
              </div>
              <div className="dm-settings-row">
                <label>Кривая</label>
                <select 
                  value={icon.animation?.easing || 'ease-in-out'}
                  onChange={(e) => onChange({ 
                    animation: { ...icon.animation, easing: e.target.value }
                  })}
                  className="dm-settings-select"
                >
                  <option value="ease-in-out">Ease In Out</option>
                  <option value="ease">Ease</option>
                  <option value="linear">Linear</option>
                  <option value="spring">Spring</option>
                  <option value="elastic">Elastic</option>
                  <option value="bounce">Bounce</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

