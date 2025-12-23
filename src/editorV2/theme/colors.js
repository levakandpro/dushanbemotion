export const DM_COLORS = {
  // Базовые цвета (стиль CapCut/тёмная тема)
  PRIMARY: '#00B4FF', // Яркий синий для акцентов/активных состояний
  SECONDARY: '#FF4D4D', // Красный для предупреждений
  BACKGROUND_DARK: '#121212', // Основной тёмный фон
  BACKGROUND_LIGHT: '#1E1E1E', // Чуть светлее для панелей
  TEXT_PRIMARY: '#FFFFFF', // Белый текст
  TEXT_SECONDARY: '#AAAAAA', // Серый текст для подсказок

  // Пресеты для мини-палитры
  PRESET_WHITE: '#FFFFFF',
  PRESET_BLACK: '#000000',
  PRESET_RED: '#FF4D4D',
  PRESET_YELLOW: '#FFD700',
  PRESET_GREEN: '#4CAF50',
  PRESET_BLUE: '#00B4FF',
  PRESET_PURPLE: '#9370DB',
};

export const DM_GRADIENTS = [
  { id: 'g1', name: 'Sunset', colors: ['#FF7E5F', '#FEB47B'] },
  { id: 'g2', name: 'Ocean', colors: ['#43C6AC', '#191654'] },
  { id: 'g3', name: 'Vaporwave', colors: ['#FC5C7D', '#6A82FB'] },
  { id: 'g4', name: 'Emerald', colors: ['#38ef7d', '#11998e'] },
];

// Экспорт для удобства использования в TextPanel
export const COLOR_PRESETS = [
  DM_COLORS.PRESET_WHITE,
  DM_COLORS.PRESET_BLACK,
  DM_COLORS.PRESET_RED,
  DM_COLORS.PRESET_YELLOW,
  DM_COLORS.PRESET_GREEN,
  DM_COLORS.PRESET_BLUE,
  DM_COLORS.PRESET_PURPLE,
];
