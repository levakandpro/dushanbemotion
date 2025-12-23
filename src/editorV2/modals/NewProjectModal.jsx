import React from 'react'

const BG_OPTIONS = [
  { id: 'transparent', label: 'Прозрачный', sub: 'Экспорт с альфа-каналом' },
  { id: 'white', label: 'Белый', sub: 'Чистый лист под дизайн' },
  { id: 'dark', label: 'Тёмный', sub: 'Под неон и клипы' },
]

export default function NewProjectModal({ open, onCancel, onCreate, isAnimating = false }) {
  const [bg, setBg] = React.useState('white')
  const aspect = '16:9'

  if (!open) return null

  const handleCreate = () => {
    onCreate({ backgroundType: bg === 'dark' ? 'black' : bg, aspectRatio: aspect })
  }

  const previewBgClass =
    bg === 'white'
      ? 'preview-bg-white'
      : bg === 'dark'
      ? 'preview-bg-dark'
      : 'preview-bg-transparent'

  const previewAspectClass = 'preview-aspect-16-9'

  return (
    <div className={`editor-v2-modal-backdrop dm-modal-enter ${isAnimating ? 'dm-modal-enter-active' : ''}`}>
      <div className="editor-v2-modal editor-v2-modal-glass">
        <div className="editor-v2-modal-body">
          {/* Левая часть: заголовок + превью */}
          <div className="editor-v2-modal-left">
            <div className="editor-v2-modal-header-block">
              <h2 className="editor-v2-modal-title">Новый проект</h2>

              <p className="editor-v2-modal-desc">
                Выбери фон и формат кадра. Всё можно поменять позже.
              </p>
            </div>

            <div className="editor-v2-preview-card">
              <div className="editor-v2-preview-label-row">
                <span className="editor-v2-preview-label">Предпросмотр кадра</span>
                <span className="editor-v2-preview-meta">
                  {bg === 'dark' ? 'Тёмный' : bg === 'white' ? 'Белый' : 'Прозрачный'}
                </span>
              </div>

              <div className={`editor-v2-preview-frame ${previewAspectClass}`}>
                <div className={`editor-v2-preview-bg ${previewBgClass}`} />
                <video
                  className="editor-v2-preview-video"
                  src="https://archive.org/download/20251208_20251208_1202/%D1%80%D0%B5%D0%BA.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className={`editor-v2-preview-canvas ${previewAspectClass}`}>
                  <div className="editor-v2-preview-guides">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Правая часть: варианты */}
          <div className="editor-v2-modal-right">
            <div className="editor-v2-modal-section">
              <h3 className="editor-v2-modal-subtitle">Фон</h3>
              <div className="editor-v2-option-column">
                {BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={
                      'editor-v2-option-pill ' +
                      (bg === opt.id ? 'editor-v2-option-pill-active' : '')
                    }
                    onClick={() => setBg(opt.id)}
                  >
                    <div className="editor-v2-option-pill-left">
                      <span
                        className={
                          'editor-v2-option-swatch ' +
                          (opt.id === 'white'
                            ? 'swatch-white'
                            : opt.id === 'dark'
                            ? 'swatch-dark'
                            : 'swatch-transparent')
                        }
                      />
                      <span className="editor-v2-option-pill-label">{opt.label}</span>
                    </div>
                    <span className="editor-v2-option-pill-sub">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
 
            <div className="editor-v2-modal-footer">
              <button
                type="button"
                className="editor-v2-modal-btn editor-v2-modal-btn-ghost"
                onClick={onCancel}
              >
                Отмена
              </button>
              <button
                type="button"
                className="editor-v2-modal-btn editor-v2-modal-btn-primary"
                onClick={handleCreate}
              >
                Создать проект
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
