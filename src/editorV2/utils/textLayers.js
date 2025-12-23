// src/editorV2/utils/textLayers.js
import { getDefaultFont } from '../fonts/fontRegistry'

// Единый цвет текста по умолчанию
export const DEFAULT_TEXT_COLOR = '#0d7533'

export function createTextLayer(content = 'ТЕКСТ', backgroundType = null) {
  const font = getDefaultFont()
  
  // На мобильных меньший размер шрифта
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const defaultFontSize = isMobile ? 36 : 72

  return {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2),

    content,
    fontId: font.id,
    fontSize: defaultFontSize, // Меньше на мобильных
    fontWeight: 700,
    fontStyle: 'normal',
    textAlign: 'center',
    color: DEFAULT_TEXT_COLOR,
    fill: DEFAULT_TEXT_COLOR,
    lineHeight: 1.2,
    letterSpacing: 0,
    allCaps: false,

    outlineEnabled: false,
    outlines: [],

    shadowEnabled: false,
    shadow: {
      x: 0,
      y: 0,
      blur: 0,
      opacity: 0,
      color: '#000000'
    },

    glowEnabled: false,
    glow: null,

    maskEnabled: false,
    maskSource: 'none',
    gradientMode: 'none',
    gradientId: null,

    x: 50, // По центру по горизонтали
    y: 50, // По центру по вертикали
    rotation: 0,
    flipX: false,
    flipY: false,
    zIndex: 50,

    visible: true,
    locked: false,

    warpMode: 'none',
    warpAmount: 0,

    animIn: 'none',
    animOut: 'none',
    animLoop: 'none',
    animMode: 'block',

    containerType: 'none',
    containerColor: '#000000',
    containerAlpha: 0,
    containerPadding: 0,

    // Поддержка текстовых шаблонов
    textStyleId: null,
    textStyleEnabled: false,
    overrideColor: false,
  }
}

export const createNewTextLayer = createTextLayer;
