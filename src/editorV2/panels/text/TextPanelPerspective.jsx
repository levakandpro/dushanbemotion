// src/editorV2/panels/text/TextPanelPerspective.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'

export default function TextPanelPerspective(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const perspective3d = currentLayer.perspective3d || {
    enabled: false,
    tiltX: 0,
    tiltY: 0,
    rotateZ: 0,
    perspective: 1000,
    origin: 'center' // 'center' или 'bottom'
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      perspective3d: {
        ...perspective3d,
        enabled: !perspective3d.enabled
      }
    })
  }, [perspective3d, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      console.log('🎨 Changing perspective3d:', field, value)
      onChangeLayer({
        perspective3d: {
          ...perspective3d,
          enabled: true,
          [field]: value
        }
      })
    },
    [perspective3d, onChangeLayer]
  )

  const handleOrigin = useCallback(
    (origin) => {
      if (!onChangeLayer) return
      onChangeLayer({
        perspective3d: {
          ...perspective3d,
          origin
        }
      })
    },
    [perspective3d, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      perspective3d: {
        enabled: false,
        tiltX: 0,
        tiltY: 0,
        rotateZ: 0,
        perspective: 1000,
        origin: 'center'
      }
    })
  }, [onChangeLayer])

  const isChanged = perspective3d.enabled || 
                    perspective3d.tiltX !== 0 || 
                    perspective3d.tiltY !== 0 || 
                    perspective3d.rotateZ !== 0 ||
                    perspective3d.perspective !== 1000

  return (
    <div className="dm-text-section dm-text-perspective-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Плоскость (3D)</label>
        <div className="dm-inline-row">
          <ResetButton
            isChanged={isChanged}
            onReset={handleReset}
          />
          <button
            type="button"
            className={
              'dm-toggle-btn' +
              (perspective3d.enabled ? ' dm-toggle-btn-active' : '')
            }
            onClick={handleToggle}
          >
            {perspective3d.enabled ? 'Включён' : 'Выключен'}
          </button>
        </div>
      </div>

      {perspective3d.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Наклон по X</label>
            <div className="dm-field-row">
              <input
                type="range"
                min="-80"
                max="80"
                step="1"
                value={perspective3d.tiltX ?? 0}
                onChange={e => handleNumberField('tiltX', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="dm-input"
                step="1"
                min="-80"
                max="80"
                value={perspective3d.tiltX ?? 0}
                onChange={e => handleNumberField('tiltX', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Наклон по Y</label>
            <div className="dm-field-row">
              <input
                type="range"
                min="-80"
                max="80"
                step="1"
                value={perspective3d.tiltY ?? 0}
                onChange={e => handleNumberField('tiltY', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="dm-input"
                step="1"
                min="-80"
                max="80"
                value={perspective3d.tiltY ?? 0}
                onChange={e => handleNumberField('tiltY', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Поворот Z</label>
            <div className="dm-field-row">
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={perspective3d.rotateZ ?? 0}
                onChange={e => handleNumberField('rotateZ', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="dm-input"
                step="1"
                min="-180"
                max="180"
                value={perspective3d.rotateZ ?? 0}
                onChange={e => handleNumberField('rotateZ', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Перспектива</label>
            <div className="dm-field-row">
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={perspective3d.perspective ?? 1000}
                onChange={e => handleNumberField('perspective', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="dm-input"
                step="50"
                min="300"
                max="2000"
                value={perspective3d.perspective ?? 1000}
                onChange={e => handleNumberField('perspective', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Точка трансформации</label>
            <div className="dm-toggle-group">
              <button
                type="button"
                className={
                  'dm-toggle-btn' +
                  (perspective3d.origin === 'center' ? ' dm-toggle-btn-active' : '')
                }
                onClick={() => handleOrigin('center')}
              >
                Центр
              </button>
              <button
                type="button"
                className={
                  'dm-toggle-btn' +
                  (perspective3d.origin === 'bottom' ? ' dm-toggle-btn-active' : '')
                }
                onClick={() => handleOrigin('bottom')}
              >
                Низ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

