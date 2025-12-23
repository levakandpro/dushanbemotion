// src/editorV2/panels/text/TextPanelDoubleStroke.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'
import ColorPicker from '../../components/ColorPicker'

export default function TextPanelDoubleStroke(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const doubleStroke = currentLayer.doubleStroke || {
    enabled: false,
    stroke1Width: 4,
    stroke1Color: '#000000',
    stroke2Width: 8,
    stroke2Color: '#ffffff'
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      doubleStroke: {
        ...doubleStroke,
        enabled: !doubleStroke.enabled
      }
    })
  }, [doubleStroke, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        doubleStroke: {
          ...doubleStroke,
          enabled: true,
          [field]: value
        }
      })
    },
    [doubleStroke, onChangeLayer]
  )

  const handleColor = useCallback(
    (field, color) => {
      if (!onChangeLayer) return
      onChangeLayer({
        doubleStroke: {
          ...doubleStroke,
          enabled: true,
          [field]: color
        }
      })
    },
    [doubleStroke, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      doubleStroke: {
        enabled: false,
        stroke1Width: 4,
        stroke1Color: '#000000',
        stroke2Width: 8,
        stroke2Color: '#ffffff'
      }
    })
  }, [onChangeLayer])

  return (
    <div className="dm-text-section dm-text-doublestroke-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Двойная обводка</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={doubleStroke.enabled} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (doubleStroke.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {doubleStroke.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {doubleStroke.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Обводка 1 - Толщина</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="32" step="1" value={doubleStroke.stroke1Width ?? 4}
                onChange={e => handleNumberField('stroke1Width', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="32" value={doubleStroke.stroke1Width ?? 4}
                onChange={e => handleNumberField('stroke1Width', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Обводка 1 - Цвет</label>
            <ColorPicker value={doubleStroke.stroke1Color} onChange={(c) => handleColor('stroke1Color', c)} defaultValue="#000000" />
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Обводка 2 - Толщина</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="32" step="1" value={doubleStroke.stroke2Width ?? 8}
                onChange={e => handleNumberField('stroke2Width', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="32" value={doubleStroke.stroke2Width ?? 8}
                onChange={e => handleNumberField('stroke2Width', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Обводка 2 - Цвет</label>
            <ColorPicker value={doubleStroke.stroke2Color} onChange={(c) => handleColor('stroke2Color', c)} defaultValue="#ffffff" />
          </div>
        </>
      )}
    </div>
  )
}

