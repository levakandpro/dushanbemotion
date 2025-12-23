// Дефолтные значения для всех параметров текста
import { DEFAULT_TEXT_COLOR } from './textLayers'
import { getDefaultFont } from '../fonts/fontRegistry'

const defaultFont = getDefaultFont()

export const TEXT_DEFAULTS = {
  // Цвет
  fill: DEFAULT_TEXT_COLOR,
  color: DEFAULT_TEXT_COLOR,
  
  // Шрифт
  fontId: defaultFont?.id || null,
  fontFamily: defaultFont?.family || 'system-ui',
  fontSize: 72, // Большой размер по умолчанию
  fontWeight: 700,
  fontStyle: 'normal',
  
  // Типографика
  lineHeight: 1.2,
  letterSpacing: 0,
  textAlign: 'center',
  allCaps: false,
  capsMode: 'none',
  mono: false,
  smallCaps: false,
  
  // Трансформ
  x: 50,
  y: 50,
  rotation: 0,
  flipX: false,
  flipY: false,
  zIndex: 50,
  
  // Контейнер
  container: {
    type: 'none',
    color: '#000000',
    alpha: 0.5,
    padding: 16,
    autoWidth: true
  },
  
  // Маска
  mask: {
    enabled: false,
    source: 'none',
    type: null,
    src: null,
    imageUrl: null,
    scale: 1,
    gradientId: null
  },
  
  // FX
  fx: {
    shadow: {
      enabled: false,
      offsetX: 0,
      offsetY: 0,
      blur: 0,
      opacity: 0,
      color: '#000000'
    }
  },
  
  // Деформация
  warpMode: 'none',
  warpAmount: 0
}

// Функция для сравнения значений (глубокая проверка объектов)
export function isValueDefault(value, defaultValue) {
  // Строгое сравнение для примитивов
  if (value === defaultValue) return true
  
  // undefined и null считаются равными только если defaultValue тоже undefined/null/false/0/''/'none'
  if (value === undefined || value === null) {
    if (defaultValue === undefined || defaultValue === null) return true
    if (defaultValue === false) return true
    if (defaultValue === 0) return true
    if (defaultValue === '') return true
    if (defaultValue === 'none') return true
    return false
  }
  
  // Для объектов - сравниваем по ключам
  if (typeof value === 'object' && typeof defaultValue === 'object' && value !== null && defaultValue !== null && !Array.isArray(value) && !Array.isArray(defaultValue)) {
    const keys = new Set([...Object.keys(value), ...Object.keys(defaultValue)])
    for (const key of keys) {
      if (!isValueDefault(value[key], defaultValue[key])) {
        return false
      }
    }
    return true
  }
  
  // Для массивов
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    if (value.length !== defaultValue.length) return false
    return value.every((item, idx) => isValueDefault(item, defaultValue[idx]))
  }
  
  return false
}

// Получить дефолтное значение для конкретного поля
export function getDefaultValue(fieldPath) {
  const parts = fieldPath.split('.')
  let value = TEXT_DEFAULTS
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part]
    } else {
      return undefined
    }
  }
  
  return value
}

// Проверить, отличается ли значение от дефолтного
export function isFieldChanged(layer, fieldPath) {
  const defaultValue = getDefaultValue(fieldPath)
  if (defaultValue === undefined) return false
  
  const parts = fieldPath.split('.')
  let currentValue = layer
  let found = true
  
  for (const part of parts) {
    if (currentValue && typeof currentValue === 'object' && part in currentValue) {
      currentValue = currentValue[part]
    } else {
      // Если поля нет, считаем что значение дефолтное (если дефолт не undefined)
      found = false
      break
    }
  }
  
  // Если поле не найдено, проверяем через isValueDefault (который обрабатывает undefined/null)
  if (!found) {
    const isDefault = isValueDefault(undefined, defaultValue)
    return !isDefault
  }
  
  // Сравниваем текущее значение с дефолтным
  return !isValueDefault(currentValue, defaultValue)
}

