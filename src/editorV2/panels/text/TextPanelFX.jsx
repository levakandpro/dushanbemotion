import React, { useCallback, useMemo } from 'react'
import ColorPicker from '../../components/ColorPicker'
import ResetButton from '../../components/ResetButton'

function ensureFx(layer) {
  return layer.fx || {
    outline: [],
    shadow: null,
    glow: null,
    bevel: null,
    longShadow: null,
    marker: null
  }
}

export default function TextPanelFX(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const fx = useMemo(() => ensureFx(currentLayer), [currentLayer?.fx])

  const outline0 = useMemo(() => {
    return fx.outline?.[0] || {
      enabled: false,
      width: 4,
      color: '#000000',
      opacity: 1
    }
  }, [fx.outline])

  const shadow = useMemo(() => {
    return fx.shadow || {
      enabled: false,
      offsetX: 4,
      offsetY: 6,
      blur: 16,
      color: '#000000',
      opacity: 0.7
    }
  }, [fx.shadow])

  const glow = useMemo(() => {
    return fx.glow || {
      enabled: false,
      inner: true,
      outer: true,
      strength: 0.8,
      color: '#ffffff'
    }
  }, [fx.glow])

  // Полный сброс контура
  const handleResetOutline = useCallback(() => {
    const next = {
      ...fx,
      outline: [] // удаляем полностью
    }
    onChangeLayer && onChangeLayer({ fx: next })
  }, [fx, onChangeLayer])

  const isOutlineChanged = useMemo(() => {
    return Array.isArray(fx.outline) && fx.outline.length > 0 && fx.outline[0]?.enabled
  }, [fx.outline])

  const handleOutlineToggle = useCallback(() => {
    const nextEnabled = !outline0.enabled
    const next = {
      ...fx,
      outline: nextEnabled ? [
        {
          ...outline0,
          enabled: true
        }
      ] : [] // Полностью удаляем контур при выключении
    }
    onChangeLayer && onChangeLayer({ fx: next })
  }, [fx, outline0, onChangeLayer])

  const handleOutlineWidth = useCallback(
    event => {
      const width = Number(event.target.value) || 0
      const currentFx = currentLayer.fx || fx
      const currentOutline = currentFx.outline?.[0] || outline0
      const next = {
        ...currentFx,
        outline: [
          {
            ...currentOutline,
            enabled: true, // Всегда включаем при изменении
            width
          }
        ]
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, outline0, currentLayer, onChangeLayer]
  )

  const handleOutlineColor = useCallback(
    (color) => {
      const currentFx = currentLayer.fx || fx
      const currentOutline = currentFx.outline?.[0] || outline0
      const next = {
        ...currentFx,
        outline: [
          {
            ...currentOutline,
            enabled: true, // Всегда включаем при изменении
            color
          }
        ]
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, outline0, currentLayer, onChangeLayer]
  )

  const handleOutlineOpacity = useCallback(
    event => {
      const opacity = Number(event.target.value)
      if (isNaN(opacity)) return
      const currentFx = currentLayer.fx || fx
      const currentOutline = currentFx.outline?.[0] || outline0
      const next = {
        ...currentFx,
        outline: [
          {
            ...currentOutline,
            enabled: true,
            opacity
          }
        ]
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, outline0, currentLayer, onChangeLayer]
  )


  const handleShadowField = useCallback(
    (field, rawValue) => {
      const value =
        field === 'color' ? rawValue : Number(rawValue) || 0

      const next = {
        ...fx,
        shadow: {
          ...shadow,
          enabled: true,
          [field]: value
        }
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, shadow, onChangeLayer]
  )

  const handleShadowColor = useCallback(
    (color) => {
      const next = {
        ...fx,
        shadow: {
          ...shadow,
          enabled: true,
          color
        }
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, shadow, onChangeLayer]
  )

  const handleShadowToggle = useCallback(() => {
    const next = {
      ...fx,
      shadow: {
        ...shadow,
        enabled: !shadow.enabled
      }
    }
    onChangeLayer && onChangeLayer({ fx: next })
  }, [fx, shadow, onChangeLayer])

  const handleGlowToggle = useCallback(() => {
    const next = {
      ...fx,
      glow: {
        ...glow,
        enabled: !glow.enabled
      }
    }
    onChangeLayer && onChangeLayer({ fx: next })
  }, [fx, glow, onChangeLayer])

  const handleGlowField = useCallback(
    (field, rawValue) => {
      const value =
        field === 'color' ? rawValue : Number(rawValue) || 0
      const next = {
        ...fx,
        glow: {
          ...glow,
          enabled: true,
          [field]: value
        }
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, glow, onChangeLayer]
  )

  const handleGlowColor = useCallback(
    (color) => {
      const next = {
        ...fx,
        glow: {
          ...glow,
          enabled: true,
          color
        }
      }
      onChangeLayer && onChangeLayer({ fx: next })
    },
    [fx, glow, onChangeLayer]
  )

  return (
    <div className="dm-text-section dm-text-fx-section">
      {/* Outline */}
      <div className="dm-fx-block">
        <div className="dm-fx-block-header">
          <span className="dm-fx-title">Контур</span>
          <ResetButton isChanged={isOutlineChanged} onReset={handleResetOutline} />
          <button
            type="button"
            className={
              'dm-toggle-btn-small' +
              (outline0.enabled ? ' dm-toggle-btn-small-active' : '')
            }
            onClick={handleOutlineToggle}
          >
            {outline0.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        {outline0.enabled && (
          <div className="dm-fx-body">
            <div className="dm-field-group">
              <label className="dm-field-label">Толщина</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={outline0.width}
                  onChange={handleOutlineWidth}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  min="0"
                  max="32"
                  step="1"
                  value={outline0.width}
                  onChange={handleOutlineWidth}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Цвет</label>
              <ColorPicker
                value={outline0.color}
                onChange={handleOutlineColor}
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
                  value={outline0.opacity !== undefined ? outline0.opacity : 1}
                  onChange={handleOutlineOpacity}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  step="0.05"
                  min="0"
                  max="1"
                  value={outline0.opacity !== undefined ? outline0.opacity : 1}
                  onChange={handleOutlineOpacity}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shadow */}
      <div className="dm-fx-block">
        <div className="dm-fx-block-header">
          <span className="dm-fx-title">Тень</span>
          <button
            type="button"
            className={
              'dm-toggle-btn-small' +
              (shadow.enabled ? ' dm-toggle-btn-small-active' : '')
            }
            onClick={handleShadowToggle}
          >
            {shadow.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        {shadow.enabled && (
          <div className="dm-fx-body">
            <div className="dm-field-group">
              <label className="dm-field-label">X</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadow.offsetX}
                  onChange={e => handleShadowField('offsetX', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadow.offsetX}
                  onChange={e => handleShadowField('offsetX', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Y</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadow.offsetY}
                  onChange={e => handleShadowField('offsetY', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  min="-50"
                  max="50"
                  step="1"
                  value={shadow.offsetY}
                  onChange={e => handleShadowField('offsetY', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Размытие</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={shadow.blur}
                  onChange={e => handleShadowField('blur', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  min="0"
                  max="100"
                  step="1"
                  value={shadow.blur}
                  onChange={e => handleShadowField('blur', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Прозрачность</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={shadow.opacity}
                  onChange={e => handleShadowField('opacity', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  className="dm-input"
                  value={shadow.opacity}
                  onChange={e => handleShadowField('opacity', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Цвет</label>
              <ColorPicker
                value={shadow.color}
                onChange={handleShadowColor}
                defaultValue="#000000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Glow */}
      <div className="dm-fx-block">
        <div className="dm-fx-block-header">
          <span className="dm-fx-title">Свечение</span>
          <button
            type="button"
            className={
              'dm-toggle-btn-small' +
              (glow.enabled ? ' dm-toggle-btn-small-active' : '')
            }
            onClick={handleGlowToggle}
          >
            {glow.enabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        {glow.enabled && (
          <div className="dm-fx-body">
            <div className="dm-field-group">
              <label className="dm-field-label">Сила</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glow.strength}
                  onChange={e => handleGlowField('strength', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  className="dm-input"
                  step="0.05"
                  min="0"
                  max="1"
                  value={glow.strength}
                  onChange={e => handleGlowField('strength', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
            <div className="dm-field-group">
              <label className="dm-field-label">Цвет</label>
              <ColorPicker
                value={glow.color}
                onChange={handleGlowColor}
                defaultValue="#ffffff"
              />
            </div>
          </div>
        )}
      </div>

      {/* Остальные эффекты - хук под будущие Bevel, Long Shadow, Marker */}
    </div>
  )
}
