// src/editorV2/luts/lutRegistry.ts

import { LutDefinition, LutCategory, LUT_CATEGORIES } from './lutTypes'

/**
 * Реестр всех LUT (Look-Up Tables)
 * Каждый LUT состоит из 5 групп параметров:
 * 1. Тон-кривая (Curves)
 * 2. HSL-коррекция (Hue/Sat/Luma) каждой главной зоны
 * 3. Контраст + Gamma
 * 4. Color Grade Highlights / Midtones / Shadows
 * 5. Доп. кинематографические штрихи
 */

// Вспомогательная функция для генерации детерминированных значений в диапазоне
// Используем seed для предсказуемости
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const randomRange = (min: number, max: number, seed: number) => {
  const value = min + seededRandom(seed) * (max - min)
  return Math.round(value * 100) / 100
}

// Вспомогательная функция для генерации LUT
const createLut = (
  id: string,
  label: string,
  category: LutCategory,
  grade: any
): LutDefinition => ({
  id,
  label,
  category,
  grade,
  isPremium: false // Все LUT бесплатные
})

// 1. DMOTION FLAG CINEMATIC - 15 LUT
const createDmotionLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 1
  const redSat = randomRange(20, 40, seed)
  const greenSat = randomRange(10, 25, seed + 1)
  const contrast = randomRange(0.15, 0.25, seed + 2)
  const fade = randomRange(0.03, 0.07, seed + 3)
  const bloom = randomRange(0.02, 0.05, seed + 4)
  
  return createLut(
    `dmotion_cinematic_${index}`,
    `DMOTION Cinematic ${index}`,
    LutCategory.DMOTION_CINEMATIC,
    {
      curves: {
        shadows: randomRange(-10, 10, seed + 5),
        mids: randomRange(-5, 15, seed + 6),
        highs: randomRange(-5, 5, seed + 7)
      },
      hsl: {
        red: { h: 0, s: redSat, l: randomRange(-5, 5, seed + 8) },
        green: { h: 0, s: greenSat, l: randomRange(-5, 5, seed + 9) },
        blue: { h: randomRange(-5, 0, seed + 10), s: randomRange(5, 15, seed + 11), l: 0 }
      },
      contrast,
      gamma: randomRange(0.95, 1.05, seed + 12),
      balance: {
        temp: -5, // холодные хайлайты
        tint: 5 // теплые тени
      },
      film: {
        fade,
        grain: randomRange(0, 0.02, seed + 13),
        bloom
      }
    }
  )
}

// 2. ISLAM / PERSIAN PREMIUM - 15 LUT
const createIslamPersianLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 2000
  const fade = randomRange(0.05, 0.12, seed)
  
  return createLut(
    `islam_persian_${index}`,
    `Persian Gold ${index}`,
    LutCategory.ISLAM_PERSIAN,
    {
      curves: {
        shadows: randomRange(-15, -5, seed + 1),
        mids: randomRange(5, 15, seed + 2),
        highs: randomRange(10, 20, seed + 3)
      },
      hsl: {
        green: { h: 5, s: 20, l: randomRange(-10, 0, seed + 4) },
        yellow: { h: 10, s: randomRange(15, 25, seed + 5), l: randomRange(0, 10, seed + 6) },
        blue: { h: randomRange(-10, -5, seed + 7), s: randomRange(10, 20, seed + 8), l: 0 }
      },
      contrast: 0.12,
      gamma: randomRange(0.98, 1.02, seed + 9),
      balance: {
        temp: 10, // теплые хайлайты
        tint: -10 // холодные тени
      },
      film: {
        fade,
        grain: randomRange(0.01, 0.03, seed + 10),
        bloom: randomRange(0.01, 0.03, seed + 11)
      }
    }
  )
}

// 3. PAMIR NATURE - 15 LUT
const createPamirNatureLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 3000
  const blueSat = randomRange(15, 30, seed)
  const grain = randomRange(0.02, 0.06, seed + 1)
  const fade = randomRange(0.02, 0.05, seed + 2)
  
  return createLut(
    `pamir_nature_${index}`,
    `Pamir Nature ${index}`,
    LutCategory.PAMIR_NATURE,
    {
      curves: {
        shadows: randomRange(-20, -10, seed + 3),
        mids: randomRange(0, 10, seed + 4),
        highs: randomRange(0, 5, seed + 5)
      },
      hsl: {
        blue: { h: -5, s: blueSat, l: randomRange(0, 10, seed + 6) },
        green: { h: 0, s: randomRange(10, 20, seed + 7), l: -10 },
        cyan: { h: randomRange(-5, 0, seed + 8), s: randomRange(10, 20, seed + 9), l: 0 }
      },
      contrast: 0.18,
      gamma: randomRange(0.96, 1.04, seed + 10),
      balance: {
        temp: 0, // нейтральные хайлайты
        tint: -10 // холодные тени
      },
      film: {
        fade,
        grain,
        bloom: randomRange(0, 0.02, seed + 11)
      }
    }
  )
}

