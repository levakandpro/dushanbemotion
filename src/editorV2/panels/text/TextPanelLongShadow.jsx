// src/editorV2/panels/text/TextPanelLongShadow.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'
import ColorPicker from '../../components/ColorPicker'

export default function TextPanelLongShadow(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const longShadow = currentLayer.longShadow || {
    enabled: false,
    angle: 45,
    length: 50,
    softness: 0,
    color: '#000000',
    opacity: 0.5
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      longShadow: {
        ...longShadow,
        enabled: !longShadow.enabled
      }
    })
  }, [longShadow, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        longShadow: {
          ...longShadow,
          enabled: true,
          [field]: value
        }
      })
    },
    [longShadow, onChangeLayer]
  )

  const handleColor = useCallback(
    (color) => {
      if (!onChangeLayer) return
      onChangeLayer({
        longShadow: {
          ...longShadow,
          enabled: true,
          color
        }
      })
    },
    [longShadow, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      longShadow: {
        enabled: false,
        angle: 45,
        length: 50,
        softness: 0,
        color: '#000000',
        opacity: 0.5
      }
    })
  }, [onChangeLayer])

  const isChanged = longShadow.enabled || longShadow.length !== 50

  return (
    <div className="dm-text-section dm-text-longshadow-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Длинная тень</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={isChanged} onReset={handleReset} />
          <button
            type="button"
            className={'dm-toggle-btn' + (longShadow.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}
          >
            {longShadow.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {longShadow.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Угол</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="360" step="1" value={longShadow.angle ?? 45}
                onChange={e => handleNumberField('angle', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="360"
                value={longShadow.angle ?? 45} onChange={e => handleNumberField('angle', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Длина</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="200" step="1" value={longShadow.length ?? 50}
                onChange={e => handleNumberField('length', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="200"
                value={longShadow.length ?? 50} onChange={e => handleNumberField('length', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Размытие</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="50" step="1" value={longShadow.softness ?? 0}
                onChange={e => handleNumberField('softness', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="50"
                value={longShadow.softness ?? 0} onChange={e => handleNumberField('softness', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Прозрачность</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={longShadow.opacity ?? 0.5}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1"
                value={longShadow.opacity ?? 0.5} onChange={e => handleNumberField('opacity', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Цвет</label>
            <ColorPicker value={longShadow.color} onChange={handleColor} defaultValue="#000000" />
          </div>
        </>
      )}
    </div>
  )
}

