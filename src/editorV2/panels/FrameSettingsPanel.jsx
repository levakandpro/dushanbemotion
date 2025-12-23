// src/editorV2/panels/FrameSettingsPanel.jsx
import React, { useState } from 'react'
import settingIcon from '../../assets/seting.svg'

export default function FrameSettingsPanel({ frame, onUpdate, onDelete, onDuplicate }) {
  console.log('FrameSettingsPanel render:', { frame, hasOnUpdate: !!onUpdate })
  
  const [expandedSections, setExpandedSections] = useState({
    position: true,
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
    console.log('handleChange:', updates)
    if (frame && onUpdate) {
      onUpdate({ ...frame, ...updates })
    }
  }
  
  // Если рамка не выбрана, показываем заглушку
  if (!frame) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--dm-text-soft)'
      }}>
        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
          Рамка не выбрана
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>
          Выберите рамку на сцене, чтобы настроить её параметры
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.12) transparent'
    }}>
      {/* Позиция */}
      <div style={{
        borderBottom: '1px solid var(--dm-border-soft)',
        padding: '12px 16px'
      }}>
        <button
          onClick={() => toggleSection('position')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: 'var(--dm-text)',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Позиция
          <span style={{ transform: expandedSections.position ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
        
        {expandedSections.position && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--dm-text-soft)', marginBottom: '4px' }}>
                  X (%)
                </label>
                <input
                  type="number"
                  value={frame.x !== undefined ? frame.x.toFixed(1) : 50}
                  onChange={(e) => handleChange({ x: parseFloat(e.target.value) || 50 })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'var(--dm-bg-secondary)',
                    border: '1px solid var(--dm-border)',
                    borderRadius: '4px',
                    color: 'var(--dm-text)',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--dm-text-soft)', marginBottom: '4px' }}>
                  Y (%)
                </label>
                <input
                  type="number"
                  value={frame.y !== undefined ? frame.y.toFixed(1) : 50}
                  onChange={(e) => handleChange({ y: parseFloat(e.target.value) || 50 })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'var(--dm-bg-secondary)',
                    border: '1px solid var(--dm-border)',
                    borderRadius: '4px',
                    color: 'var(--dm-text)',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--dm-text-soft)', marginBottom: '4px' }}>
                Масштаб (%)
              </label>
              <input
                type="number"
                value={frame.scale !== undefined ? (frame.scale * 100).toFixed(1) : 100}
                onChange={(e) => handleChange({ scale: (parseFloat(e.target.value) || 100) / 100 })}
                min="1"
                max="500"
                step="1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--dm-bg-secondary)',
                  border: '1px solid var(--dm-border)',
                  borderRadius: '4px',
                  color: 'var(--dm-text)',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--dm-text-soft)', marginBottom: '4px' }}>
                Поворот (°)
              </label>
              <input
                type="number"
                value={frame.rotation !== undefined ? frame.rotation.toFixed(1) : 0}
                onChange={(e) => handleChange({ rotation: parseFloat(e.target.value) || 0 })}
                min="-180"
                max="180"
                step="1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--dm-bg-secondary)',
                  border: '1px solid var(--dm-border)',
                  borderRadius: '4px',
                  color: 'var(--dm-text)',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Непрозрачность */}
      <div style={{
        borderBottom: '1px solid var(--dm-border-soft)',
        padding: '12px 16px'
      }}>
        <button
          onClick={() => toggleSection('opacity')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: 'var(--dm-text)',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Непрозрачность
          <span style={{ transform: expandedSections.opacity ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
        
        {expandedSections.opacity && (
          <div style={{ marginTop: '12px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={frame.opacity !== undefined ? frame.opacity : 1}
              onChange={(e) => handleChange({ opacity: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                background: 'var(--dm-bg-secondary)',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--dm-text-soft)', textAlign: 'center' }}>
              {Math.round((frame.opacity !== undefined ? frame.opacity : 1) * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Слой */}
      <div style={{
        borderBottom: '1px solid var(--dm-border-soft)',
        padding: '12px 16px'
      }}>
        <button
          onClick={() => toggleSection('layer')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: 'var(--dm-text)',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Слой
          <span style={{ transform: expandedSections.layer ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
        
        {expandedSections.layer && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onDuplicate && onDuplicate(frame.id)}
              style={{
                padding: '8px 12px',
                background: 'var(--dm-bg-secondary)',
                border: '1px solid var(--dm-border)',
                borderRadius: '4px',
                color: 'var(--dm-text)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(92, 255, 212, 0.15)'
                e.currentTarget.style.borderColor = 'var(--dm-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--dm-bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--dm-border)'
              }}
            >
              Дублировать
            </button>
            <button
              onClick={() => onDelete && onDelete(frame.id)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 77, 77, 0.1)',
                border: '1px solid rgba(255, 77, 77, 0.3)',
                borderRadius: '4px',
                color: '#ff4d4d',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)'
                e.currentTarget.style.borderColor = '#ff4d4d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.3)'
              }}
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


