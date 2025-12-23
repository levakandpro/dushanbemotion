// src/editorV2/panels/text/TextPanelWeightStyle.jsx
import React, { useCallback, useMemo } from 'react'

export default function TextPanelWeightStyle(props) {
  const { currentLayer, onChangeLayer } = props

  const fontWeight = currentLayer?.fontWeight || 600
  const fontStyle = currentLayer?.fontStyle || 'normal'
  const underline = !!currentLayer?.underline
  const textAlign = currentLayer?.textAlign || 'center'

  const handleChangeWeight = useCallback(
    (event) => {
      if (!onChangeLayer) return
      onChangeLayer({ fontWeight: Number(event.target.value) || 400 })
    },
    [onChangeLayer]
  )

  const handleSetFontStyle = useCallback((style) => {
    if (!onChangeLayer) return
    onChangeLayer({ fontStyle: style })
  }, [onChangeLayer])

  const handleToggleUnderline = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({ underline: !underline })
  }, [onChangeLayer, underline])

  const handleAlign = useCallback(
    (mode) => {
      if (!onChangeLayer) return
      onChangeLayer({ textAlign: mode })
    },
    [onChangeLayer]
  )

  const AlignIcon = ({ mode }) => {
    // Simple 3-line alignment glyph, uses currentColor
    const common = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }
    if (mode === 'left') {
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 3.2H11" {...common} />
          <path d="M2 7H9" {...common} />
          <path d="M2 10.8H12" {...common} />
        </svg>
      )
    }
    if (mode === 'center') {
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 3.2H12" {...common} />
          <path d="M3.5 7H10.5" {...common} />
          <path d="M2 10.8H12" {...common} />
        </svg>
      )
    }
    // right
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M3 3.2H12" {...common} />
        <path d="M5 7H12" {...common} />
        <path d="M2 10.8H12" {...common} />
      </svg>
    )
  }

  if (!currentLayer) return null

  return (
    <div className="dm-text-section dm-text-weight-style-section">
      <div className="dm-font-controls">
        <div className="dm-field-group">
          <label className="dm-field-label">Толщина</label>
          <select
            className="dm-select"
            value={fontWeight}
            onChange={handleChangeWeight}
          >
            <option value={300}>Тонкий</option>
            <option value={400}>Обычный</option>
            <option value={500}>Средний</option>
            <option value={600}>Полужирный</option>
            <option value={700}>Жирный</option>
            <option value={800}>Очень жирный</option>
          </select>
        </div>

        <div className="dm-field-group dm-font-style-row">
          <label className="dm-field-label">Стиль</label>
          <div className="dm-toggle-group">
            <button
              type="button"
              className={
                'dm-toggle-btn' +
                (fontStyle === 'normal' ? ' dm-toggle-btn-active' : '')
              }
              onClick={() => handleSetFontStyle('normal')}
            >
              Обычный
            </button>
            <button
              type="button"
              className={
                'dm-toggle-btn' +
                (fontStyle === 'italic' ? ' dm-toggle-btn-active' : '')
              }
              onClick={() => handleSetFontStyle('italic')}
            >
              Курсив
            </button>
            <button
              type="button"
              className={
                'dm-toggle-btn' + (underline ? ' dm-toggle-btn-active' : '')
              }
              onClick={handleToggleUnderline}
            >
              U
            </button>
            {['left', 'center', 'right'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={
                  'dm-toggle-icon-btn' +
                  (textAlign === mode ? ' dm-toggle-icon-btn-active' : '')
                }
                onClick={() => handleAlign(mode)}
                title={mode === 'left' ? 'Влево' : mode === 'center' ? 'Центр' : 'Вправо'}
              >
                <AlignIcon mode={mode} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

