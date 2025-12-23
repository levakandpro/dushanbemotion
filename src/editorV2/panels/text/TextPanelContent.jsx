import React, { useCallback, useMemo } from 'react'
import { createTextLayer } from '../../utils/textLayers'

export default function TextPanelContent(props) {
  const { currentLayer, onChangeLayer, project, onChangeProject, textLayers, onOpenSymbols, textAreaRef, onCursorChange } = props

  const handleChangeText = useCallback(
    event => {
      const text = event.target.value
      
      // Если нет слоя, создаём его при первом вводе
      if (!currentLayer && project && onChangeProject && Array.isArray(textLayers)) {
        const newLayer = createTextLayer(text || 'D MOTION')
        newLayer.text = text || 'D MOTION'

        const newClip = {
          id: `tclip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          elementId: newLayer.id,
          startTime: 0,
          endTime: 10 // 10 секунд по умолчанию
        }

        onChangeProject({
          ...project,
          textLayers: [...textLayers, newLayer],
          textClips: [...(project.textClips || []), newClip],
          selectedTextId: newLayer.id,
          selectedTextClipId: newClip.id,
          selectedTextClipIds: [newClip.id]
        })
        return
      }
      
      // Если слой есть, обновляем текст
      if (currentLayer && onChangeLayer) {
        onChangeLayer({ text })
      }
    },
    [currentLayer, onChangeLayer, project, onChangeProject, textLayers]
  )

  const textValue = useMemo(() => {
    return currentLayer?.text || 'D MOTION'
  }, [currentLayer])

  const reportCursor = useCallback((e) => {
    if (!onCursorChange) return
    const el = e?.target
    if (!el) return
    onCursorChange(el.selectionStart, el.selectionEnd)
  }, [onCursorChange])

  return (
    <div className="dm-text-section dm-text-content-section">
      <div className="dm-field-label-row">
        <button
          type="button"
          className="dm-text-symbols-inline-btn"
          onClick={onOpenSymbols}
        >
          <span className="dm-text-symbols-inline-btn__icon" aria-hidden="true">!</span>
          <span className="dm-text-symbols-inline-btn__text">ЗНАЧКИ И СИМВОЛЫ</span>
        </button>
      </div>
      <textarea
        className="dm-textarea dm-text-content-input"
        rows={3}
        value={textValue}
        onChange={handleChangeText}
        onClick={reportCursor}
        onKeyUp={reportCursor}
        onSelect={reportCursor}
        placeholder="Введите текст..."
        ref={textAreaRef}
      />
    </div>
  )
}
