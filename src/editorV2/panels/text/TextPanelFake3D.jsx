// src/editorV2/panels/text/TextPanelFake3D.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'
import ColorPicker from '../../components/ColorPicker'

export default function TextPanelFake3D(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const fake3d = currentLayer.fake3d || {
    enabled: false,
    depthLayers: 10,
    xOffset: 2,
    yOffset: 2,
    color: '#000000',
    opacity: 0.5
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      fake3d: {
        ...fake3d,
        enabled: !fake3d.enabled
      }
    })
  }, [fake3d, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        fake3d: {
          ...fake3d,
          enabled: true,
          [field]: value
        }
      })
    },
    [fake3d, onChangeLayer]
  )

  const handleColor = useCallback(
    (color) => {
      if (!onChangeLayer) return
      onChangeLayer({
        fake3d: {
          ...fake3d,
          enabled: true,
          color
        }
      })
    },
    [fake3d, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      fake3d: {
        enabled: false,
        depthLayers: 10,
        xOffset: 2,
        yOffset: 2,
        color: '#000000',
        opacity: 0.5
      }
    })
  }, [onChangeLayer])

  return (
    <div className="dm-text-section dm-text-fake3d-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Экструзия (3D)</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={fake3d.enabled} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (fake3d.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {fake3d.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {fake3d.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Слои глубины</label>
            <div className="dm-field-row">
              <input type="range" min="1" max="30" step="1" value={fake3d.depthLayers ?? 10}
                onChange={e => handleNumberField('depthLayers', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="1" max="30" value={fake3d.depthLayers ?? 10}
                onChange={e => handleNumberField('depthLayers', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Смещение X</label>
            <div className="dm-field-row">
              <input type="range" min="-10" max="10" step="0.5" value={fake3d.xOffset ?? 2}
                onChange={e => handleNumberField('xOffset', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.5" min="-10" max="10" value={fake3d.xOffset ?? 2}
                onChange={e => handleNumberField('xOffset', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Смещение Y</label>
            <div className="dm-field-row">
              <input type="range" min="-10" max="10" step="0.5" value={fake3d.yOffset ?? 2}
                onChange={e => handleNumberField('yOffset', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.5" min="-10" max="10" value={fake3d.yOffset ?? 2}
                onChange={e => handleNumberField('yOffset', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Прозрачность</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={fake3d.opacity ?? 0.5}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1" value={fake3d.opacity ?? 0.5}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Цвет</label>
            <ColorPicker value={fake3d.color} onChange={handleColor} defaultValue="#000000" />
          </div>
        </>
      )}
    </div>
  )
}

