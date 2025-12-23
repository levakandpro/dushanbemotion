// src/editorV2/panels/text/TextPanelTextProps.jsx
import React, { useCallback } from 'react'

export default function TextPanelTextProps(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const fontSize = currentLayer?.fontSize || 48
  const opacity = currentLayer?.opacity !== undefined ? currentLayer.opacity : 1
  const allCaps = !!currentLayer?.allCaps
  const underline = !!currentLayer?.underline

  const handleFontSize = useCallback(
    (event) => {
      if (!onChangeLayer) return
      const value = Number(event.target.value) || 12
      console.log('🎨 Changing fontSize:', value)
      onChangeLayer({ fontSize: value })
    },
    [onChangeLayer]
  )

  const handleOpacity = useCallback(
    (event) => {
      if (!onChangeLayer) return
      const value = Number(event.target.value)
      console.log('🎨 Changing opacity:', value)
      onChangeLayer({ opacity: isNaN(value) ? 1 : value })
    },
    [onChangeLayer]
  )

  const handleAllCaps = useCallback(() => {
    if (!onChangeLayer) return
    console.log('🎨 Changing allCaps:', !allCaps)
    onChangeLayer({ allCaps: !allCaps })
  }, [allCaps, onChangeLayer])

  const handleUnderline = useCallback(() => {
    if (!onChangeLayer) return
    console.log('🎨 Changing underline:', !underline)
    onChangeLayer({ underline: !underline })
  }, [underline, onChangeLayer])

  return (
    <div className="dm-text-section dm-text-props-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Размер шрифта</label>
        <div className="dm-field-row">
          <input
            type="range"
            min="8"
            max="200"
            step="1"
            value={fontSize}
            onChange={handleFontSize}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            className="dm-input"
            min="8"
            max="200"
            step="1"
            value={fontSize}
            onChange={handleFontSize}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>

      <div className="dm-field-group">
        <label className="dm-field-label">Прозрачность</label>
        <div className="dm-field-row">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={handleOpacity}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            className="dm-input"
            step="0.05"
            min="0"
            max="1"
            value={opacity}
            onChange={handleOpacity}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>

      <div className="dm-field-group">
        <label className="dm-field-label">Стиль текста</label>
        <div className="dm-toggle-group">
          <button
            type="button"
            className={
              'dm-toggle-btn' +
              (allCaps ? ' dm-toggle-btn-active' : '')
            }
            onClick={handleAllCaps}
          >
            ЗАГЛАВНЫЕ
          </button>
          <button
            type="button"
            className={
              'dm-toggle-btn' +
              (underline ? ' dm-toggle-btn-active' : '')
            }
            onClick={handleUnderline}
          >
            Подчеркивание
          </button>
        </div>
      </div>
    </div>
  )
}

