import React, { useCallback } from 'react'
import ColorPicker from '../../components/ColorPicker'

export default function TextPanelContainer(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const container = currentLayer.container || {
    type: 'none',
    color: '#000000',
    alpha: 0.5,
    padding: 16,
    autoWidth: true
  }

  const handleType = useCallback(
    type => {
      if (!onChangeLayer) return
      onChangeLayer({
        container: {
          ...container,
          type
        }
      })
    },
    [container, onChangeLayer]
  )

  const handleColor = useCallback(
    (color) => {
      if (!onChangeLayer) return
      onChangeLayer({
        container: {
          ...container,
          color
        }
      })
    },
    [container, onChangeLayer]
  )

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        container: {
          ...container,
          [field]: value
        }
      })
    },
    [container, onChangeLayer]
  )

  const handleToggleAutoWidth = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      container: {
        ...container,
        autoWidth: !container.autoWidth
      }
    })
  }, [container, onChangeLayer])

  return (
    <div className="dm-text-section dm-text-container-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Тип контейнера</label>
        <div className="dm-toggle-group">
          {['none', 'box', 'rounded'].map(type => (
            <button
              key={type}
              type="button"
              className={
                'dm-toggle-btn' +
                (container.type === type ? ' dm-toggle-btn-active' : '')
              }
              onClick={() => handleType(type)}
            >
              {type === 'none' ? 'Нет' : type === 'box' ? 'Квадрат' : 'Скругленный'}
            </button>
          ))}
        </div>
      </div>

      {container.type !== 'none' && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Цвет</label>
            <ColorPicker
              value={container.color}
              onChange={handleColor}
              defaultValue="#000000"
            />
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Прозрачность</label>
            <div className="dm-field-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={container.alpha ?? 0.5}
                onChange={e => handleNumberField('alpha', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="dm-input"
                min="0"
                max="1"
                step="0.05"
                value={container.alpha ?? 0.5}
                onChange={e => handleNumberField('alpha', e.target.value)}
                style={{ width: '70px', flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Отступы</label>
            <input
              type="number"
              className="dm-input"
              min="0"
              max="256"
              value={container.padding ?? 16}
              onChange={e => handleNumberField('padding', e.target.value)}
            />
          </div>

          <div className="dm-field-group">
            <label className="dm-field-label">Автоширина</label>
            <button
              type="button"
              className={
                'dm-toggle-btn' +
                (container.autoWidth ? ' dm-toggle-btn-active' : '')
              }
              onClick={handleToggleAutoWidth}
            >
              {container.autoWidth ? 'Вкл' : 'Выкл'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
