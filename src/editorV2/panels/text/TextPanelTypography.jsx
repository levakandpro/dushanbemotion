import React, { useCallback, useState } from 'react'
import ResetButton from '../../components/ResetButton'
import { isFieldChanged, TEXT_DEFAULTS } from '../../utils/textDefaults'

export default function TextPanelTypography(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const lineHeight = currentLayer.lineHeight ?? 1.1
  const letterSpacing = currentLayer.letterSpacing ?? 0

  const handleLineHeight = useCallback(
    event => {
      if (!onChangeLayer) return
      onChangeLayer({ lineHeight: Number(event.target.value) || 1 })
    },
    [onChangeLayer]
  )

  const handleLetterSpacing = useCallback(
    event => {
      if (!onChangeLayer) return
      onChangeLayer({ letterSpacing: Number(event.target.value) || 0 })
    },
    [onChangeLayer]
  )


  const handleResetLineHeight = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({ lineHeight: TEXT_DEFAULTS.lineHeight })
    }
  }, [onChangeLayer])

  const handleResetLetterSpacing = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({ letterSpacing: TEXT_DEFAULTS.letterSpacing })
    }
  }, [onChangeLayer])


  return (
    <div className="dm-text-section dm-text-typography-section">
      <div className="dm-field-group">
        <label className="dm-field-label">
          <span className="dm-field-label-text">Межстрочный</span>
          <ResetButton
            isChanged={isFieldChanged(currentLayer, 'lineHeight')}
            onReset={handleResetLineHeight}
          />
        </label>
        <div className="dm-field-row">
          <input
            type="range"
            step="0.05"
            min="0.6"
            max="3"
            value={lineHeight}
            onChange={handleLineHeight}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            step="0.05"
            min="0.6"
            max="3"
            className="dm-input"
            value={lineHeight}
            onChange={handleLineHeight}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>

      <div className="dm-field-group">
        <label className="dm-field-label">
          <span className="dm-field-label-text">Межбуквенный</span>
          <ResetButton
            isChanged={isFieldChanged(currentLayer, 'letterSpacing')}
            onReset={handleResetLetterSpacing}
          />
        </label>
        <div className="dm-field-row">
          <input
            type="range"
            step="0.5"
            min="-10"
            max="40"
            value={letterSpacing}
            onChange={handleLetterSpacing}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            step="0.5"
            min="-10"
            max="40"
            className="dm-input"
            value={letterSpacing}
            onChange={handleLetterSpacing}
            style={{ width: '70px', flexShrink: 0 }}
          />
        </div>
      </div>
    </div>
  )
}
