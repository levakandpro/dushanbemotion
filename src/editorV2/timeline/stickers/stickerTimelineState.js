// src/editorV2/timeline/stickers/stickerTimelineState.js

/**
 * @typedef {Object} StickerTimelineClip
 * @property {string} id - Уникальный ID клипа
 * @property {string} elementId - ID стикера на Canvas
 * @property {number} startTime - Время начала в секундах
 * @property {number} endTime - Время окончания в секундах
 * @property {boolean} [hidden] - Скрыть клип (не показывать стикер)
 * @property {number} [inDuration] - Длительность анимации входа в секундах
 * @property {number} [outDuration] - Длительность анимации выхода в секундах
 * @property {number} [loopUntil] - Время до которого повторять клип
 */

/**
 * @typedef {Object} StickerTrackState
 * @property {string} elementId - ID стикера
 * @property {boolean} collapsed - Свернута ли строка
 * @property {boolean} locked - Заблокирована ли для редактирования
 * @property {boolean} hidden - Скрыта ли вся дорожка
 */

// Константы
export const DEFAULT_STICKER_DURATION = 3 // секунды
export const MIN_CLIP_LENGTH = 0.1 // минимальная длина клипа

/**
 * Создаёт новый клип для стикера
 * По умолчанию начинается с 0:00
 */
export function createStickerClip(elementId, startTime = 0, projectDuration = null) {
  const endTime = startTime + 10 // По умолчанию 10 секунд
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    elementId,
    startTime,
    endTime
  }
}

/**
 * Проверяет, виден ли стикер в данный момент времени
 */
export function isStickerVisibleAtTime(elementId, currentTime, clips, trackState = null) {
  // Проверяем, не скрыта ли вся дорожка
  if (trackState?.hidden) return false
  
  return clips.some(clip => 
    clip.elementId === elementId &&
    !clip.hidden && // учитываем hidden флаг клипа
    currentTime >= clip.startTime &&
    currentTime <= clip.endTime
  )
}

/**
 * Вычисляет opacity стикера с учётом анимаций входа/выхода
 */
export function getStickerOpacityAtTime(elementId, currentTime, clips) {
  const activeClip = clips.find(clip => 
    clip.elementId === elementId &&
    !clip.hidden &&
    currentTime >= clip.startTime &&
    currentTime <= clip.endTime
  )
  
  if (!activeClip) return 0
  
  const clipDuration = activeClip.endTime - activeClip.startTime
  const relativeTime = currentTime - activeClip.startTime
  
  // Анимация входа
  if (activeClip.inDuration && relativeTime < activeClip.inDuration) {
    return relativeTime / activeClip.inDuration
  }
  
  // Анимация выхода
  if (activeClip.outDuration) {
    const timeBeforeEnd = activeClip.endTime - currentTime
    if (timeBeforeEnd < activeClip.outDuration) {
      return timeBeforeEnd / activeClip.outDuration
    }
  }
  
  return 1
}

/**
 * Находит все клипы для данного стикера
 */
export function getClipsForSticker(elementId, clips) {
  return clips.filter(clip => clip.elementId === elementId)
}

/**
 * Перемещает клип
 */
export function moveClip(clip, newStartTime) {
  const duration = clip.endTime - clip.startTime
  const safeStart = Math.max(0, newStartTime)
  
  return {
    ...clip,
    startTime: safeStart,
    endTime: safeStart + duration
  }
}

/**
 * Обрезает начало клипа
 */
export function trimClipStart(clip, newStartTime) {
  const safeStart = Math.max(
    0,
    Math.min(newStartTime, clip.endTime - MIN_CLIP_LENGTH)
  )
  
  return {
    ...clip,
    startTime: safeStart
  }
}

/**
 * Обрезает конец клипа
 */
export function trimClipEnd(clip, newEndTime) {
  const safeEnd = Math.max(
    clip.startTime + MIN_CLIP_LENGTH,
    newEndTime
  )
  
  return {
    ...clip,
    endTime: safeEnd
  }
}

