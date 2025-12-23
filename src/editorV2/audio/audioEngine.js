// =============================================
// АУДИО-ДВИЖОК ДЛЯ ВОСПРОИЗВЕДЕНИЯ КЛИПОВ
// =============================================

/**
 * Класс для управления воспроизведением аудио-клипов
 */
export class AudioEngine {
  constructor() {
    this.audioContext = null
    this.audioElements = new Map() // clipId -> {audio, gainNode, startedAt, pausedAt}
    this.isPlaying = false
    this.currentTime = 0
    this.startTime = 0
    this.animationFrameId = null
    this.onTimeUpdate = null
  }

  /**
   * Инициализация Audio Context
   */
  initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    return this.audioContext
  }

  /**
   * Загрузка аудио-клипа
   */
  loadClip(clip) {
    if (this.audioElements.has(clip.id)) return

    const audio = new Audio(clip.audioSourceId)
    audio.preload = 'auto'
    audio.volume = clip.muted ? 0 : Math.min(1, clip.volume)
    audio.playbackRate = clip.speed || 1

    this.audioElements.set(clip.id, {
      audio,
      clip,
      gainNode: null,
      startedAt: null,
      pausedAt: null
    })
  }

  /**
   * Выгрузка клипа
   */
  unloadClip(clipId) {
    const element = this.audioElements.get(clipId)
    if (element) {
      element.audio.pause()
      element.audio.src = ''
      this.audioElements.delete(clipId)
    }
  }

  /**
   * Начать воспроизведение
   */
  play(clips, currentTime) {
    // Если уже играет, просто обновляем время через seek
    if (this.isPlaying) {
      this.seek(currentTime || 0)
      return
    }

    this.initContext()
    this.isPlaying = true
    this.currentTime = currentTime || 0
    this.startTime = Date.now() - (currentTime || 0) * 1000

    // Загружаем и запускаем все активные клипы (даже если массив пустой)
    if (clips && Array.isArray(clips)) {
      clips.forEach(clip => {
        if (clip && clip.id) {
          this.loadClip(clip)
          this.updateClipPlayback(clip, this.currentTime)
        }
      })
    }

    // Запускаем цикл обновления времени (важно - даже без клипов!)
    this.startTimeUpdate()
  }

  /**
   * Остановить воспроизведение
   */
  pause() {
    if (!this.isPlaying) return

    this.isPlaying = false
    
    // Останавливаем все аудио
    this.audioElements.forEach(({ audio }) => {
      audio.pause()
    })

    // Останавливаем цикл обновления
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Сохраняем текущее время для возобновления
    this.currentTime = (Date.now() - this.startTime) / 1000
  }

  /**
   * Перемотка на указанное время
   */
  seek(time) {
    this.currentTime = time
    
    if (this.isPlaying) {
      this.startTime = Date.now() - time * 1000
    }
  }

  /**
   * Обновление воспроизведения клипа
   */
  updateClipPlayback(clip, currentTime) {
    const element = this.audioElements.get(clip.id)
    if (!element) return

    const { audio } = element
    const clipStart = clip.startTime
    const clipEnd = clip.startTime + clip.duration

    // Проверяем, должен ли клип играть в текущий момент
    if (currentTime >= clipStart && currentTime < clipEnd) {
      // Вычисляем позицию в источнике
      const positionInClip = currentTime - clipStart
      const sourcePosition = clip.offsetInSource + positionInClip

      // Применяем громкость с учетом fade
      const fadeVolume = this.calculateFadeVolume(clip, positionInClip)
      audio.volume = clip.muted ? 0 : Math.min(1, clip.volume * fadeVolume)
      audio.playbackRate = clip.speed || 1

      // Устанавливаем позицию и запускаем
      if (audio.paused || Math.abs(audio.currentTime - sourcePosition) > 0.1) {
        audio.currentTime = sourcePosition
        audio.play().catch(e => console.warn('Audio play failed:', e))
      }
    } else {
      // Клип не должен играть
      if (!audio.paused) {
        audio.pause()
      }
    }
  }

  /**
   * Вычисление громкости с учетом fade in/out
   */
  calculateFadeVolume(clip, positionInClip) {
    let volume = 1.0

    // Fade in
    if (clip.fadeIn > 0 && positionInClip < clip.fadeIn) {
      volume = positionInClip / clip.fadeIn
    }

    // Fade out
    if (clip.fadeOut > 0) {
      const fadeOutStart = clip.duration - clip.fadeOut
      if (positionInClip > fadeOutStart) {
        volume = Math.min(volume, (clip.duration - positionInClip) / clip.fadeOut)
      }
    }

    return Math.max(0, Math.min(1, volume))
  }

  /**
   * Цикл обновления текущего времени
   */
  startTimeUpdate() {
    // Останавливаем предыдущий цикл, если он был
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    const update = () => {
      if (!this.isPlaying) {
        this.animationFrameId = null
        return
      }

      // Обновляем текущее время
      this.currentTime = (Date.now() - this.startTime) / 1000

      // Уведомляем о изменении времени (важно вызывать всегда, даже без клипов)
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime)
      }

      // Обновляем воспроизведение всех клипов
      this.audioElements.forEach(({ clip }) => {
        this.updateClipPlayback(clip, this.currentTime)
      })

      this.animationFrameId = requestAnimationFrame(update)
    }

    update()
  }

  /**
   * Обновление параметров клипа
   */
  updateClip(clip) {
    const element = this.audioElements.get(clip.id)
    if (!element) return

    element.clip = clip
    element.audio.volume = clip.muted ? 0 : Math.min(1, clip.volume)
    element.audio.playbackRate = clip.speed || 1
  }

  /**
   * Синхронизация с новым списком клипов
   */
  syncClips(clips) {
    // Удаляем клипы, которых больше нет
    const clipIds = new Set(clips.map(c => c.id))
    this.audioElements.forEach((_, clipId) => {
      if (!clipIds.has(clipId)) {
        this.unloadClip(clipId)
      }
    })

    // Загружаем новые клипы
    clips.forEach(clip => {
      if (!this.audioElements.has(clip.id)) {
        this.loadClip(clip)
      } else {
        this.updateClip(clip)
      }
    })
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    this.pause()
    this.audioElements.forEach((_, clipId) => {
      this.unloadClip(clipId)
    })
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Глобальный экземпляр движка
let globalAudioEngine = null

/**
 * Получить глобальный экземпляр аудио-движка
 */
export function getAudioEngine() {
  if (!globalAudioEngine) {
    globalAudioEngine = new AudioEngine()
  }
  return globalAudioEngine
}

