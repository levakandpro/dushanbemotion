// src/editorV2/panels/text/TextPanelSkew.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'

export default function TextPanelSkew(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const skew = currentLayer.skew || {
    enabled: false,
    skewX: 0,
    skewY: 0
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      skew: {
        ...skew,
        enabled: !skew.enabled
      }
    })
  }, [skew, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        skew: {
          ...skew,
          enabled: true,
          [field]: value
        }
      })
    },
    [skew, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      skew: {
        enabled: false,
        skewX: 0,
        skewY: 0
      }
    })
  }, [onChangeLayer])

  const isChanged = skew.enabled || skew.skewX !== 0 || skew.skewY !== 0

  return (
    <div className="dm-text-section dm-text-skew-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Перекос</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={isChanged} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (skew.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {skew.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {skew.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Перекос X</label>
            <div className="dm-field-row">
              <input type="range" min="-45" max="45" step="1" value={skew.skewX ?? 0}
                onChange={e => handleNumberField('skewX', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="-45" max="45" value={skew.skewX ?? 0}
                onChange={e => handleNumberField('skewX', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Перекос Y</label>
            <div className="dm-field-row">
              <input type="range" min="-45" max="45" step="1" value={skew.skewY ?? 0}
                onChange={e => handleNumberField('skewY', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="-45" max="45" value={skew.skewY ?? 0}
                onChange={e => handleNumberField('skewY', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

