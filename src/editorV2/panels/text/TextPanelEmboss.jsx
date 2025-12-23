// src/editorV2/panels/text/TextPanelEmboss.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'

export default function TextPanelEmboss(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const emboss = currentLayer.emboss || {
    enabled: false,
    strength: 0.5,
    angle: 135,
    contrast: 0.5,
    mode: 'emboss' // 'emboss' или 'deboss'
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      emboss: {
        ...emboss,
        enabled: !emboss.enabled
      }
    })
  }, [emboss, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        emboss: {
          ...emboss,
          enabled: true,
          [field]: value
        }
      })
    },
    [emboss, onChangeLayer]
  )

  const handleMode = useCallback(
    (mode) => {
      if (!onChangeLayer) return
      onChangeLayer({
        emboss: {
          ...emboss,
          enabled: true,
          mode
        }
      })
    },
    [emboss, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      emboss: {
        enabled: false,
        strength: 0.5,
        angle: 135,
        contrast: 0.5,
        mode: 'emboss'
      }
    })
  }, [onChangeLayer])

  return (
    <div className="dm-text-section dm-text-emboss-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Тиснение</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={emboss.enabled} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (emboss.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {emboss.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {emboss.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Режим</label>
            <div className="dm-toggle-group">
              <button type="button" className={'dm-toggle-btn' + (emboss.mode === 'emboss' ? ' dm-toggle-btn-active' : '')}
                onClick={() => handleMode('emboss')}>
                Выпуклость
              </button>
              <button type="button" className={'dm-toggle-btn' + (emboss.mode === 'deboss' ? ' dm-toggle-btn-active' : '')}
                onClick={() => handleMode('deboss')}>
                Вдавленность
              </button>
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Сила</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={emboss.strength ?? 0.5}
                onChange={e => handleNumberField('strength', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1" value={emboss.strength ?? 0.5}
                onChange={e => handleNumberField('strength', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Угол</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="360" step="1" value={emboss.angle ?? 135}
                onChange={e => handleNumberField('angle', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="360" value={emboss.angle ?? 135}
                onChange={e => handleNumberField('angle', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Контраст</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={emboss.contrast ?? 0.5}
                onChange={e => handleNumberField('contrast', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1" value={emboss.contrast ?? 0.5}
                onChange={e => handleNumberField('contrast', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