// 4. KITCHEN / FOOD - 15 LUT
const createKitchenFoodLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 4000
  const redSat = randomRange(10, 25, seed)
  const yellowSat = randomRange(15, 30, seed + 1)
  
  return createLut(
    `kitchen_food_${index}`,
    `Food Appetizing ${index}`,
    LutCategory.KITCHEN_FOOD,
    {
      curves: {
        shadows: randomRange(-5, 5, seed + 2),
        mids: randomRange(5, 15, seed + 3),
        highs: randomRange(0, 10, seed + 4)
      },
      hsl: {
        red: { h: 0, s: redSat, l: randomRange(0, 10, seed + 5) },
        yellow: { h: 0, s: yellowSat, l: randomRange(5, 15, seed + 6) },
        green: { h: -5, s: randomRange(10, 20, seed + 7), l: randomRange(0, 10, seed + 8) }
      },
      contrast: 0.08,
      gamma: randomRange(1.0, 1.1, seed + 9),
      balance: {
        temp: randomRange(5, 10, seed + 10),
        tint: randomRange(0, 5, seed + 11)
      },
      film: {
        fade: randomRange(0, 0.02, seed + 12),
        grain: randomRange(0, 0.01, seed + 13),
        bloom: randomRange(0.01, 0.03, seed + 14)
      },
      clarity: 0.1
    }
  )
}

// 5. BOOKS / WISDOM - 15 LUT
const createBooksWisdomLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 5000
  const fade = randomRange(0.12, 0.25, seed)
  const desat = randomRange(-40, -20, seed + 1)
  
  return createLut(
    `books_wisdom_${index}`,
    `Vintage Wisdom ${index}`,
    LutCategory.BOOKS_WISDOM,
    {
      curves: {
        shadows: randomRange(-30, -15, seed + 2),
        mids: randomRange(-10, 0, seed + 3),
        highs: randomRange(15, 25, seed + 4)
      },
      hsl: {
        red: { h: randomRange(10, 20, seed + 5), s: desat, l: randomRange(-10, 0, seed + 6) },
        yellow: { h: randomRange(15, 25, seed + 7), s: desat, l: randomRange(0, 10, seed + 8) },
        green: { h: randomRange(5, 15, seed + 9), s: desat, l: randomRange(-5, 5, seed + 10) }
      },
      contrast: randomRange(-0.1, 0.1, seed + 11),
      gamma: randomRange(0.9, 1.0, seed + 12),
      balance: {
        temp: randomRange(10, 20, seed + 13),
        tint: 15 // теплые хайлайты
      },
      film: {
        fade,
        grain: 0.05,
        bloom: randomRange(0, 0.02, seed + 14)
      }
    }
  )
}

// 6. UFC / FIGHT - 15 LUT
const createUfcFightLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 6000
  const contrast = randomRange(0.25, 0.35, seed)
  
  return createLut(
    `ufc_fight_${index}`,
    `Fight Aggressive ${index}`,
    LutCategory.UFC_FIGHT,
    {
      curves: {
        shadows: randomRange(-40, -25, seed + 1),
        mids: randomRange(0, 10, seed + 2),
        highs: randomRange(5, 15, seed + 3)
      },
      hsl: {
        red: { h: 0, s: 20, l: randomRange(-5, 5, seed + 4) },
        blue: { h: -10, s: randomRange(15, 25, seed + 5), l: randomRange(-10, 0, seed + 6) },
        magenta: { h: randomRange(-5, 0, seed + 7), s: randomRange(10, 20, seed + 8), l: 0 }
      },
      contrast,
      gamma: randomRange(0.95, 1.05, seed + 9),
      balance: {
        temp: randomRange(5, 10, seed + 10), // чуть теплые хайлайты
        tint: randomRange(-5, 0, seed + 11)
      },
      film: {
        fade: 0,
        grain: 0.03,
        bloom: randomRange(0, 0.02, seed + 12)
      }
    }
  )
}

