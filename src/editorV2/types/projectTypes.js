// src/editorV2/types/projectTypes.js

/**
 * Типы соотношения сторон проекта
 * @typedef {'16:9' | '4:3' | '3:4'} AspectRatio
 */

/**
 * Конфигурация фона проекта
 * @typedef {Object} BackgroundConfig
 * @property {string} type - Тип фона: 'transparent' | 'white' | 'black' | 'color' | 'gradient' | 'image'
 * @property {string} [value] - Значение (цвет, градиент, URL изображения)
 * @property {number} [alpha] - Прозрачность (0-1)
 * @property {string} [checkerboardIntensity] - Интенсивность шахматного паттерна для прозрачного фона
 */

/**
 * Экземпляр эффекта на слое
 * @typedef {Object} FxInstance
 * @property {string} id - ID эффекта из fxRegistry
 * @property {boolean} enabled - Включен ли эффект
 * @property {Object<string, number|boolean>} params - Параметры эффекта
 */

/**
 * Базовый слой проекта
 * @typedef {Object} Layer
 * @property {string} id - Уникальный идентификатор слоя
 * @property {string} type - Тип слоя: 'text' | 'sticker' | 'icon' | 'video' | 'frame'
 * @property {number} zIndex - Порядок отображения
 * @property {boolean} visible - Видимость слоя
 * @property {boolean} locked - Заблокирован ли слой
 * @property {FxInstance[]} [fxStack] - Стек эффектов FX для слоя
 * @property {Array} [lutStack] - Стек LUT для слоя
 */

/**
 * Состояние таймлайна
 * @typedef {Object} TimelineState
 * @property {Array} clips - Массив аудио-клипов
 * @property {number} projectDuration - Длительность проекта в секундах
 * @property {number} minDuration - Минимальная длительность
 * @property {number} animationMaxDuration - Максимальная длительность анимации
 * @property {number} currentTime - Текущее время воспроизведения
 * @property {boolean} isPlaying - Играет ли таймлайн
 * @property {boolean} isTimelineExpanded - Развернут ли таймлайн
 * @property {number} pixelsPerSecond - Масштаб таймлайна
 * @property {string|null} selectedClipId - ID выбранного клипа
 */

/**
 * Основной интерфейс проекта редактора
 * @typedef {Object} EditorProject
 * @property {string} projectId - Уникальный идентификатор проекта
 * @property {string} name - Название проекта
 * @property {number} createdAt - Время создания (timestamp)
 * @property {number} updatedAt - Время последнего обновления (timestamp)
 * @property {AspectRatio} aspectRatio - Соотношение сторон
 * @property {number} durationMs - Длительность проекта в миллисекундах
 * @property {Layer[]} layers - Массив всех слоев проекта
 * @property {TimelineState} timeline - Состояние таймлайна
 * @property {BackgroundConfig} background - Конфигурация фона
 * 
 * // Текстовые слои
 * @property {Array} textLayers - Текстовые слои
 * @property {string|null} selectedTextId - ID выбранного текстового слоя
 * @property {Array} textClips - Клипы текста на таймлайне
 * @property {string|null} selectedTextClipId - ID выбранного текстового клипа
 * @property {Array} selectedTextClipIds - Массив ID выбранных текстовых клипов
 * @property {Array} favoriteFonts - Избранные шрифты
 * 
 * // Стикеры
 * @property {Array} stickerLayers - Слои стикеров
 * @property {string|null} selectedStickerId - ID выбранного стикера
 * @property {Array} stickerClips - Клипы стикеров на таймлайне
 * @property {string|null} selectedStickerClipId - ID выбранного клипа стикера
 * @property {Object} stickerTrackStates - Состояния дорожек стикеров
 * 
 * // Иконки
 * @property {Array} iconLayers - Слои иконок
 * @property {string|null} selectedIconId - ID выбранной иконки
 * 
 * // Видео/Футажи
 * @property {Array} videoLayers - Слои видео
 * @property {string|null} selectedVideoId - ID выбранного видео
 * @property {Array} videoClips - Клипы видео на таймлайне
 * @property {string|null} selectedVideoClipId - ID выбранного клипа видео
 * 
 * // Рамки
 * @property {Array} frameLayers - Слои рамок
 * @property {string|null} selectedFrameId - ID выбранной рамки
 * @property {Array} frameClips - Клипы рамок на таймлайне
 * @property {string|null} selectedFrameClipId - ID выбранного клипа рамки
 */

