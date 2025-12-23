import React from 'react'

/**
 * Панель редактирования параметров выбранного аудио-клипа
 */
export default function AudioClipEditor({
  clip,
  onUpdateClip,
  isPremium = false
}) {
  if (!clip) {
    return (
      <div className="audio-clip-editor audio-clip-editor-empty">
        <p>Выберите клип для редактирования</p>
      </div>
    )
  }

  const handleChange = (field, value) => {
    onUpdateClip(clip.id, { [field]: value })
  }

  return (
    <div className="audio-clip-editor">
      <div className="clip-editor-header">
        <h4>{clip.audioSourceName}</h4>
      </div>

      <div className="clip-editor-section">
        <h5>Основные</h5>
        
        {/* Volume */}
        <div className="clip-editor-control">
          <label>
            Громкость: {Math.round(clip.volume * 100)}%
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={clip.volume}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
            />
          </label>
        </div>

        {/* Mute */}
        <div className="clip-editor-control">
          <label className="clip-editor-checkbox">
            <input
              type="checkbox"
              checked={clip.muted}
              onChange={(e) => handleChange('muted', e.target.checked)}
            />
            Выключить звук
          </label>
        </div>
      </div>

      <div className="clip-editor-section">
        <h5>Эффекты</h5>
        
        {/* Fade In */}
        <div className="clip-editor-control">
          <label>
            Fade In: {clip.fadeIn.toFixed(1)}с
            <input
              type="range"
              min="0"
              max={Math.min(1, clip.duration / 2)}
              step="0.1"
              value={clip.fadeIn}
              onChange={(e) => handleChange('fadeIn', parseFloat(e.target.value))}
            />
          </label>
        </div>

        {/* Fade Out */}
        <div className="clip-editor-control">
          <label>
            Fade Out: {clip.fadeOut.toFixed(1)}с
            <input
              type="range"
              min="0"
              max={Math.min(1, clip.duration / 2)}
              step="0.1"
              value={clip.fadeOut}
              onChange={(e) => handleChange('fadeOut', parseFloat(e.target.value))}
            />
          </label>
        </div>

        {/* Speed */}
        <div className="clip-editor-control">
          <label>Скорость:</label>
          <div className="clip-editor-buttons">
            {[0.5, 1, 1.5, 2].map(speed => (
              <button
                key={speed}
                className={`clip-editor-btn ${clip.speed === speed ? 'active' : ''}`}
                onClick={() => handleChange('speed', speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Loop */}
        <div className="clip-editor-control">
          <label className="clip-editor-checkbox">
            <input
              type="checkbox"
              checked={clip.loop}
              onChange={(e) => handleChange('loop', e.target.checked)}
            />
            Зациклить
          </label>
        </div>

        {/* Normalize */}
        <div className="clip-editor-control">
          <label className="clip-editor-checkbox">
            <input
              type="checkbox"
              checked={clip.normalize}
              onChange={(e) => handleChange('normalize', e.target.checked)}
            />
            Нормализовать громкость
          </label>
        </div>
      </div>

      {/* Премиум-секция */}
      <div className={`clip-editor-section clip-editor-premium ${!isPremium ? 'locked' : ''}`}>
        <h5>
          Премиум-эффекты
          {!isPremium && <span className="premium-badge">в­ђ Premium</span>}
        </h5>

        {/* Pitch */}
        <div className="clip-editor-control">
          <label>
            Высота тона: {clip.pitch > 0 ? '+' : ''}{clip.pitch}
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={clip.pitch}
              onChange={(e) => handleChange('pitch', parseInt(e.target.value))}
              disabled={!isPremium}
            />
          </label>
        </div>

        {/* EQ Preset */}
        <div className="clip-editor-control">
          <label>Эквалайзер:</label>
          <select
            value={clip.eqPreset}
            onChange={(e) => handleChange('eqPreset', e.target.value)}
            disabled={!isPremium}
          >
            <option value="none">Нет</option>
            <option value="bass">Больше баса</option>
            <option value="noise_cut">Убрать шум</option>
            <option value="bright">Яркость</option>
          </select>
        </div>

        {/* Reverb Preset */}
        <div className="clip-editor-control">
          <label>Реверберация:</label>
          <select
            value={clip.reverbPreset}
            onChange={(e) => handleChange('reverbPreset', e.target.value)}
            disabled={!isPremium}
          >
            <option value="none">Нет</option>
            <option value="small">Маленькая комната</option>
            <option value="hall">Зал</option>
            <option value="space">Космос</option>
          </select>
        </div>

        {!isPremium && (
          <div className="premium-cta">
            <button className="premium-cta-btn">
              Оформить Premium
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

