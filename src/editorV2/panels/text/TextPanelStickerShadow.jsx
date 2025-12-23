// src/editorV2/panels/text/TextPanelStickerShadow.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'

export default function TextPanelStickerShadow(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const stickerShadow = currentLayer.stickerShadow || {
    enabled: false,
    lift: 20,
    blur: 30,
    opacity: 0.3
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      stickerShadow: {
        ...stickerShadow,
        enabled: !stickerShadow.enabled
      }
    })
  }, [stickerShadow, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        stickerShadow: {
          ...stickerShadow,
          enabled: true,
          [field]: value
        }
      })
    },
    [stickerShadow, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      stickerShadow: {
        enabled: false,
        lift: 20,
        blur: 30,
        opacity: 0.3
      }
    })
  }, [onChangeLayer])

  return (
    <div className="dm-text-section dm-text-stickershadow-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Тень наклейки</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={stickerShadow.enabled} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (stickerShadow.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {stickerShadow.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {stickerShadow.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Подъём</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="100" step="1" value={stickerShadow.lift ?? 20}
                onChange={e => handleNumberField('lift', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="100" value={stickerShadow.lift ?? 20}
                onChange={e => handleNumberField('lift', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Размытие</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="100" step="1" value={stickerShadow.blur ?? 30}
                onChange={e => handleNumberField('blur', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="0" max="100" value={stickerShadow.blur ?? 30}
                onChange={e => handleNumberField('blur', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Прозрачность</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={stickerShadow.opacity ?? 0.3}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1" value={stickerShadow.opacity ?? 0.3}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

