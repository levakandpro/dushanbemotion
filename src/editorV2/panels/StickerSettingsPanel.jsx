// src/editorV2/panels/StickerSettingsPanel.jsx
import React, { useState, useRef } from 'react'
import settingIcon from '../../assets/seting.svg'
import ColorPicker from '../components/ColorPicker'

function Section({ title, expanded, onToggle, children, onReset }) {
  return (
    <div className="dm-settings-section">
      <button 
        className="dm-settings-section-header"
        onClick={onToggle}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onReset && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onReset()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'currentColor',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              title="Сбросить секцию"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V7M7 7L4 4M7 7L10 4M2 7C2 9.76142 4.23858 12 7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
            style={{ 
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="dm-settings-section-content">
          {children}
        </div>
      )}
    </div>
  )
}

export default function StickerSettingsPanel({ sticker, onUpdate, onDelete, onDuplicate, onReset, project, stickerLayers, onGroup, onUngroup }) {
  // Состояние для множественного выбора стикеров для группировки
  const [selectedForGrouping, setSelectedForGrouping] = useState(() => {
    // По умолчанию выбираем текущий стикер, если он есть
    return sticker?.id ? new Set([sticker.id]) : new Set()
  })
  
  // Обновляем выбор при изменении текущего стикера
  React.useEffect(() => {
    if (sticker?.id && !selectedForGrouping.has(sticker.id)) {
      setSelectedForGrouping(new Set([sticker.id]))
    }
  }, [sticker?.id])
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    position: true,
    effects: true,
    actions: true,
    grouping: true
  })

  const [localValues, setLocalValues] = useState(() => ({
    width: sticker?.width || 100,
    height: sticker?.height || 100,
    x: sticker?.x || 50, // StickerLayer использует проценты
    y: sticker?.y || 50,
    rotation: sticker?.rotation || 0,
    opacity: sticker?.opacity ?? 1,
    flipX: sticker?.flipX || false,
    flipY: sticker?.flipY || false,
    brightness: sticker?.filters?.brightness ?? 100,
    contrast: sticker?.filters?.contrast ?? 100,
    saturation: sticker?.filters?.saturation ?? 100,
    hue: sticker?.filters?.hue || 0,
    blur: sticker?.filters?.blur || 0,
    shadowColor: sticker?.shadow?.color || '#000000',
    shadowX: sticker?.shadow?.offsetX || 0,
    shadowY: sticker?.shadow?.offsetY || 0,
    shadowBlur: sticker?.shadow?.blur || 0,
    strokeColor: sticker?.stroke?.color || '#000000',
    strokeWidth: sticker?.stroke?.width || 0,
    glowColor: sticker?.glowColor || '#ffffff',
    glowRadius: sticker?.glowRadius || 0,
    filter: sticker?.filter || 'none',
    blendMode: sticker?.blendMode || 'normal',
    groupId: sticker?.groupId || null
  }))

  const initialValuesRef = useRef(localValues)
  // Сохраняем последние значения, чтобы они не терялись при удалении стикера
  const lastStickerValuesRef = useRef(localValues)

  React.useEffect(() => {
    if (sticker) {
      const newValues = {
        width: sticker.width || 100,
        height: sticker.height || 100,
        x: sticker.x || 50,
        y: sticker.y || 50,
        rotation: sticker.rotation || 0,
        opacity: sticker.opacity ?? 1,
        flipX: sticker.flipX || false,
        flipY: sticker.flipY || false,
        brightness: sticker.filters?.brightness ?? 100,
        contrast: sticker.filters?.contrast ?? 100,
        saturation: sticker.filters?.saturation ?? 100,
        hue: sticker.filters?.hue || 0,
        blur: sticker.filters?.blur || 0,
        shadowColor: sticker.shadow?.color || '#000000',
        shadowX: sticker.shadow?.offsetX || 0,
        shadowY: sticker.shadow?.offsetY || 0,
        shadowBlur: sticker.shadow?.blur || 0,
        strokeColor: sticker.stroke?.color || '#000000',
        strokeWidth: sticker.stroke?.width || 0,
        glowColor: sticker.glowColor || '#ffffff',
        glowRadius: sticker.glowRadius || 0,
        filter: sticker.filter || 'none',
        blendMode: sticker.blendMode || 'normal',
        groupId: sticker.groupId || null
      }
      setLocalValues(newValues)
      initialValuesRef.current = newValues
      lastStickerValuesRef.current = newValues
    } else {
      // Если стикер удален, используем последние сохраненные значения
      setLocalValues(lastStickerValuesRef.current)
    }
  }, [sticker?.id])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const applyUpdates = React.useCallback((values) => {
    if (sticker && onUpdate) {
      // Преобразуем значения в формат, который ожидает StickerLayer
      const updates = {
        width: values.width,
        height: values.height,
        x: values.x, // StickerLayer использует проценты для позиции
        y: values.y,
        rotation: values.rotation,
        opacity: values.opacity,
        flipX: values.flipX,
        flipY: values.flipY,
        // Фильтры в формате filters
        filters: {
          brightness: values.brightness,
          contrast: values.contrast,
          saturation: values.saturation,
          hue: values.hue,
          blur: values.blur
        },
        // Тени в формате shadow
        shadow: {
          enabled: values.shadowBlur > 0 || values.shadowX !== 0 || values.shadowY !== 0,
          offsetX: values.shadowX,
          offsetY: values.shadowY,
          blur: values.shadowBlur,
          color: values.shadowColor,
          opacity: 1
        },
        // Обводка в формате stroke
        stroke: {
          enabled: values.strokeWidth > 0,
          width: values.strokeWidth,
          color: values.strokeColor
        },
        // Свечение и цветовые фильтры нужно добавить в filter через CSS
        glowColor: values.glowColor,
        glowRadius: values.glowRadius,
        filter: values.filter,
        // Режим наложения
        blendMode: values.blendMode,
        // Группировка
        groupId: values.groupId
      }
      onUpdate(updates)
    }
  }, [sticker, onUpdate])

  // Копирование стилей
  const [copiedStyles, setCopiedStyles] = React.useState(null)

  const stickerEffects = sticker?.effects || {}
  const updateEffects = React.useCallback((patch) => {
    if (!sticker || !onUpdate) return
    const next = { ...(sticker.effects || {}), ...(patch || {}) }
    onUpdate({ effects: next })
  }, [sticker, onUpdate])
  const toggleEffect = React.useCallback((key) => {
    if (!sticker || !onUpdate) return
    const cur = sticker.effects || {}
    onUpdate({ effects: { ...cur, [key]: !cur[key] } })
  }, [sticker, onUpdate])
  
  const handleCopyStyles = () => {
    const stylesToCopy = {
      filters: {
        brightness: localValues.brightness,
        contrast: localValues.contrast,
        saturation: localValues.saturation,
        hue: localValues.hue,
        blur: localValues.blur
      },
      shadow: {
        enabled: localValues.shadowBlur > 0 || localValues.shadowX !== 0 || localValues.shadowY !== 0,
        offsetX: localValues.shadowX,
        offsetY: localValues.shadowY,
        blur: localValues.shadowBlur,
        color: localValues.shadowColor,
        opacity: 1
      },
      stroke: {
        enabled: localValues.strokeWidth > 0,
        width: localValues.strokeWidth,
        color: localValues.strokeColor
      },
      glowColor: localValues.glowColor,
      glowRadius: localValues.glowRadius,
      filter: localValues.filter,
      blendMode: localValues.blendMode,
      opacity: localValues.opacity,
      rotation: localValues.rotation,
      flipX: localValues.flipX,
      flipY: localValues.flipY,
      effects: sticker?.effects || {}
    }
    setCopiedStyles(stylesToCopy)
    // Сохраняем в localStorage для использования между сессиями
    localStorage.setItem('dm-copied-sticker-styles', JSON.stringify(stylesToCopy))
  }

  const handlePasteStyles = () => {
    if (!copiedStyles) {
      // Пытаемся загрузить из localStorage
      const saved = localStorage.getItem('dm-copied-sticker-styles')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setCopiedStyles(parsed)
          applyCopiedStyles(parsed)
        } catch (e) {
          console.error('Failed to parse copied styles', e)
        }
      }
      return
    }
    applyCopiedStyles(copiedStyles)
  }

  const applyCopiedStyles = (styles) => {
    const newValues = {
      ...localValues,
      brightness: styles.filters?.brightness ?? localValues.brightness,
      contrast: styles.filters?.contrast ?? localValues.contrast,
      saturation: styles.filters?.saturation ?? localValues.saturation,
      hue: styles.filters?.hue ?? localValues.hue,
      blur: styles.filters?.blur ?? localValues.blur,
      shadowColor: styles.shadow?.color ?? localValues.shadowColor,
      shadowX: styles.shadow?.offsetX ?? localValues.shadowX,
      shadowY: styles.shadow?.offsetY ?? localValues.shadowY,
      shadowBlur: styles.shadow?.blur ?? localValues.shadowBlur,
      strokeColor: styles.stroke?.color ?? localValues.strokeColor,
      strokeWidth: styles.stroke?.width ?? localValues.strokeWidth,
      glowColor: styles.glowColor ?? localValues.glowColor,
      glowRadius: styles.glowRadius ?? localValues.glowRadius,
      filter: styles.filter ?? localValues.filter,
      blendMode: styles.blendMode ?? localValues.blendMode,
      opacity: styles.opacity ?? localValues.opacity,
      rotation: styles.rotation ?? localValues.rotation,
      flipX: styles.flipX ?? localValues.flipX,
      flipY: styles.flipY ?? localValues.flipY
    }
    setLocalValues(newValues)
    applyUpdates(newValues)

    if (styles.effects && sticker && onUpdate) {
      onUpdate({ effects: styles.effects })
    }
  }

  // Загружаем скопированные стили при монтировании
  React.useEffect(() => {
    const saved = localStorage.getItem('dm-copied-sticker-styles')
    if (saved) {
      try {
        setCopiedStyles(JSON.parse(saved))
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
  }, [])

  const handleChange = (key, value) => {
    const newValues = { ...localValues, [key]: value }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const handleIncrement = (key, step = 1) => {
    const newValue = (localValues[key] || 0) + step
    handleChange(key, newValue)
  }

  const handleDecrement = (key, step = 1) => {
    const newValue = (localValues[key] || 0) - step
    handleChange(key, newValue)
  }

  const handleReset = () => {
    // Сбрасываем все параметры к дефолтным значениям
    const defaults = {
      width: 100,
      height: 100,
      x: 50,
      y: 50,
      rotation: 0,
      opacity: 1,
      flipX: false,
      flipY: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      shadowColor: '#000000',
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 0,
      strokeColor: '#000000',
      strokeWidth: 0,
      glowColor: '#ffffff',
      glowRadius: 0,
      filter: 'none'
    }
    setLocalValues(defaults)
    applyUpdates(defaults)
    
    // Если есть внешний обработчик onReset, вызываем его
    if (sticker && onReset) {
      onReset()
    }
  }

  // Функции сброса для каждой секции
  const resetBasic = () => {
    const defaults = {
      width: 100,
      height: 100,
      opacity: 1,
      rotation: 0,
      flipX: false,
      flipY: false
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const resetPosition = () => {
    const defaults = {
      x: 50,
      y: 50
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const resetEffects = () => {
    const defaults = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      shadowColor: '#000000',
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 0,
      strokeColor: '#000000',
      strokeWidth: 0,
      glowColor: '#ffffff',
      glowRadius: 0,
      filter: 'none'
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  // Отдельные функции сброса для каждого блока эффектов
  const resetShadow = () => {
    const defaults = {
      shadowColor: '#000000',
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 0
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const resetStroke = () => {
    const defaults = {
      strokeColor: '#000000',
      strokeWidth: 0
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const resetGlow = () => {
    const defaults = {
      glowColor: '#ffffff',
      glowRadius: 0
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  const resetFilters = () => {
    const defaults = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      filter: 'none'
    }
    const newValues = { ...localValues, ...defaults }
    setLocalValues(newValues)
    applyUpdates(newValues)
  }

  // Не показываем пустое состояние - продолжаем показывать настройки
  // даже если стикер удален (значения остаются в localValues)

  return (
    <div className="dm-sticker-settings-panel">
      <div className="dm-sticker-settings-header">
        <h3>Настройки стикера</h3>
      </div>

      <div className="dm-sticker-settings-content">
        {/* Основные параметры */}
        <Section 
          title="Основные параметры" 
          expanded={expandedSections.basic}
          onToggle={() => toggleSection('basic')}
          onReset={resetBasic}
        >
          <div className="dm-settings-row">
            <label>Ширина</label>
            <input 
              type="number" 
              value={Math.round(localValues.width)}
              onChange={(e) => handleChange('width', Number(e.target.value))}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Высота</label>
            <input 
              type="number" 
              value={Math.round(localValues.height)}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              className="dm-settings-input"
            />
          </div>
          <div className="dm-settings-row">
            <label>Поворот</label>
            <input 
              type="number" 
              value={Math.round(localValues.rotation)}
              onChange={(e) => handleChange('rotation', Number(e.target.value))}
              className="dm-settings-input"
              min="-360"
              max="360" 
            />
          </div>
          <div className="dm-settings-row">
                <label>Прозрачность</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={localValues.opacity * 100}
              onChange={(e) => handleChange('opacity', Number(e.target.value) / 100)}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{Math.round(localValues.opacity * 100)}%</span>
          </div>
          <div className="dm-settings-row">
            <label>Зеркалить по X</label>
            <button
              type="button"
              className={`dm-toggle-switch ${localValues.flipX ? 'dm-toggle-switch-active' : ''}`}
              onClick={() => handleChange('flipX', !localValues.flipX)}
            >
              <div className="dm-toggle-switch-thumb" />
            </button>
          </div>
          <div className="dm-settings-row">
            <label>Зеркалить по Y</label>
            <button
              type="button"
              className={`dm-toggle-switch ${localValues.flipY ? 'dm-toggle-switch-active' : ''}`}
              onClick={() => handleChange('flipY', !localValues.flipY)}
            >
              <div className="dm-toggle-switch-thumb" />
            </button>
          </div>
        </Section>

        {/* Позиция */}
        <Section 
          title="Позиция" 
          expanded={expandedSections.position}
          onToggle={() => toggleSection('position')}
          onReset={resetPosition}
        >
          <div className="dm-settings-row">
            <label>X</label>
            <div className="dm-settings-input-with-controls">
            <button 
                type="button"
                className="dm-settings-control-btn dm-settings-control-btn-left"
                onClick={() => handleDecrement('x', 1)}
                title="Уменьшить"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <input 
                type="number" 
                value={Math.round(localValues.x)}
                onChange={(e) => handleChange('x', Number(e.target.value))}
                className="dm-settings-input"
              />
            <button 
                type="button"
                className="dm-settings-control-btn dm-settings-control-btn-right"
                onClick={() => handleIncrement('x', 1)}
                title="Увеличить"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
          </div>
              </div>
              <div className="dm-settings-row">
            <label>Y</label>
            <div className="dm-settings-input-with-controls">
              <button 
                type="button"
                className="dm-settings-control-btn dm-settings-control-btn-left"
                onClick={() => handleDecrement('y', 1)}
                title="Уменьшить"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
                <input 
                type="number" 
                value={Math.round(localValues.y)}
                onChange={(e) => handleChange('y', Number(e.target.value))}
                className="dm-settings-input"
              />
              <button 
                type="button"
                className="dm-settings-control-btn dm-settings-control-btn-right"
                onClick={() => handleIncrement('y', 1)}
                title="Увеличить"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              </div>
          </div>
        </Section>

        {/* Визуальные эффекты */}
        <Section 
          title="Визуальные эффекты" 
          expanded={expandedSections.effects}
          onToggle={() => toggleSection('effects')}
          onReset={resetEffects}
        >
          <div className="dm-settings-row">
            <label>Яркость</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={localValues.brightness}
              onChange={(e) => handleChange('brightness', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.brightness}%</span>
          </div>
              <div className="dm-settings-row">
            <label>Контраст</label>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={localValues.contrast}
              onChange={(e) => handleChange('contrast', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.contrast}%</span>
              </div>
              <div className="dm-settings-row">
            <label>Насыщенность</label>
                <input 
                  type="range" 
              min="0" 
              max="200" 
              value={localValues.saturation}
              onChange={(e) => handleChange('saturation', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.saturation}%</span>
              </div>
              <div className="dm-settings-row">
            <label>Оттенок</label>
                <input 
                  type="range" 
              min="-180" 
              max="180" 
              value={localValues.hue}
              onChange={(e) => handleChange('hue', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.hue}В°</span>
              </div>
              <div className="dm-settings-row">
                <label>Размытие</label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
              value={localValues.blur}
              onChange={(e) => handleChange('blur', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.blur}px</span>
              </div>
          
          <div className="dm-settings-divider" />
          
          {/* Блок Тени с кнопкой сброса */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ margin: 0, minWidth: '80px', color: 'var(--dm-text-muted)', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Тень</label>
            <button 
              type="button"
              onClick={resetShadow}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00E5CC',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.7,
                transition: 'opacity 0.2s',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V7M7 7L4 4M7 7L10 4M2 7C2 9.76142 4.23858 12 7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Сбросить
            </button>
          </div>
          <div className="dm-settings-row">
            <label>Тень - X</label>
            <input 
              type="range" 
              min="-50" 
              max="50" 
              value={localValues.shadowX}
              onChange={(e) => handleChange('shadowX', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.shadowX}px</span>
          </div>
          <div className="dm-settings-row">
            <label>Тень - Y</label>
            <input 
              type="range" 
              min="-50" 
              max="50" 
              value={localValues.shadowY}
              onChange={(e) => handleChange('shadowY', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.shadowY}px</span>
          </div>
          <div className="dm-settings-row">
            <label>Тень - Размытие</label>
            <input 
              type="range" 
              min="0" 
              max="50" 
              value={localValues.shadowBlur}
              onChange={(e) => handleChange('shadowBlur', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.shadowBlur}px</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <ColorPicker
              value={localValues.shadowColor}
              onChange={(color) => handleChange('shadowColor', color)}
              defaultValue="#000000"
            />
          </div>
          
          <div className="dm-settings-divider" />
          
          {/* Блок Обводки с кнопкой сброса */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ margin: 0, minWidth: '80px', color: 'var(--dm-text-muted)', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Обводка</label>
          <button
              type="button"
              onClick={resetStroke}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00E5CC',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.7,
                transition: 'opacity 0.2s',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V7M7 7L4 4M7 7L10 4M2 7C2 9.76142 4.23858 12 7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Сбросить
          </button>
      </div>
              <div className="dm-settings-row">
            <label>Толщина</label>
                <input 
                  type="range" 
                  min="0" 
              max="20" 
              value={localValues.strokeWidth}
              onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.strokeWidth}px</span>
              </div>
          <div style={{ marginTop: '8px' }}>
            <ColorPicker
              value={localValues.strokeColor}
              onChange={(color) => handleChange('strokeColor', color)}
              defaultValue="#000000"
            />
          </div>
          
          <div className="dm-settings-divider" />
          
          {/* Блок Свечения с кнопкой сброса */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ margin: 0, minWidth: '80px', color: 'var(--dm-text-muted)', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Свечение</label>
            <button
              type="button"
              onClick={resetGlow}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00E5CC',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.7,
                transition: 'opacity 0.2s',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V7M7 7L4 4M7 7L10 4M2 7C2 9.76142 4.23858 12 7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Сбросить
            </button>
              </div>
              <div className="dm-settings-row">
            <label>Радиус</label>
                <input 
                  type="range" 
                  min="0" 
              max="50" 
              value={localValues.glowRadius}
              onChange={(e) => handleChange('glowRadius', Number(e.target.value))}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{localValues.glowRadius}px</span>
              </div>
          <div style={{ marginTop: '8px' }}>
            <ColorPicker
              value={localValues.glowColor}
              onChange={(color) => handleChange('glowColor', color)}
              defaultValue="#ffffff"
            />
              </div>
          
          <div className="dm-settings-divider" />
          
              <div className="dm-settings-row">
            <label>Цветовой фильтр</label>
                <select 
              value={localValues.filter}
              onChange={(e) => handleChange('filter', e.target.value)}
                  className="dm-settings-select"
                >
                  <option value="none">Нет</option>
              <option value="grayscale">Черно-белое</option>
              <option value="sepia">Сепия</option>
              <option value="invert">Инверсия</option>
                </select>
              </div>
          
          <div className="dm-settings-divider" />
          
              <div className="dm-settings-row">
            <label>Режим наложения</label>
                <select 
              value={localValues.blendMode}
              onChange={(e) => handleChange('blendMode', e.target.value)}
                  className="dm-settings-select"
                >
              <option value="normal">Обычный</option>
              <option value="multiply">Умножение</option>
              <option value="screen">Экран</option>
              <option value="overlay">Перекрытие</option>
              <option value="soft-light">Мягкий свет</option>
              <option value="hard-light">Жесткий свет</option>
              <option value="color-dodge">Осветление основы</option>
              <option value="color-burn">Затемнение основы</option>
              <option value="darken">Затемнение</option>
              <option value="lighten">Осветление</option>
              <option value="difference">Разница</option>
              <option value="exclusion">Исключение</option>
                </select>
              </div>

          <div className="dm-settings-divider" />

          <div style={{ fontSize: '12px', fontWeight: 700, margin: '6px 0 10px', color: 'rgba(255,255,255,0.75)' }}>
            PREMIUM
          </div>

          <div className="dm-settings-row">
            <label>CINEMATIC B/W</label>
            <button
              type="button"
              className={`dm-toggle-switch ${stickerEffects.cinematicBW ? 'dm-toggle-switch-active' : ''}`}
              onClick={() => toggleEffect('cinematicBW')}
            >
              <div className="dm-toggle-switch-thumb" />
            </button>
          </div>

          <div className="dm-settings-row">
            <label>Vignette</label>
            <button
              type="button"
              className={`dm-toggle-switch ${stickerEffects.vignette ? 'dm-toggle-switch-active' : ''}`}
              onClick={() => toggleEffect('vignette')}
            >
              <div className="dm-toggle-switch-thumb" />
            </button>
          </div>

          <div className="dm-settings-row">
            <label>Fisheye</label>
            <button
              type="button"
              className={`dm-toggle-switch ${stickerEffects.fisheye ? 'dm-toggle-switch-active' : ''}`}
              onClick={() => toggleEffect('fisheye')}
            >
              <div className="dm-toggle-switch-thumb" />
            </button>
          </div>

          <div className="dm-settings-row">
            <label>Маска</label>
            <select
              className="dm-settings-select"
              value={stickerEffects.maskShape || ''}
              onChange={(e) => updateEffects({ maskShape: e.target.value || null })}
            >
              <option value="">Нет</option>
              <option value="circle">circle</option>
              <option value="softCircle">softCircle</option>
              <option value="oval">oval</option>
            </select>
          </div>

          <div className="dm-settings-row">
            <label>LUT</label>
            <select
              className="dm-settings-select"
              value={stickerEffects.lut || ''}
              onChange={(e) => updateEffects({ lut: e.target.value || null })}
            >
              <option value="">Нет</option>
              <option value="dmotion_cinematic_1">DMOTION Cinematic 1</option>
              <option value="islam_persian_1">Persian Gold 1</option>
              <option value="pamir_nature_1">Pamir Nature 1</option>
              <option value="books_wisdom_1">Vintage Wisdom 1</option>
            </select>
          </div>

          <div className="dm-settings-row">
            <label>Кривые</label>
            <select
              className="dm-settings-select"
              value={stickerEffects.curveId || ''}
              onChange={(e) => updateEffects({ curveId: e.target.value || null })}
            >
              <option value="">Нет</option>
              <option value="soft">Soft</option>
              <option value="contrast">Contrast</option>
              <option value="fade">Fade</option>
            </select>
          </div>

          <div className="dm-settings-row">
            <label>Clarity</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={Number(stickerEffects.clarity || 0)}
              onChange={(e) => updateEffects({ clarity: Number(e.target.value) })}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{Number(stickerEffects.clarity || 0)}</span>
          </div>

          <div className="dm-settings-row">
            <label>Texture</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={Number(stickerEffects.texture || 0)}
              onChange={(e) => updateEffects({ texture: Number(e.target.value) })}
              className="dm-settings-range"
            />
            <span className="dm-settings-value">{Number(stickerEffects.texture || 0)}</span>
          </div>
        </Section>

        {/* Действия */}
        <Section 
          title="Действия" 
          expanded={expandedSections.actions}
          onToggle={() => toggleSection('actions')}
        >
          <div className="dm-settings-actions-grid" style={{ marginBottom: '10px' }}>
            <button
              className="dm-sticker-action-btn"
              type="button"
              onClick={() => {
                // Fit to canvas size (cover)
                const canvasFrame = document.querySelector('.editor-v2-canvas-frame')
                if (!canvasFrame) return
                const rect = canvasFrame.getBoundingClientRect()
                const next = {
                  ...localValues,
                  x: 50,
                  y: 50,
                  width: rect.width,
                  height: rect.height
                }
                setLocalValues(next)
                applyUpdates(next)
              }}
              title="Уместить по размеру"
            >
              Уместить по размеру
            </button>
            <button
              className="dm-sticker-action-btn"
              type="button"
              onClick={() => {
                const next = { ...localValues, width: localValues.width * 0.5, height: localValues.height * 0.5 }
                setLocalValues(next)
                applyUpdates(next)
              }}
              title="50%"
            >
              50%
            </button>
            <button
              className="dm-sticker-action-btn"
              type="button"
              onClick={() => {
                // 100% = без изменений
              }}
              title="100%"
            >
              100%
            </button>
            <button
              className="dm-sticker-action-btn"
              type="button"
              onClick={() => {
                const next = { ...localValues, width: localValues.width * 2, height: localValues.height * 2 }
                setLocalValues(next)
                applyUpdates(next)
              }}
              title="200%"
            >
              200%
            </button>
          </div>

          <div className="dm-settings-actions-grid">
            <button 
              className="dm-sticker-action-btn dm-sticker-action-duplicate"
              onClick={onDuplicate}
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
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 4H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M5.5 2H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M3.5 4V11C3.5 11.5523 3.94772 12 4.5 12H9.5C10.0523 12 10.5 11.5523 10.5 11V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Удалить
            </button>
            <button 
              className="dm-sticker-action-btn dm-sticker-action-copy"
              onClick={handleCopyStyles}
              title="Копировать стили"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 4.5H4.5C3.94772 4.5 3.5 4.94772 3.5 5.5V10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <rect x="5.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Копировать стили
            </button>
            <button 
              className="dm-sticker-action-btn dm-sticker-action-paste"
              onClick={handlePasteStyles}
              disabled={!copiedStyles}
              title="Вставить стили"
              style={{ opacity: copiedStyles ? 1 : 0.5, cursor: copiedStyles ? 'pointer' : 'not-allowed' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 5.5H9.5C10.0523 5.5 10.5 5.94772 10.5 6.5V10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <rect x="2.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Вставить стили
            </button>
            <button
              className="dm-sticker-action-btn"
              type="button"
              onClick={() => {
                // reset all (including effects)
                handleReset()
                if (sticker && onUpdate) onUpdate({ effects: {} })
              }}
              title="Сбросить всё"
            >
              Сбросить всё
            </button>
          </div>
        </Section>

        {/* Группировка */}
        <Section 
          title="Группировка" 
          expanded={expandedSections.grouping}
          onToggle={() => toggleSection('grouping')}
        >
          {(() => {
            const currentGroupId = sticker?.groupId
            const groupMembers = currentGroupId 
              ? (stickerLayers || []).filter(s => s?.groupId === currentGroupId)
              : []
            const hasGroup = currentGroupId && groupMembers.length > 1
            
            return (
              <>
                {hasGroup ? (
                  <>
                    <div className="dm-settings-row" style={{ marginBottom: '12px', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: 'var(--dm-text-muted)' }}>
                        В группе: {groupMembers.length} стикеров
                      </span>
                    </div>
                    <button 
                      className="dm-sticker-action-btn"
                      onClick={() => {
                        if (onUngroup && currentGroupId) {
                          const ids = groupMembers.map(s => s.id)
                          onUngroup(ids)
                        }
                      }}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Разгруппировать
                    </button>
                  </>
                ) : (
                  <div className="dm-settings-row" style={{ flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--dm-text-muted)' }}>
                      Выберите стикеры для группировки (минимум 2):
                    </div>
                    <div style={{ 
                      maxHeight: '160px', 
                      overflowY: 'auto',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '2px',
                      padding: '2px',
                      background: 'rgba(255, 255, 255, 0.02)'
                    }}>
                      {(stickerLayers || []).map((s, index) => (
                        <label 
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 4px',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            transition: 'background 0.15s',
                            background: selectedForGrouping.has(s.id) ? 'rgba(92, 255, 212, 0.08)' : 'transparent',
                            marginBottom: '1px'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedForGrouping.has(s.id)) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedForGrouping.has(s.id)) {
                              e.currentTarget.style.background = 'transparent'
                            } else {
                              e.currentTarget.style.background = 'rgba(92, 255, 212, 0.1)'
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedForGrouping.has(s.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedForGrouping)
                              if (e.target.checked) {
                                newSet.add(s.id)
                              } else {
                                newSet.delete(s.id)
                              }
                              setSelectedForGrouping(newSet)
                            }}
                            style={{ cursor: 'pointer', width: '14px', height: '14px', flexShrink: 0 }}
                          />
                          <span style={{ 
                            fontSize: '10px', 
                            color: selectedForGrouping.has(s.id) ? 'var(--dm-text)' : 'var(--dm-text-muted)',
                            fontWeight: selectedForGrouping.has(s.id) ? 500 : 400
                          }}>
                            D Stickers {index + 1}
                            {s.groupId && <span style={{ marginLeft: '6px', color: 'rgba(92, 255, 212, 0.6)', fontSize: '9px' }}>•</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        className="dm-sticker-action-btn"
                        onClick={() => {
                          // Выбираем все стикеры
                          const allIds = new Set((stickerLayers || []).map(s => s.id).filter(Boolean))
                          setSelectedForGrouping(allIds)
                        }}
                        style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                      >
                        Выбрать все
                      </button>
                      <button 
                        className="dm-sticker-action-btn"
                        onClick={() => {
                          // Снимаем выбор со всех
                          setSelectedForGrouping(new Set())
                        }}
                        style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                      >
                        Снять выбор
                      </button>
                    </div>
                    <button 
                      className="dm-sticker-action-btn"
                      onClick={() => {
                        // Группируем только выбранные стикеры
                        const selectedIds = Array.from(selectedForGrouping)
                        if (selectedIds.length >= 2 && onGroup) {
                          onGroup(selectedIds)
                          setSelectedForGrouping(new Set()) // Очищаем выбор после группировки
                        } else if (selectedIds.length < 2) {
                          alert('Выберите минимум 2 стикера для группировки')
                        }
                      }}
                      disabled={selectedForGrouping.size < 2}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      Создать группу ({selectedForGrouping.size})
                    </button>
        </div>
      )}
              </>
            )
          })()}
        </Section>
      </div>

      {/* Кнопка Сбросить */}
      <div className="dm-sticker-settings-footer">
        <button 
          className="dm-sticker-settings-btn dm-sticker-settings-btn-reset"
          onClick={handleReset}
        >
          Сбросить все
        </button>
      </div>
    </div>
  )
}

