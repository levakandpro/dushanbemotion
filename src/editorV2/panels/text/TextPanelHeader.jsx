// src/editorV2/panels/text/TextPanelHeader.jsx
import React, { useMemo } from 'react'

export default function TextPanelHeader(props) {
  const {
    textLayers,
    currentLayer,
    selectedTextId,
    onSelectTextId,
    onAddTextLayer,
    onDeleteCurrentLayer
  } = props

  const hasLayer = !!currentLayer
  const layers = Array.isArray(textLayers) ? textLayers : []

  const options = useMemo(
    () =>
      layers.map(layer => ({
        id: layer.id,
        label: layer.name || layer.text || 'Текст'
      })),
    [layers]
  )

  const handleSelectChange = e => {
    const nextId = e.target.value || ''
    if (onSelectTextId) onSelectTextId(nextId || null)
  }

  return (
    <div className="dm-text-panel-header">
      <div className="dm-text-panel-header-row">
        <button
          type="button"
          className="dm-btn dm-btn-primary"
          onClick={onAddTextLayer}
        >
          + Добавить текст
        </button>

        <button
          type="button"
          className="dm-btn dm-btn-ghost"
          disabled={!hasLayer}
          onClick={onDeleteCurrentLayer}
        >
          Удалить
        </button>

        <select
          className="dm-input dm-text-layer-select"
          value={selectedTextId || ''}
          onChange={handleSelectChange}
        >
          <option value="">Слои текста</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