/**
 * Разделяет клип в указанной точке
 */
export function splitClip(clip, atTime) {
  if (atTime <= clip.startTime || atTime >= clip.endTime) {
    return [clip]
  }
  
  const clipA = {
    ...clip,
    id: `clip_${Date.now()}_a_${Math.random().toString(36).substr(2, 9)}`,
    endTime: atTime
  }
  
  const clipB = {
    ...clip,
    id: `clip_${Date.now()}_b_${Math.random().toString(36).substr(2, 9)}`,
    startTime: atTime
  }
  
  return [clipA, clipB]
}

/**
 * Магнит (snap) к ближайшим точкам
 */
export function snapTime(rawTime, options = {}) {
  const {
    otherClipEdges = [],
    playheadTime = 0,
    beats = [], // биты аудио
    tolerance = 0.1, // секунды
    snapEnabled = true
  } = options
  
  if (!snapEnabled) return rawTime
  
  // Собираем все точки для снэпа
  const snapPoints = [
    playheadTime,
    0, // начало таймлайна
    ...otherClipEdges,
    ...beats // добавляем биты
  ]
  
  // Ищем ближайшую точку
  let closestPoint = null
  let minDistance = tolerance
  
  for (const point of snapPoints) {
    const distance = Math.abs(rawTime - point)
    if (distance < minDistance) {
      minDistance = distance
      closestPoint = point
    }
  }
  
  return closestPoint !== null ? closestPoint : rawTime
}

/**
 * Находит ближайший бит к заданному времени
 */
export function snapToNearestBeat(time, beats, tolerance = 0.2) {
  if (!beats || beats.length === 0) return null
  
  let nearest = null
  let minDistance = tolerance
  
  for (const beat of beats) {
    const distance = Math.abs(time - beat)
    if (distance < minDistance) {
      minDistance = distance
      nearest = beat
    }
  }
  
  return nearest
}

/**
 * Получает все края клипов (для снэпа)
 */
export function getAllClipEdges(clips, excludeClipId = null) {
  const edges = []
  
  for (const clip of clips) {
    if (clip.id !== excludeClipId) {
      edges.push(clip.startTime)
      edges.push(clip.endTime)
    }
  }
  
  return edges
}

/**
 * Удаляет клип
 */
export function deleteClip(clips, clipId) {
  return clips.filter(clip => clip.id !== clipId)
}

/**
 * Дублирует клип
 */
export function duplicateClip(clip, offsetTime = 0) {
  const duration = clip.endTime - clip.startTime
  const newStart = clip.endTime + offsetTime
  
  return {
    ...clip,
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: newStart,
    endTime: newStart + duration
  }
}

/**
 * Перемещает несколько клипов одновременно
 */
export function moveMultipleClips(clips, clipIds, deltaTime) {
  return clips.map(clip => {
    if (!clipIds.includes(clip.id)) return clip
    
    const duration = clip.endTime - clip.startTime
    const newStart = Math.max(0, clip.startTime + deltaTime)
    
    return {
      ...clip,
      startTime: newStart,
      endTime: newStart + duration
    }
  })
}

/**
 * Удаляет несколько клипов
 */
export function deleteMultipleClips(clips, clipIds) {
  return clips.filter(clip => !clipIds.includes(clip.id))
}

/**
 * Создаёт дефолтное состояние дорожки
 */
export function createTrackState(elementId) {
  return {
    elementId,
    collapsed: false,
    locked: false,
    hidden: false
  }
}

/**
 * Группирует клипы по elementId
 */
export function groupClipsByElement(clips) {
  const grouped = {}
  
  for (const clip of clips) {
    if (!grouped[clip.elementId]) {
      grouped[clip.elementId] = []
    }
    grouped[clip.elementId].push(clip)
  }
  
  return grouped
}

