// src/editorV2/utils/stickerClips.js

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

