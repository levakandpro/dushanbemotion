// src/editorV2/utils/stickerLayers.js

export function createStickerLayer(imageUrl, fileName = 'sticker') {
  return {
    id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    type: 'sticker',
    imageUrl,
    fileName,
    
    x: 50, // процент от ширины канваса
    y: 50, // процент от высоты канваса
    width: 200, // px
    height: 200, // px
    
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    zIndex: 100,
    
    visible: true,
    locked: false,
    
    // Анимации (на будущее)
    animIn: 'none',
    animOut: 'none',
    animLoop: 'none',
  }
}


