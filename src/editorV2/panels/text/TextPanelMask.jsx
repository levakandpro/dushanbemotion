import React, { useCallback, useRef } from 'react'
import ResetButton from '../../components/ResetButton'

export default function TextPanelMask(props) {
  const { currentLayer, onChangeLayer } = props
  if (!currentLayer) return null

  const fileInputRef = useRef(null)

  const mask = currentLayer.mask || {
    enabled: false,
    source: 'none',
    type: null,
    src: null,
    imageUrl: null,
    gradientId: null,
    angle: 0,
    scale: 1
  }

  const handleToggleMask = useCallback(() => {
    if (!onChangeLayer) return
    onChangeLayer({
      mask: {
        ...mask,
        enabled: !mask.enabled
      }
    })
  }, [mask, onChangeLayer])

  const handleSource = useCallback(
    src => {
      if (!onChangeLayer) return

      const nextType = src === 'none' ? null : src

      onChangeLayer({
        mask: {
          ...mask,
          source: src,
          type: nextType,
          // Если выбираем источник, автоматически включаем маску (если есть изображение)
          enabled: src === 'none' ? false : (mask.enabled || !!mask.imageUrl)
        }
      })
    },
    [mask, onChangeLayer]
  )

  const handleNumberField = useCallback(
    (field, raw) => {
      if (!onChangeLayer) return
      const value = Number(raw) || 0
      onChangeLayer({
        mask: {
          ...mask,
          [field]: value
        }
      })
    },
    [mask, onChangeLayer]
  )

  const handleFileSelect = useCallback(
    (event) => {
      if (!onChangeLayer) return
      const file = event.target.files?.[0]
      if (!file) {
        console.log('Файл не выбран')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target.result
        console.log('Изображение загружено, URL:', url.substring(0, 50) + '...')
        onChangeLayer({
          mask: {
            ...mask,
            enabled: true,
            source: 'image',
            type: 'image',
            src: url,
            imageUrl: url
          }
        })
      }
      reader.onerror = () => {
        console.error('Ошибка чтения файла')
      }
      reader.readAsDataURL(file)
      
      // Сбрасываем input, чтобы можно было выбрать тот же файл снова
      if (event.target) {
        event.target.value = ''
      }
    },
    [mask, onChangeLayer]
  )

  const handleSelectFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div className="dm-text-section dm-text-mask-section">
      <div className="dm-field-group">
        <label className="dm-field-label">Маска изображения</label>
        <div className="dm-inline-row">
          <ResetButton
            isChanged={
              mask.enabled ||
              mask.type !== null ||
              !!mask.src ||
              !!mask.imageUrl
            }
            onReset={() => {
              if (!onChangeLayer) return
              onChangeLayer({
                mask: {
                  enabled: false,
                  source: 'none',
                  type: null,
                  src: null,
                  imageUrl: null,
                  gradientId: null,
                  angle: 0,
                  scale: 1
                }
              })
            }}
          />
          <button
            type="button"
            className={
              'dm-toggle-btn' +
              (mask.enabled ? ' dm-toggle-btn-active' : '')
            }
            onClick={handleToggleMask}
          >
            {mask.enabled ? 'Включена' : 'Выключена'}
          </button>
        </div>
      </div>

      {mask.enabled && (
        <>
          <div className="dm-field-group">
            <label className="dm-field-label">Выбрать изображение</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="dm-toggle-btn"
              onClick={handleSelectFile}
              style={{ width: '100%' }}
            >
              {mask.imageUrl ? 'Изменить изображение' : 'Выбрать изображение'}
            </button>
            {mask.imageUrl && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                ✓ Изображение загружено
              </div>
            )}
          </div>
          
          {mask.imageUrl && (
            <div className="dm-field-group">
              <label className="dm-field-label">Масштаб</label>
              <div className="dm-field-row">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={mask.scale ?? 1}
                  onChange={e => handleNumberField('scale', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  className="dm-input"
                  value={mask.scale ?? 1}
                  onChange={e => handleNumberField('scale', e.target.value)}
                  style={{ width: '70px', flexShrink: 0 }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
