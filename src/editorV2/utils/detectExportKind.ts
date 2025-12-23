// src/editorV2/utils/detectExportKind.ts

export type ExportKind = 'video' | 'image'

/**
 * Определяет тип экспорта проекта: видео или изображение
 * 
 * Правила определения:
 * 1. Посчитать длительность проекта: projectDuration = max(endTime всех клипов и слоёв)
 * 2. Проверить флаги:
 *    - hasVideo = есть хоть один слой типа "video clip / footage / gif"
 *    - hasAudio = есть хоть одна аудиодорожка / звуковой слой
 *    - hasKeyframes = есть хоть одно свойство с 2+ ключевыми кадрами
 * 
 * Решение:
 * - если hasVideo ИЛИ hasAudio ИЛИ hasKeyframes ИЛИ projectDuration > 1 сек → 'video'
 * - иначе → 'image'
 */
export function detectExportKind(project: any): ExportKind {
  if (!project) return 'image'

  // 1. Вычисляем projectDuration = max(endTime всех клипов и слоёв)
  let projectDuration = 0
  let hasAnyClips = false

  // Проверяем аудио клипы
  if (project.timeline?.clips && Array.isArray(project.timeline.clips) && project.timeline.clips.length > 0) {
    hasAnyClips = true
    for (const clip of project.timeline.clips) {
      const endTime = (clip.startTime || 0) + (clip.duration || 0)
      projectDuration = Math.max(projectDuration, endTime)
    }
  }

  // Проверяем видео клипы
  if (project.videoClips && Array.isArray(project.videoClips) && project.videoClips.length > 0) {
    hasAnyClips = true
    for (const clip of project.videoClips) {
      const endTime = (clip.startTime || 0) + (clip.duration || 0)
      projectDuration = Math.max(projectDuration, endTime)
    }
  }

  // Проверяем стикер клипы
  if (project.stickerClips && Array.isArray(project.stickerClips) && project.stickerClips.length > 0) {
    hasAnyClips = true
    for (const clip of project.stickerClips) {
      const endTime = clip.endTime || ((clip.startTime || 0) + (clip.duration || 0))
      projectDuration = Math.max(projectDuration, endTime)
    }
  }

  // Проверяем timeline.projectDuration и durationMs как fallback
  // НО: учитываем только если есть реальные клипы, иначе это может быть дефолтное значение (30 сек)
  if (hasAnyClips) {
    // Если есть клипы, используем timeline.projectDuration
    const timelineDuration = project.timeline?.projectDuration || 
      (project.timeline?.durationMs ? project.timeline.durationMs / 1000 : 0) ||
      (project.durationMs ? project.durationMs / 1000 : 0)
    projectDuration = Math.max(projectDuration, timelineDuration)
  }
  // Если клипов нет, не используем timeline.projectDuration (может быть дефолтное значение 30 сек)

  // 2. Проверяем hasVideo = есть хоть один слой типа "video clip / footage / gif"
  const hasVideo = 
    (project.videoLayers && project.videoLayers.length > 0) ||
    (project.videoClips && project.videoClips.length > 0) ||
    (project.videoLayers && project.videoLayers.some((layer: any) => 
      layer.type === 'video' || 
      layer.type === 'footage' || 
      layer.type === 'gif' ||
      layer.sourceType === 'video'
    ))

  // 3. Проверяем hasAudio = есть хоть одна аудиодорожка / звуковой слой
  const hasAudio = 
    (project.timeline?.clips && Array.isArray(project.timeline.clips) && project.timeline.clips.length > 0) ||
    (project.audioLayers && project.audioLayers.length > 0)

  // 4. Проверяем hasKeyframes = есть хоть одно свойство с 2+ ключевыми кадрами
  let hasKeyframes = false

  // Проверяем textLayers
  if (project.textLayers && Array.isArray(project.textLayers)) {
    for (const layer of project.textLayers) {
      // Проверяем keyframes массивы
      if (layer.keyframes && Array.isArray(layer.keyframes) && layer.keyframes.length >= 2) {
        hasKeyframes = true
        break
      }
      // Проверяем анимационные свойства (position, scale, opacity и т.д.)
      if (layer.animations) {
        for (const prop of Object.values(layer.animations)) {
          if (Array.isArray(prop) && prop.length >= 2) {
            hasKeyframes = true
            break
          }
          if (prop && typeof prop === 'object' && prop.keyframes && Array.isArray(prop.keyframes) && prop.keyframes.length >= 2) {
            hasKeyframes = true
            break
          }
        }
      }
      if (hasKeyframes) break
    }
  }

  // Проверяем stickerLayers
  if (!hasKeyframes && project.stickerLayers && Array.isArray(project.stickerLayers)) {
    for (const layer of project.stickerLayers) {
      if (layer.keyframes && Array.isArray(layer.keyframes) && layer.keyframes.length >= 2) {
        hasKeyframes = true
        break
      }
      if (layer.animations) {
        for (const prop of Object.values(layer.animations)) {
          if (Array.isArray(prop) && prop.length >= 2) {
            hasKeyframes = true
            break
          }
          if (prop && typeof prop === 'object' && prop.keyframes && Array.isArray(prop.keyframes) && prop.keyframes.length >= 2) {
            hasKeyframes = true
            break
          }
        }
      }
      if (hasKeyframes) break
    }
  }

  // Проверяем iconLayers
  if (!hasKeyframes && project.iconLayers && Array.isArray(project.iconLayers)) {
    for (const layer of project.iconLayers) {
      if (layer.keyframes && Array.isArray(layer.keyframes) && layer.keyframes.length >= 2) {
        hasKeyframes = true
        break
      }
      if (layer.animations) {
        for (const prop of Object.values(layer.animations)) {
          if (Array.isArray(prop) && prop.length >= 2) {
            hasKeyframes = true
            break
          }
          if (prop && typeof prop === 'object' && prop.keyframes && Array.isArray(prop.keyframes) && prop.keyframes.length >= 2) {
            hasKeyframes = true
            break
          }
        }
      }
      if (hasKeyframes) break
    }
  }

  // Решение: если hasVideo ИЛИ hasAudio ИЛИ hasKeyframes ИЛИ projectDuration > 1 сек → 'video'
  const isVideo = hasVideo || hasAudio || hasKeyframes || projectDuration > 1
  
  // Логирование для отладки
  console.log('🔍 detectExportKind:', {
    projectDuration,
    hasVideo,
    hasAudio,
    hasKeyframes,
    isVideo,
    result: isVideo ? 'video' : 'image'
  })
  
  if (isVideo) {
    return 'video'
  }

  // Иначе → 'image'
  return 'image'
}

