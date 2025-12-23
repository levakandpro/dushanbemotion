// src/editorV2/luts/lutEngine.ts

import { LutDefinition, LutInstance, LutStack } from './lutTypes'

/**
 * Движок применения LUT к слоям
 * Преобразует параметры LUT в CSS фильтры и стили
 */

/**
 * Применяет LUT к элементу через CSS фильтры
 */
export function applyLutToElement(
  element: HTMLElement,
  lutDef: LutDefinition,
  intensity: number = 1
): void {
  if (!element || !lutDef) return

  const { grade } = lutDef
  const filters: string[] = []

  // Контраст
  if (grade.contrast !== 0) {
    const contrastValue = 1 + (grade.contrast * intensity)
    filters.push(`contrast(${contrastValue})`)
  }

  // Яркость (через gamma)
  if (grade.gamma !== 1) {
    const brightnessValue = Math.pow(1, grade.gamma * intensity)
    filters.push(`brightness(${brightnessValue})`)
  }

  // Насыщенность (из HSL)
  const avgSaturation = calculateAverageSaturation(grade.hsl)
  if (avgSaturation !== 0) {
    const satValue = 1 + (avgSaturation / 100 * intensity)
    filters.push(`saturate(${satValue})`)
  }

  // Цветовой баланс (temperature и tint через hue-rotate и sepia)
  if (grade.balance.temp !== 0 || grade.balance.tint !== 0) {
    // Упрощенная реализация через hue-rotate
    const hueRotate = (grade.balance.temp + grade.balance.tint) * intensity * 0.1
    if (hueRotate !== 0) {
      filters.push(`hue-rotate(${hueRotate}deg)`)
    }
  }

  // Fade (через opacity или brightness)
  if (grade.film.fade > 0) {
    const fadeValue = 1 - (grade.film.fade * intensity)
    filters.push(`opacity(${fadeValue})`)
  }

  // Применяем фильтры
  if (filters.length > 0) {
    element.style.filter = filters.join(' ')
  }
}

/**
 * Вычисляет среднюю насыщенность из HSL зон
 */
function calculateAverageSaturation(hsl: any): number {
  const zones = Object.values(hsl).filter(Boolean) as any[]
  if (zones.length === 0) return 0
  
  const totalSat = zones.reduce((sum, zone) => sum + (zone.s || 0), 0)
  return totalSat / zones.length
}

/**
 * Применяет стек LUT к элементу
 */
export function applyLutStack(
  element: HTMLElement,
  lutStack: LutStack,
  lutRegistry: Map<string, LutDefinition>
): void {
  if (!element || !lutStack || lutStack.length === 0) {
    element.style.filter = ''
    return
  }

  // Применяем все включенные LUT по порядку
  const enabledLuts = lutStack.filter(lut => lut.enabled)
  
  if (enabledLuts.length === 0) {
    element.style.filter = ''
    return
  }

  // Для множественных LUT применяем их последовательно
  // В реальной реализации это должно быть более сложное смешивание
  const lastLut = enabledLuts[enabledLuts.length - 1]
  const lutDef = lutRegistry.get(lastLut.id)
  
  if (lutDef) {
    applyLutToElement(element, lutDef, lastLut.intensity || 1)
  }
}

/**
 * Конвертирует LUT в CSS filter строку
 */
export function lutToCssFilter(lutDef: LutDefinition, intensity: number = 1): string {
  const { grade } = lutDef
  const filters: string[] = []

  // Контраст
  if (grade.contrast !== 0) {
    filters.push(`contrast(${1 + grade.contrast * intensity})`)
  }

  // Gamma через brightness
  if (grade.gamma !== 1) {
    filters.push(`brightness(${Math.pow(1, grade.gamma * intensity)})`)
  }

  // Насыщенность
  const avgSat = calculateAverageSaturation(grade.hsl)
  if (avgSat !== 0) {
    filters.push(`saturate(${1 + avgSat / 100 * intensity})`)
  }

  // Hue rotate для цветового баланса
  const hueRotate = (grade.balance.temp + grade.balance.tint) * intensity * 0.1
  if (hueRotate !== 0) {
    filters.push(`hue-rotate(${hueRotate}deg)`)
  }

  // Fade
  if (grade.film.fade > 0) {
    filters.push(`opacity(${1 - grade.film.fade * intensity})`)
  }

  return filters.join(' ')
}

