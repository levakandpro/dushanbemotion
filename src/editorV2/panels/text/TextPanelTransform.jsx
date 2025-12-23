import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'
import { isFieldChanged, TEXT_DEFAULTS } from '../../utils/textDefaults'

export default function TextPanelTransform(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const transform = currentLayer.transform || {
    rotation: 0,
    flipX: false,
    flipY: false,
    x: 0,
    y: 0
  }
  
  const handleResetRotation = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({
        transform: {
          ...transform,
          rotation: TEXT_DEFAULTS.rotation
        }
      })
    }
  }, [onChangeLayer, transform])

  const handleResetX = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({
        transform: {
          ...transform,
          x: TEXT_DEFAULTS.x
        }
      })
    }
  }, [onChangeLayer, transform])

  const handleResetY = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({
        transform: {
          ...transform,
          y: TEXT_DEFAULTS.y
        }
      })
    }
  }, [onChangeLayer, transform])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        transform: {
          ...transform,
          [field]: value
        }
      })
    },
    [transform, onChangeLayer]
  )

  return (
    <div className="dm-text-section dm-text-transform-section">
      <div className="dm-field-group">
        <label className="dm-field-label">
          <span className="dm-field-label-text">Поворот</span>
          <ResetButton
            isChanged={isFieldChanged(currentLayer, 'transform.rotation')}
            onReset={handleResetRotation}
          />
        </label>
        <div className="dm-field-row">
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={transform.rotation ?? 0}
            onChange={e => handleNumberField('rotation', e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            className="dm-input"
            value={transform.rotation ?? 0}
            onChange={e => handleNumberField('rotation', e.target.value)}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>

      <div className="dm-field-group">
        <label className="dm-field-label">
          <span className="dm-field-label-text">X</span>
          <ResetButton
            isChanged={isFieldChanged(currentLayer, 'transform.x')}
            onReset={handleResetX}
          />
        </label>
        <div className="dm-field-row">
          <input
            type="range"
            min="-1000"
            max="1000"
            step="1"
            value={transform.x ?? 0}
            onChange={e => handleNumberField('x', e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            className="dm-input"
            min="-1000"
            max="1000"
            step="1"
            value={transform.x ?? 0}
            onChange={e => handleNumberField('x', e.target.value)}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>
      <div className="dm-field-group">
        <label className="dm-field-label">
          <span className="dm-field-label-text">Y</span>
          <ResetButton
            isChanged={isFieldChanged(currentLayer, 'transform.y')}
            onReset={handleResetY}
          />
        </label>
        <div className="dm-field-row">
          <input
            type="range"
            min="-1000"
            max="1000"
            step="1"
            value={transform.y ?? 0}
            onChange={e => handleNumberField('y', e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            className="dm-input"
            min="-1000"
            max="1000"
            step="1"
            value={transform.y ?? 0}
            onChange={e => handleNumberField('y', e.target.value)}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>
    </div>
  )
}
