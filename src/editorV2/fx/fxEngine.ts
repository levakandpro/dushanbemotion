// src/editorV2/fx/fxEngine.ts

/**
 * Единый движок применения эффектов FX ко всем типам слоев
 */

import { FxStack, FxInstance } from './fxTypes'
import { getFxById } from './fxRegistry'

/**
 * Контекст для рендеринга кадра
 */
export interface FrameContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  time?: number // Для анимированных эффектов
}

/**
 * Применяет стек эффектов к слою
 * 
 * @param sourceCanvas - Исходный канвас слоя
 * @param frameCtx - Контекст для рендеринга
 * @param fxStack - Стек эффектов для применения
 * @returns Обработанный канвас
 */
export function applyFxStack(
  sourceCanvas: HTMLCanvasElement,
  frameCtx: FrameContext,
  fxStack: FxStack
): HTMLCanvasElement {
  if (!fxStack || fxStack.length === 0) {
    return sourceCanvas
  }

  // Фильтруем только включенные эффекты
  const enabledFx = fxStack.filter(fx => fx.enabled)
  
  if (enabledFx.length === 0) {
    return sourceCanvas
  }

  // Создаем промежуточные буферы
  let currentCanvas = sourceCanvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = frameCtx.width
  tempCanvas.height = frameCtx.height
  const tempCtx = tempCanvas.getContext('2d')
  
  if (!tempCtx) {
    console.error('❌ fxEngine: Failed to create temp canvas context')
    return sourceCanvas
  }

  // Применяем эффекты последовательно
  for (const fxInstance of enabledFx) {
    const fxDef = getFxById(fxInstance.id)
    
    if (!fxDef) {
      console.warn(`⚠️ fxEngine: FX definition not found: ${fxInstance.id}`)
      continue
    }

    // Применяем эффект
    const result = applyFxEffect(currentCanvas, tempCanvas, tempCtx, fxDef, fxInstance.params, frameCtx)
    
    if (result) {
      // Используем результат как источник для следующего эффекта
      currentCanvas = result
    }
  }

  // Копируем результат в итоговый канвас
  frameCtx.ctx.clearRect(0, 0, frameCtx.width, frameCtx.height)
  frameCtx.ctx.drawImage(currentCanvas, 0, 0)

  return frameCtx.canvas
}

/**
 * Применяет один эффект
 * 
 * @private
 */
function applyFxEffect(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  fxDef: any,
  params: Record<string, number | boolean>,
  frameCtx: FrameContext
): HTMLCanvasElement | null {
  // Очищаем целевой канвас
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  
  // Копируем исходное изображение
  targetCtx.drawImage(sourceCanvas, 0, 0)

  // Применяем эффект через CSS фильтры или canvas операции
  // В зависимости от типа эффекта
  switch (fxDef.id) {
    case 'gaussianBlur':
      const blurRadius = (params.radius as number) || 5
      targetCtx.filter = `blur(${blurRadius}px)`
      targetCtx.drawImage(sourceCanvas, 0, 0)
      targetCtx.filter = 'none'
      break

    case 'sepia':
      const sepiaIntensity = (params.intensity as number) || 0.8
      targetCtx.filter = `sepia(${sepiaIntensity * 100}%)`
      targetCtx.drawImage(sourceCanvas, 0, 0)
      targetCtx.filter = 'none'
      break

    case 'blackWhite':
      const bwIntensity = (params.intensity as number) || 1.0
      targetCtx.filter = `grayscale(${bwIntensity * 100}%)`
      targetCtx.drawImage(sourceCanvas, 0, 0)
      targetCtx.filter = 'none'
      break

    case 'brightness':
    case 'contrast':
    case 'saturation':
      // Эти эффекты применяются через filter
      const value = (params.intensity as number) || (params.amount as number) || 1.0
      const filterName = fxDef.id === 'brightness' ? 'brightness' : 
                        fxDef.id === 'contrast' ? 'contrast' : 'saturate'
      targetCtx.filter = `${filterName}(${value})`
      targetCtx.drawImage(sourceCanvas, 0, 0)
      targetCtx.filter = 'none'
      break

    case 'vignette':
      const vignetteIntensity = (params.intensity as number) || 0.5
      const vignetteSize = (params.size as number) || 0.5
      applyVignette(targetCtx, targetCanvas.width, targetCanvas.height, vignetteIntensity, vignetteSize)
      break

    case 'colorGrading':
      const contrast = (params.contrast as number) || 1.0
      const saturation = (params.saturation as number) || 1.0
      const brightness = (params.brightness as number) || 0
      applyColorGrading(targetCtx, sourceCanvas, contrast, saturation, brightness)
      break

    default:
      // Для остальных эффектов пока просто возвращаем исходное изображение
      // В будущем здесь будут шейдеры или более сложная обработка
      console.log(`ℹ️ fxEngine: Effect ${fxDef.id} not yet implemented`)
      return targetCanvas
  }

  return targetCanvas
}

/**
 * Применяет виньетку
 */
function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  size: number
) {
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)
  const radius = maxRadius * size

  const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius)
  gradient.addColorStop(0, `rgba(0, 0, 0, 0)`)
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

/**
 * Применяет цветокоррекцию
 */
function applyColorGrading(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  contrast: number,
  saturation: number,
  brightness: number
) {
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // Яркость
    data[i] = Math.max(0, Math.min(255, data[i] + brightness * 255))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness * 255))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness * 255))

    // Контраст
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128))
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))

    // Насыщенность (упрощенная версия)
    if (saturation !== 1.0) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = gray + (data[i] - gray) * saturation
      data[i + 1] = gray + (data[i + 1] - gray) * saturation
      data[i + 2] = gray + (data[i + 2] - gray) * saturation
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

