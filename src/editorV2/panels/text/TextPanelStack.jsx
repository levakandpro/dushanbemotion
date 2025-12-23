// src/editorV2/panels/text/TextPanelStack.jsx
import React, { useCallback } from 'react'
import ResetButton from '../../components/ResetButton'
import ColorPicker from '../../components/ColorPicker'

export default function TextPanelStack(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const stack = currentLayer.stack || {
    enabled: false,
    layers: 3,
    xStep: 2,
    yStep: 2,
    color: '#000000',
    opacity: 0.3
  }

  const handleToggle = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      stack: {
        ...stack,
        enabled: !stack.enabled
      }
    })
  }, [stack, onChangeLayer])

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        stack: {
          ...stack,
          enabled: true,
          [field]: value
        }
      })
    },
    [stack, onChangeLayer]
  )

  const handleColor = useCallback(
    (color) => {
      if (!onChangeLayer) return
      onChangeLayer({
        stack: {
          ...stack,
          enabled: true,
          color
        }
      })
    },
    [stack, onChangeLayer]
  )

  const handleReset = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      stack: {
        enabled: false,
        layers: 3,
        xStep: 2,
        yStep: 2,
        color: '#000000',
        opacity: 0.3
      }
    })
  }, [onChangeLayer])

  return (
    <div className="dm-text-section dm-text-stack-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Слои / Смещение</label>
        <div className="dm-inline-row">
          <ResetButton isChanged={stack.enabled} onReset={handleReset} />
          <button type="button" className={'dm-toggle-btn' + (stack.enabled ? ' dm-toggle-btn-active' : '')}
            onClick={handleToggle}>
            {stack.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      {stack.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Количество слоёв</label>
            <div className="dm-field-row">
              <input type="range" min="1" max="10" step="1" value={stack.layers ?? 3}
                onChange={e => handleNumberField('layers', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="1" max="10" value={stack.layers ?? 3}
                onChange={e => handleNumberField('layers', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Шаг X</label>
            <div className="dm-field-row">
              <input type="range" min="-20" max="20" step="1" value={stack.xStep ?? 2}
                onChange={e => handleNumberField('xStep', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="-20" max="20" value={stack.xStep ?? 2}
                onChange={e => handleNumberField('xStep', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Шаг Y</label>
            <div className="dm-field-row">
              <input type="range" min="-20" max="20" step="1" value={stack.yStep ?? 2}
                onChange={e => handleNumberField('yStep', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="1" min="-20" max="20" value={stack.yStep ?? 2}
                onChange={e => handleNumberField('yStep', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Прозрачность</label>
            <div className="dm-field-row">
              <input type="range" min="0" max="1" step="0.05" value={stack.opacity ?? 0.3}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ flex: 1 }} />
              <input type="number" className="dm-input" step="0.05" min="0" max="1" value={stack.opacity ?? 0.3}
                onChange={e => handleNumberField('opacity', e.target.value)} style={{ width: '70px', flexShrink: 0 }} />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Цвет</label>
            <ColorPicker value={stack.color} onChange={handleColor} defaultValue="#000000" />
          </div>
        </>
      )}
    </div>
  )
}

