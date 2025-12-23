// src/editorV2/fx/fxTypes.ts

/**
 * Типы для системы FX
 */

import { FxDefinition } from './fxRegistry'

/**
 * Экземпляр эффекта на слое
 */
export interface FxInstance {
  id: string // ID из fxRegistry
  enabled: boolean
  params: Record<string, number | boolean> // Параметры эффекта
}

/**
 * Стек эффектов слоя
 */
export type FxStack = FxInstance[]

/**
 * Создает экземпляр эффекта с дефолтными параметрами
 */
export function createFxInstance(fxDef: FxDefinition): FxInstance {
  const params: Record<string, number | boolean> = {}
  
  // Инициализируем параметры значениями по умолчанию
  for (const param of fxDef.params) {
    params[param.id] = param.default
  }
  
  return {
    id: fxDef.id,
    enabled: true,
    params
  }
}

/**
 * Обновляет параметры экземпляра эффекта
 */
export function updateFxInstance(
  instance: FxInstance,
  updates: Partial<Pick<FxInstance, 'enabled' | 'params'>>
): FxInstance {
  return {
    ...instance,
    ...updates,
    params: {
      ...instance.params,
      ...(updates.params || {})
    }
  }
}

/**
 * Проверяет, есть ли эффект в стеке
 */
export function hasFxInStack(fxStack: FxStack, fxId: string): boolean {
  return fxStack.some(fx => fx.id === fxId)
}

/**
 * Получает экземпляр эффекта из стека
 */
export function getFxFromStack(fxStack: FxStack, fxId: string): FxInstance | undefined {
  return fxStack.find(fx => fx.id === fxId)
}

/**
 * Добавляет эффект в стек (или обновляет, если уже есть)
 */
export function addFxToStack(fxStack: FxStack, fxInstance: FxInstance): FxStack {
  const existingIndex = fxStack.findIndex(fx => fx.id === fxInstance.id)
  
  if (existingIndex >= 0) {
    // Обновляем существующий
    const updated = [...fxStack]
    updated[existingIndex] = fxInstance
    return updated
  } else {
    // Добавляем новый
    return [...fxStack, fxInstance]
  }
}

/**
 * Удаляет эффект из стека
 */
export function removeFxFromStack(fxStack: FxStack, fxId: string): FxStack {
  return fxStack.filter(fx => fx.id !== fxId)
}

/**
 * Очищает весь стек эффектов
 */
export function clearFxStack(): FxStack {
  return []
}

