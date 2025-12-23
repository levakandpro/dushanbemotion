// src/editorV2/luts/lutTypes.ts

/**
 * Типы для системы LUT (Look-Up Tables)
 */

export interface LutCurves {
  shadows: number // -100 до +100
  mids: number // -100 до +100
  highs: number // -100 до +100
}

export interface LutHsl {
  h: number // hue shift: -180 до +180
  s: number // saturation: -100 до +100
  l: number // luminance: -100 до +100
}

export interface LutHslZones {
  red?: LutHsl
  green?: LutHsl
  blue?: LutHsl
  yellow?: LutHsl
  magenta?: LutHsl
  cyan?: LutHsl
}

export interface LutBalance {
  temp: number // temperature: -100 до +100
  tint: number // tint: -100 до +100
}

export interface LutFilm {
  fade: number // 0 до 1
  grain: number // 0 до 1
  bloom: number // 0 до 1
}

export interface LutGrade {
  curves: LutCurves
  hsl: LutHslZones
  contrast: number // -1 до +1
  gamma: number // 0.5 до 2.0
  balance: LutBalance
  film: LutFilm
  clarity?: number // -1 до +1 (опционально)
}

export interface LutDefinition {
  id: string
  label: string
  category: LutCategory
  grade: LutGrade
  isPremium: boolean
  previewImage?: string
}

export enum LutCategory {
  DMOTION_CINEMATIC = 'dmotion_cinematic',
  ISLAM_PERSIAN = 'islam_persian',
  PAMIR_NATURE = 'pamir_nature',
  KITCHEN_FOOD = 'kitchen_food',
  BOOKS_WISDOM = 'books_wisdom',
  UFC_FIGHT = 'ufc_fight',
  RAP_MUSIC = 'rap_music',
  BEAUTY = 'beauty',
  HERITAGE = 'heritage'
}

export const LUT_CATEGORIES: Record<LutCategory, string> = {
  [LutCategory.DMOTION_CINEMATIC]: 'DMOTION CINEMATIC',
  [LutCategory.ISLAM_PERSIAN]: 'ISLAM / PERSIAN',
  [LutCategory.PAMIR_NATURE]: 'PAMIR NATURE',
  [LutCategory.KITCHEN_FOOD]: 'KITCHEN / FOOD',
  [LutCategory.BOOKS_WISDOM]: 'BOOKS / WISDOM',
  [LutCategory.UFC_FIGHT]: 'UFC / FIGHT',
  [LutCategory.RAP_MUSIC]: 'RAP / MUSIC',
  [LutCategory.BEAUTY]: 'BEAUTY',
  [LutCategory.HERITAGE]: 'HERITAGE'
}

export type LutInstance = {
  id: string
  enabled: boolean
  intensity?: number // 0 до 1, по умолчанию 1
}

export type LutStack = LutInstance[]

