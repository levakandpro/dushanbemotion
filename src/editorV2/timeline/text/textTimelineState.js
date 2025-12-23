// src/editorV2/timeline/text/textTimelineState.js

// Для текстовых клипов мы используем ту же базовую модель, что и для стикеров,
// но с отдельным helper-слоем, чтобы не путать типы.

import {
  DEFAULT_STICKER_DURATION,
  MIN_CLIP_LENGTH,
  moveClip as baseMoveClip,
  trimClipStart as baseTrimClipStart,
  trimClipEnd as baseTrimClipEnd,
  splitClip as baseSplitClip,
  snapTime as baseSnapTime,
  getAllClipEdges as baseGetAllClipEdges,
  moveMultipleClips as baseMoveMultipleClips,
  deleteMultipleClips as baseDeleteMultipleClips,
} from '../stickers/stickerTimelineState'

export const DEFAULT_TEXT_DURATION = DEFAULT_STICKER_DURATION
export const MIN_TEXT_CLIP_LENGTH = MIN_CLIP_LENGTH

/**
 * @typedef {Object} TextTimelineClip
 * @property {string} id
 * @property {string} elementId   // id текстового слоя на canvas
 * @property {number} startTime
 * @property {number} endTime
 */

/**
 * Создаёт новый клип для текста
 * По умолчанию начинается с 0:00
 * @param {string} elementId
 * @param {number} startTime
 * @param {number} projectDuration - полная длительность проекта (если указана, используется как endTime)
 * @returns {TextTimelineClip}
 */
export function createTextClip(elementId, startTime = 0, projectDuration = null) {
  const endTime = startTime + 10 // По умолчанию 10 секунд
  return {
    id: `tclip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    elementId,
    startTime,
    endTime,
  }
}

// Переиспользуем общие операции
export const moveTextClip = baseMoveClip
export const trimTextClipStart = baseTrimClipStart
export const trimTextClipEnd = baseTrimClipEnd
export const splitTextClip = baseSplitClip
export const snapTextTime = baseSnapTime
export const getAllTextClipEdges = baseGetAllClipEdges
export const moveMultipleTextClips = baseMoveMultipleClips
export const deleteMultipleTextClips = baseDeleteMultipleClips


