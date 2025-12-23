// src/editorV2/fx/fxRegistry.ts

/**
 * Реестр эффектов FX для всех типов слоев
 */

export type FxCategory = 
  | 'popular' 
  | 'premium' 
  | 'cinematic' 
  | 'color' 
  | 'retro' 
  | 'neon' 
  | 'blur' 
  | 'lens'

export type LayerType = 'video' | 'image' | 'background' | 'sticker' | 'text' | 'icon'

export interface FxParam {
  id: string
  label: string
  type: 'float' | 'int' | 'bool'
  min?: number
  max?: number
  default: number | boolean
  step?: number
}

export interface FxDefinition {
  id: string
  label: string
  category: FxCategory
  supports: LayerType[]
  params: FxParam[]
  isPremium?: boolean
  previewImage?: string // Путь к изображению-превью
}

export const FX_CATEGORIES: Record<FxCategory, string> = {
  popular: 'D FX',
  premium: 'PREMIUM',
  cinematic: 'КИНО',
  color: 'ЦВЕТ',
  retro: 'РЕТРО',
  neon: 'ГЛИТЧ',
  blur: 'РАЗМЫТИЕ',
  lens: 'ОБЪЕКТИВ'
}

/**
 * Реестр всех эффектов
 */
export const FX_REGISTRY: FxDefinition[] = [
  // === POPULAR ===
  {
    id: 'mysticPamirGlow',
    label: 'Мистический Памир',
    category: 'popular',
    supports: ['video', 'image', 'background', 'sticker', 'text', 'icon'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 },
      { id: 'glowColor', label: 'Цвет свечения', type: 'float', min: 0, max: 360, default: 200 }
    ]
  },
  {
    id: 'persianGoldShine',
    label: 'Персидское золото',
    category: 'popular',
    supports: ['video', 'image', 'background', 'sticker', 'text', 'icon'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.6, step: 0.1 }
    ]
  },
  {
    id: 'cinematicBloom',
    label: 'Кинематографическое свечение',
    category: 'popular',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 2, default: 1.0, step: 0.1 },
      { id: 'threshold', label: 'Порог', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 }
    ]
  },

  // === CINEMATIC ===
  {
    id: 'filmGrain',
    label: 'Зерно плёнки',
    category: 'cinematic',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'amount', label: 'Количество', type: 'float', min: 0, max: 1, default: 0.3, step: 0.1 },
      { id: 'size', label: 'Размер', type: 'float', min: 0.5, max: 3, default: 1.0, step: 0.1 }
    ]
  },
  {
    id: 'vhsDistortion',
    label: 'VHS искажение',
    category: 'cinematic',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 },
      { id: 'noise', label: 'Шум', type: 'float', min: 0, max: 1, default: 0.3, step: 0.1 }
    ]
  },
  {
    id: 'colorGrading',
    label: 'Цветокоррекция',
    category: 'cinematic',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'contrast', label: 'Контраст', type: 'float', min: 0, max: 2, default: 1.0, step: 0.1 },
      { id: 'saturation', label: 'Насыщенность', type: 'float', min: 0, max: 2, default: 1.0, step: 0.1 },
      { id: 'brightness', label: 'Яркость', type: 'float', min: -1, max: 1, default: 0, step: 0.1 }
    ]
  },

  // === COLOR ===
  {
    id: 'vintage',
    label: 'Винтаж',
    category: 'color',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.7, step: 0.1 }
    ],
    previewImage: '/src/assets/vit.jpg'
  },
  {
    id: 'sepia',
    label: 'Сепия',
    category: 'color',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.8, step: 0.1 }
    ],
    previewImage: '/src/assets/sep.jpg'
  },
  {
    id: 'blackWhite',
    label: 'Черно-белое',
    category: 'color',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 1.0, step: 0.1 }
    ],
    previewImage: '/src/assets/cb.jpg'
  },

  // === RETRO ===
  {
    id: 'retro80s',
    label: '80-е',
    category: 'retro',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.6, step: 0.1 }
    ]
  },
  {
    id: 'polaroid',
    label: 'Полароид',
    category: 'retro',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'vignette', label: 'Виньетка', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 }
    ]
  },

  // === NEON ===
  {
    id: 'neonGlow',
    label: 'НЕОН',
    category: 'neon',
    supports: ['video', 'image', 'background', 'sticker', 'text', 'icon'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 2, default: 1.0, step: 0.1 },
      { id: 'color', label: 'Цвет', type: 'float', min: 0, max: 360, default: 180 }
    ],
    previewImage: '/src/assets/neon.jpg'
  },
  {
    id: 'glitch',
    label: 'ГЛИЧ',
    category: 'neon',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 },
      { id: 'speed', label: 'Скорость', type: 'float', min: 0, max: 10, default: 1.0, step: 0.5 }
    ],
    previewImage: '/src/assets/glich.jpg'
  },
  {
    id: 'chromaticAberration',
    label: 'ХРОМ',
    category: 'neon',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'amount', label: 'Сила', type: 'float', min: 0, max: 0.1, default: 0.02, step: 0.01 }
    ],
    previewImage: '/src/assets/hrom.jpg'
  },

  // === BLUR ===
  {
    id: 'gaussianBlur',
    label: 'Размытие по Гауссу',
    category: 'blur',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'radius', label: 'Радиус', type: 'float', min: 0, max: 20, default: 5, step: 0.5 }
    ],
    previewImage: '/src/assets/fx1.jpg'
  },
  {
    id: 'motionBlur',
    label: 'Размытие движения',
    category: 'blur',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'angle', label: 'Угол', type: 'float', min: 0, max: 360, default: 0, step: 1 },
      { id: 'distance', label: 'Расстояние', type: 'float', min: 0, max: 50, default: 10, step: 1 }
    ],
    previewImage: '/src/assets/fx2.jpg'
  },
  {
    id: 'tiltShift',
    label: 'Tilt-Shift',
    category: 'blur',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'focus', label: 'Фокус', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 },
      { id: 'blurAmount', label: 'Размытие', type: 'float', min: 0, max: 20, default: 10, step: 1 }
    ],
    previewImage: '/src/assets/fx3.jpg'
  },

  // === LENS ===
  {
    id: 'vignette',
    label: 'Виньетка',
    category: 'lens',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'intensity', label: 'Интенсивность', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 },
      { id: 'size', label: 'Размер', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 }
    ]
  },
  {
    id: 'lensDistortion',
    label: 'Искажение объектива',
    category: 'lens',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'amount', label: 'Сила', type: 'float', min: -1, max: 1, default: 0, step: 0.1 }
    ]
  },
  {
    id: 'fisheye',
    label: 'Рыбий глаз',
    category: 'lens',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [
      { id: 'amount', label: 'Сила', type: 'float', min: 0, max: 1, default: 0.5, step: 0.1 }
    ]
  },

  // === PREMIUM (заглушки) ===
  {
    id: 'premium1',
    label: 'Premium эффект 1',
    category: 'premium',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [],
    isPremium: true
  },
  {
    id: 'premium2',
    label: 'Premium эффект 2',
    category: 'premium',
    supports: ['video', 'image', 'background', 'sticker'],
    params: [],
    isPremium: true
  }
]

/**
 * Получить эффект по ID
 */
export function getFxById(id: string): FxDefinition | undefined {
  return FX_REGISTRY.find(fx => fx.id === id)
}

/**
 * Получить эффекты по категории
 */
export function getFxByCategory(category: FxCategory): FxDefinition[] {
  return FX_REGISTRY.filter(fx => fx.category === category)
}

/**
 * Получить эффекты, поддерживающие тип слоя
 */
export function getFxByLayerType(layerType: LayerType): FxDefinition[] {
  return FX_REGISTRY.filter(fx => fx.supports.includes(layerType))
}

/**
 * Получить все категории
 */
export function getAllCategories(): FxCategory[] {
  return Object.keys(FX_CATEGORIES) as FxCategory[]
}

