// src/editorV2/luts/lutToCss.js

import { LUT_REGISTRY } from './lutRegistry'

/**
 * Конвертирует lutStack в CSS filter строку
 */
export function lutStackToCssFilter(lutStack) {
  if (!lutStack || !Array.isArray(lutStack) || lutStack.length === 0) {
    return ''
  }

  // Применяем только включенные LUT
  const enabledLuts = lutStack.filter(lut => lut.enabled)
  if (enabledLuts.length === 0) {
    return ''
  }

  // Для множественных LUT применяем последний активный
  // В реальной реализации это должно быть более сложное смешивание
  const lastLut = enabledLuts[enabledLuts.length - 1]
  const lutDef = LUT_REGISTRY.find(lut => lut.id === lastLut.id)
  
  if (!lutDef) {
    return ''
  }

  return lutToCssFilter(lutDef, lastLut.intensity || 1)
}

/**
 * Конвертирует один LUT в CSS filter строку
 */
function lutToCssFilter(lutDef, intensity = 1) {
  const { grade } = lutDef
  const filters = []

  // Контраст
  if (grade.contrast !== 0) {
    const contrastValue = 1 + (grade.contrast * intensity)
    filters.push(`contrast(${contrastValue})`)
  }

  // Gamma через brightness
  if (grade.gamma !== 1) {
    const brightnessValue = Math.pow(1, grade.gamma * intensity)
    filters.push(`brightness(${brightnessValue})`)
  }

  // Насыщенность (средняя из HSL зон)
  const avgSaturation = calculateAverageSaturation(grade.hsl)
  if (avgSaturation !== 0) {
    const satValue = 1 + (avgSaturation / 100 * intensity)
    filters.push(`saturate(${satValue})`)
  }

  // Цветовой баланс через hue-rotate
  const hueRotate = (grade.balance.temp + grade.balance.tint) * intensity * 0.1
  if (hueRotate !== 0) {
    filters.push(`hue-rotate(${hueRotate}deg)`)
  }

  // Fade через opacity
  if (grade.film.fade > 0) {
    const fadeValue = 1 - (grade.film.fade * intensity)
    filters.push(`opacity(${fadeValue})`)
  }

  return filters.join(' ')
}

/**
 * Вычисляет среднюю насыщенность из HSL зон
 */
function calculateAverageSaturation(hsl) {
  const zones = Object.values(hsl).filter(Boolean)
  if (zones.length === 0) return 0
  
  const totalSat = zones.reduce((sum, zone) => sum + (zone.s || 0), 0)
  return totalSat / zones.length
}