/**
 * Создает пустой проект с базовыми значениями
 * @param {Object} options
 * @param {string} options.backgroundType - Тип фона
 * @param {AspectRatio} options.aspectRatio - Соотношение сторон
 * @param {string} [options.name] - Название проекта
 * @returns {EditorProject}
 */
export function createEmptyProject({ backgroundType, aspectRatio, name = 'Новый проект' }) {
  const now = Date.now()
  
  return {
    projectId: `project_${now}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: now,
    updatedAt: now,
    aspectRatio: aspectRatio || '16:9',
    durationMs: 30000, // 30 секунд по умолчанию
    
    // Фон (новый формат) - по умолчанию белый
    background: {
      type: backgroundType || 'white',
      value: backgroundType && backgroundType !== 'transparent' ? backgroundType : 'white',
      alpha: 1,
      checkerboardIntensity: 'light'
    },
    
    // Обратная совместимость: старые поля для существующего кода
    backgroundType: backgroundType || 'white',
    checkerboardIntensity: 'light',
    backgroundAlpha: 1,
    
    // Слои (общий массив для всех типов)
    layers: [],
    
    // Текстовые слои
    textLayers: [],
    selectedTextId: null,
    textClips: [],
    selectedTextClipId: null,
    selectedTextClipIds: [],
    favoriteFonts: [],
    
    // Стикеры
    stickerLayers: [],
    selectedStickerId: null,
    stickerClips: [],
    selectedStickerClipId: null,
    stickerTrackStates: {},
    
    // Иконки
    iconLayers: [],
    selectedIconId: null,
    
    // Видео/Футажи
    videoLayers: [],
    selectedVideoId: null,
    videoClips: [],
    selectedVideoClipId: null,
    
    // Рамки
    frameLayers: [],
    selectedFrameId: null,
    frameClips: [],
    selectedFrameClipId: null,
    
    // Таймлайн (будет инициализирован отдельно)
    timeline: null // Будет установлен при создании
  }
}

/**
 * Helper: получает backgroundType из проекта (для обратной совместимости)
 * @param {EditorProject} project
 * @returns {string}
 */
export function getBackgroundType(project) {
  if (!project) return 'transparent'
  
  // Новый формат
  if (project.background && project.background.type) {
    return project.background.type === 'color' && project.background.value
      ? project.background.value
      : project.background.type === 'gradient' && project.background.value
      ? project.background.value
      : project.background.type === 'image' && project.background.value
      ? `url(${project.background.value})`
      : project.background.type
  }
  
  // Старый формат (обратная совместимость)
  return project.backgroundType || 'transparent'
}

/**
 * Helper: обновляет backgroundType в проекте (синхронизирует оба формата)
 * @param {EditorProject} project
 * @param {string} backgroundType
 * @returns {EditorProject}
 */
export function updateBackgroundType(project, backgroundType) {
  if (!project) return project
  
  return {
    ...project,
    backgroundType, // Старый формат
    background: {
      ...project.background,
      type: backgroundType === 'transparent' || backgroundType === 'white' || backgroundType === 'black'
        ? backgroundType
        : backgroundType?.startsWith('#')
        ? 'color'
        : backgroundType?.includes('gradient')
        ? 'gradient'
        : backgroundType?.startsWith('url(')
        ? 'image'
        : 'transparent',
      value: backgroundType === 'transparent' || backgroundType === 'white' || backgroundType === 'black'
        ? undefined
        : backgroundType
    }
  }
}

