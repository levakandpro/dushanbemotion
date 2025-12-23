// =============================================
// МОДЕЛЬ ДАННЫХ АУДИО-ТАЙМЛАЙНА
// =============================================

/**
 * Создаёт новый аудио-клип
 * @param {Object} params
 * @returns {AudioClip}
 */
export function createAudioClip({
  audioSourceId,
  audioSourceName = 'Audio',
  startTime = 0,
  duration = 0,
  offsetInSource = 0,
  sourceDuration = 0
}) {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    audioSourceId,
    audioSourceName,
    startTime,
    duration,
    offsetInSource,
    sourceDuration,
    
    // Базовые параметры
    volume: 1.0, // 0–2.0, где 1.0 = 100%
    muted: false,
    
    // Дополнительные эффекты
    fadeIn: 0, // секунды
    fadeOut: 0, // секунды
    speed: 1, // 0.5, 1, 1.5, 2
    loop: false,
    normalize: false,
    
    // Премиум-эффекты
    pitch: 0, // -12...+12 полутонов
    eqPreset: 'none', // 'none' | 'bass' | 'noise_cut' | 'bright'
    reverbPreset: 'none', // 'none' | 'small' | 'hall' | 'space'
    
    // Флаг премиум-использования
    isPremiumEffectUsed: false
  }
}

/**
 * Создаёт начальное состояние таймлайна
 * @returns {TimelineState}
 */
export function createInitialTimelineState() {
  return {
    clips: [],
    projectDuration: 600, // 10 минут по умолчанию
    minDuration: 600,
    animationMaxDuration: 0,
    currentTime: 0,
    isPlaying: false,
    isTimelineExpanded: false,
    pixelsPerSecond: 60, // масштаб таймлайна
    selectedClipId: null
  }
}

/**
 * Вычисляет длину проекта
 * @param {AudioClip[]} clips
 * @param {number} animationMaxDuration
 * @param {number} minDuration
 * @returns {number}
 */
export function calculateProjectDuration(clips, animationMaxDuration, minDuration = 30) {
  const audioMaxEnd = clips.length > 0
    ? Math.max(...clips.map(clip => clip.startTime + clip.duration))
    : 0
  
  return Math.max(audioMaxEnd, animationMaxDuration, minDuration)
}

/**
 * Проверяет, использует ли клип премиум-эффекты
 * @param {AudioClip} clip
 * @returns {boolean}
 */
export function checkPremiumEffectUsage(clip) {
  return (
    clip.pitch !== 0 ||
    clip.eqPreset !== 'none' ||
    clip.reverbPreset !== 'none'
  )
}

/**
 * Обновляет флаг использования премиум-эффектов
 * @param {AudioClip} clip
 * @returns {AudioClip}
 */
export function updatePremiumFlag(clip) {
  return {
    ...clip,
    isPremiumEffectUsed: checkPremiumEffectUsage(clip)
  }
}

/**
 * Разделяет клип на две части в указанной точке
 * @param {AudioClip} clip
 * @param {number} splitTime - время в секундах от начала проекта
 * @returns {[AudioClip, AudioClip] | null}
 */
export function splitClip(clip, splitTime) {
  const relativeTime = splitTime - clip.startTime
  
  // Проверяем, что точка разделения внутри клипа
  if (relativeTime <= 0 || relativeTime >= clip.duration) {
    return null
  }
  
  const firstClip = {
    ...clip,
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    duration: relativeTime
  }
  
  const secondClip = {
    ...clip,
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: splitTime,
    offsetInSource: clip.offsetInSource + relativeTime,
    duration: clip.duration - relativeTime
  }
  
  return [firstClip, secondClip]
}

/**
 * Находит клип в указанное время
 * @param {AudioClip[]} clips
 * @param {number} time
 * @returns {AudioClip | null}
 */
export function findClipAtTime(clips, time) {
  return clips.find(clip => 
    time >= clip.startTime && time < clip.startTime + clip.duration
  ) || null
}