// 7. RAP / MUSIC - 15 LUT
const createRapMusicLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 7000
  const bloom = randomRange(0.04, 0.08, seed)
  
  return createLut(
    `rap_music_${index}`,
    `Neon City ${index}`,
    LutCategory.RAP_MUSIC,
    {
      curves: {
        shadows: randomRange(-30, -15, seed + 1),
        mids: randomRange(0, 10, seed + 2),
        highs: randomRange(0, 10, seed + 3)
      },
      hsl: {
        magenta: { h: 0, s: 20, l: randomRange(0, 10, seed + 4) },
        blue: { h: randomRange(-10, -5, seed + 5), s: 30, l: randomRange(0, 10, seed + 6) },
        green: { h: 0, s: 10, l: randomRange(-5, 5, seed + 7) },
        cyan: { h: randomRange(-5, 0, seed + 8), s: randomRange(15, 25, seed + 9), l: 0 }
      },
      contrast: randomRange(0.1, 0.2, seed + 10),
      gamma: randomRange(0.98, 1.02, seed + 11),
      balance: {
        temp: -10, // холодные хайлайты
        tint: randomRange(-5, 0, seed + 12)
      },
      film: {
        fade: randomRange(0, 0.03, seed + 13),
        grain: randomRange(0.01, 0.03, seed + 14),
        bloom
      }
    }
  )
}

// 8. BEAUTY - 15 LUT
const createBeautyLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 8000
  return createLut(
    `beauty_${index}`,
    `Beauty Glow ${index}`,
    LutCategory.BEAUTY,
    {
      curves: {
        shadows: randomRange(-10, 0, seed),
        mids: randomRange(5, 15, seed + 1),
        highs: randomRange(10, 20, seed + 2)
      },
      hsl: {
        red: { h: randomRange(0, 5, seed + 3), s: randomRange(5, 15, seed + 4), l: randomRange(0, 10, seed + 5) },
        yellow: { h: randomRange(5, 10, seed + 6), s: randomRange(10, 20, seed + 7), l: randomRange(5, 15, seed + 8) },
        magenta: { h: randomRange(-5, 0, seed + 9), s: randomRange(5, 15, seed + 10), l: randomRange(0, 10, seed + 11) }
      },
      contrast: randomRange(0.05, 0.15, seed + 12),
      gamma: randomRange(1.0, 1.1, seed + 13),
      balance: {
        temp: 5, // теплый тон кожи
        tint: 5 // розовые тени
      },
      film: {
        fade: 0.02,
        grain: randomRange(0, 0.01, seed + 14),
        bloom: 0.04
      },
      clarity: -0.05 // смягчение кожи
    }
  )
}

// 9. HERITAGE / НАСЛЕДИЕ - 15 LUT
const createHeritageLut = (index: number): LutDefinition => {
  const seed = index * 1000 + 9000
  const redSat = randomRange(15, 35, seed)
  const grain = randomRange(0.02, 0.04, seed + 1)
  
  return createLut(
    `heritage_${index}`,
    `Heritage Gold ${index}`,
    LutCategory.HERITAGE,
    {
      curves: {
        shadows: randomRange(-20, -10, seed + 2),
        mids: randomRange(5, 15, seed + 3),
        highs: randomRange(10, 20, seed + 4)
      },
      hsl: {
        red: { h: randomRange(0, 5, seed + 5), s: redSat, l: randomRange(-5, 5, seed + 6) },
        yellow: { h: 10, s: randomRange(15, 25, seed + 7), l: randomRange(5, 15, seed + 8) },
        green: { h: 0, s: 10, l: randomRange(-5, 5, seed + 9) }
      },
      contrast: 0.2,
      gamma: randomRange(0.98, 1.02, seed + 10),
      balance: {
        temp: randomRange(10, 15, seed + 11), // теплые хайлайты (золото)
        tint: randomRange(5, 10, seed + 12) // теплые тени
      },
      film: {
        fade: 0.05,
        grain,
        bloom: randomRange(0.01, 0.03, seed + 13)
      }
    }
  )
}

// Генерация всех LUT
export const LUT_REGISTRY: LutDefinition[] = [
  // DMOTION CINEMATIC - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createDmotionLut(i + 1)),
  
  // ISLAM / PERSIAN - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createIslamPersianLut(i + 1)),
  
  // PAMIR NATURE - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createPamirNatureLut(i + 1)),
  
  // KITCHEN / FOOD - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createKitchenFoodLut(i + 1)),
  
  // BOOKS / WISDOM - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createBooksWisdomLut(i + 1)),
  
  // UFC / FIGHT - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createUfcFightLut(i + 1)),
  
  // RAP / MUSIC - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createRapMusicLut(i + 1)),
  
  // BEAUTY - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createBeautyLut(i + 1)),
  
  // HERITAGE - 15 LUT
  ...Array.from({ length: 15 }, (_, i) => createHeritageLut(i + 1))
]

// Вспомогательные функции для работы с реестром
export const getAllLutCategories = (): LutCategory[] => {
  return Object.values(LutCategory)
}

export const getLutsByCategory = (category: LutCategory): LutDefinition[] => {
  return LUT_REGISTRY.filter(lut => lut.category === category)
}

export const getLutById = (id: string): LutDefinition | undefined => {
  return LUT_REGISTRY.find(lut => lut.id === id)
}

export { LUT_CATEGORIES }

