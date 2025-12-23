// src/editorV2/fx/fxToCss.js
/**
 * Конвертирует fxStack в CSS фильтры для применения к слоям
 */

// Импортируем реестр эффектов
import { FX_REGISTRY } from './fxRegistry'

/**
 * Конвертирует fxStack в CSS filter строку
 * @param {Array} fxStack - Массив FxInstance
 * @returns {string} CSS filter строка
 */
export function fxStackToCssFilter(fxStack) {
  if (!fxStack || !Array.isArray(fxStack) || fxStack.length === 0) {
    return 'none'
  }

  const filters = []
  
  // Фильтруем только включенные эффекты
  const enabledFx = fxStack.filter(fx => fx.enabled)
  
  for (const fxInstance of enabledFx) {
    const fxDef = FX_REGISTRY.find(fx => fx.id === fxInstance.id)
    if (!fxDef) continue

    const params = fxInstance.params || {}
    
    // Применяем эффекты через CSS фильтры
    switch (fxInstance.id) {
      case 'gaussianBlur':
        const blurRadius = params.radius || 5
        filters.push(`blur(${blurRadius}px)`)
        break

      case 'sepia':
        const sepiaIntensity = params.intensity || 0.8
        filters.push(`sepia(${sepiaIntensity * 100}%)`)
        break

      case 'blackWhite':
      case 'grayscale':
        const bwIntensity = params.intensity || 1.0
        filters.push(`grayscale(${bwIntensity * 100}%)`)
        break

      case 'brightness':
        const brightness = params.intensity || params.amount || 1.0
        filters.push(`brightness(${brightness})`)
        break

      case 'contrast':
        const contrast = params.intensity || params.amount || 1.0
        filters.push(`contrast(${contrast})`)
        break

      case 'saturation':
        const saturation = params.intensity || params.amount || 1.0
        filters.push(`saturate(${saturation})`)
        break

      case 'hueRotate':
        const hue = params.hue || params.angle || 0
        filters.push(`hue-rotate(${hue}deg)`)
        break

      case 'invert':
        const invertAmount = params.intensity || 0
        if (invertAmount > 0) {
          filters.push(`invert(${invertAmount * 100}%)`)
        }
        break

      case 'vignette':
        // Виньетка применяется через box-shadow или отдельный элемент
        // Пока пропускаем, так как это сложнее реализовать через CSS
        break

      case 'colorGrading':
        // Цветокоррекция - комбинация фильтров
        const cgContrast = params.contrast || 1.0
        const cgSaturation = params.saturation || 1.0
        const cgBrightness = params.brightness || 0
        if (cgContrast !== 1.0) filters.push(`contrast(${cgContrast})`)
        if (cgSaturation !== 1.0) filters.push(`saturate(${cgSaturation})`)
        if (cgBrightness !== 0) filters.push(`brightness(${1 + cgBrightness})`)
        break

      // Для остальных эффектов пока просто логируем
      default:
        console.log(`ℹ️ fxToCss: Effect ${fxInstance.id} not yet implemented for CSS`)
    }
  }

  return filters.length > 0 ? filters.join(' ') : 'none'
}

/**
 * Применяет эффекты из fxStack к элементу через CSS
 * @param {HTMLElement} element - Элемент для применения эффектов
 * @param {Array} fxStack - Массив FxInstance
 */
export function applyFxStackToElement(element, fxStack) {
  if (!element) return
  
  const filterString = fxStackToCssFilter(fxStack)
  element.style.filter = filterString
  
  // Для виньетки добавляем отдельный overlay
  const hasVignette = fxStack?.some(fx => 
    fx.enabled && fx.id === 'vignette'
  )
  
  if (hasVignette) {
    // Создаем overlay для виньетки если его нет
    let vignetteOverlay = element.querySelector('.fx-vignette-overlay')
    if (!vignetteOverlay) {
      vignetteOverlay = document.createElement('div')
      vignetteOverlay.className = 'fx-vignette-overlay'
      vignetteOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        border-radius: inherit;
      `
      element.style.position = 'relative'
      element.appendChild(vignetteOverlay)
    }
    
    const vignetteFx = fxStack.find(fx => fx.id === 'vignette' && fx.enabled)
    if (vignetteFx) {
      const intensity = vignetteFx.params?.intensity || 0.5
      const size = vignetteFx.params?.size || 0.5
      vignetteOverlay.style.background = `radial-gradient(circle, transparent ${(1 - size) * 50}%, rgba(0, 0, 0, ${intensity}) 100%)`
      vignetteOverlay.style.display = 'block'
    } else {
      vignetteOverlay.style.display = 'none'
    }
  } else {
    // Удаляем overlay если виньетки нет
    const vignetteOverlay = element.querySelector('.fx-vignette-overlay')
    if (vignetteOverlay) {
      vignetteOverlay.remove()
    }
  }
}

