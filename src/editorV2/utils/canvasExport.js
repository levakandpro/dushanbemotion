// src/editorV2/utils/canvasExport.js
// Экспорт канваса через html2canvas

const R2_STICKERS = 'https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev'
const R2_PEOPLE = 'https://pub-b69ef7c5697c44e2ab311a83cae5c18a.r2.dev'

/**
 * Конвертирует R2 URL в прокси URL для обхода CORS
 */
function toProxyUrl(url) {
  if (url.startsWith(R2_STICKERS)) {
    return url.replace(R2_STICKERS, '/r2-proxy')
  }
  if (url.startsWith(R2_PEOPLE)) {
    return url.replace(R2_PEOPLE, '/r2-people')
  }
  return url
}

/**
 * Загружает изображение через прокси и возвращает base64
 */
async function fetchImageAsBase64(url) {
  try {
    const proxyUrl = toProxyUrl(url)
    const response = await fetch(proxyUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('Failed to fetch image:', url, e)
    return null
  }
}

/**
 * Экспортирует канвас в указанном формате
 */
// Helper function to wait for all images to load
function waitForImages(element) {
  const images = element.getElementsByTagName('img');
  const imagePromises = [];
  
  for (const img of images) {
    if (!img.complete) {
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Resolve even if image fails to load
      });
      imagePromises.push(promise);
    }
  }
  
  return Promise.all(imagePromises);
}

// Helper function to force repaint
export async function forceRepaint(element) {
  // Force reflow
  const dummy = element.offsetHeight;
  return new Promise(resolve => requestAnimationFrame(resolve));
}

export async function exportCanvas(format, filename = 'canvas') {
  // First wait a bit to ensure all React state updates are applied
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Try to find the canvas element with more specific selector
  let canvasElement = document.querySelector('.editor-v2-canvas-frame');
  
  if (!canvasElement) {
    // Try alternative selectors if the main one fails
    canvasElement = document.querySelector('.editor-v2-canvas') || 
                   document.querySelector('.canvas-container') ||
                   document.querySelector('canvas');
  }
  
  if (!canvasElement) {
    console.error('❌ Canvas element not found. Tried .editor-v2-canvas-frame, .editor-v2-canvas, .canvas-container, and canvas');
    return false;
  }

  // Проверяем что canvas видим
  const rect = canvasElement.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    console.error('❌ Canvas element has zero dimensions:', rect)
    return false
  }

  console.log('📸 Exporting canvas:', format, 'size:', rect.width, 'x', rect.height)

  // Временно убираем zoom
  const stageElement = document.querySelector('.editor-v2-canvas-stage')
  const originalStageTransform = stageElement?.style.transform || ''
  if (stageElement) {
    stageElement.style.transform = 'scale(1)'
  }

  // Скрываем UI элементы
  const elementsToHide = []
  
  // Убираем классы выделения
  canvasElement.querySelectorAll('.dm-layer-text-selected').forEach(el => {
    elementsToHide.push({ el, className: 'dm-layer-text-selected', hadClass: true })
    el.classList.remove('dm-layer-text-selected')
  })
  
  canvasElement.querySelectorAll('.sticker-layer-selected').forEach(el => {
    elementsToHide.push({ el, className: 'sticker-layer-selected', hadClass: true })
    el.classList.remove('sticker-layer-selected')
  })

  canvasElement.querySelectorAll('.video-layer-selected').forEach(el => {
    elementsToHide.push({ el, className: 'video-layer-selected', hadClass: true })
    el.classList.remove('video-layer-selected')
  })

  canvasElement.querySelectorAll('.icon-layer-selected').forEach(el => {
    elementsToHide.push({ el, className: 'icon-layer-selected', hadClass: true })
    el.classList.remove('icon-layer-selected')
  })

  canvasElement.querySelectorAll('.frame-layer-selected').forEach(el => {
    elementsToHide.push({ el, className: 'frame-layer-selected', hadClass: true })
    el.classList.remove('frame-layer-selected')
  })

  // Скрываем хэндлы и сетку
  const hideSelectors = ['.dm-text-handle', '.editor-v2-canvas-grid', '.sticker-handle']
  hideSelectors.forEach(sel => {
    canvasElement.querySelectorAll(sel).forEach(el => {
      elementsToHide.push({ el, visibility: el.style.visibility })
      el.style.visibility = 'hidden'
    })
  })

  // Убеждаемся, что все слои видимы (на случай если они были скрыты)
  const layersToShow = []
  const layerSelectors = ['.dm-layer-text', '.sticker-layer', '.video-layer', '.icon-layer', '.frame-layer']
  layerSelectors.forEach(sel => {
    canvasElement.querySelectorAll(sel).forEach(el => {
      const computedStyle = window.getComputedStyle(el)
      const currentDisplay = computedStyle.display
      const currentVisibility = computedStyle.visibility
      const currentOpacity = computedStyle.opacity
      
      // Если элемент скрыт, делаем его видимым временно
      if (currentDisplay === 'none' || currentVisibility === 'hidden' || currentOpacity === '0') {
        layersToShow.push({ 
          el, 
          display: el.style.display, 
          visibility: el.style.visibility,
          opacity: el.style.opacity 
        })
        if (currentDisplay === 'none') el.style.display = ''
        if (currentVisibility === 'hidden') el.style.visibility = 'visible'
        if (currentOpacity === '0') el.style.opacity = '1'
      }
    })
  })

  // Убираем ТОЛЬКО checkerboard паттерн (для прозрачного фона)
  // НЕ трогаем реальный цвет фона (белый, черный и т.д.)
  const checkerElements = []
  canvasElement.querySelectorAll('.editor-v2-bg-checker').forEach(el => {
    const style = window.getComputedStyle(el)
    // Убираем только если это checkerboard паттерн (градиент)
    if (style.backgroundImage && style.backgroundImage.includes('linear-gradient')) {
      checkerElements.push({ el, bgImg: el.style.backgroundImage })
      el.style.backgroundImage = 'none'
    }
  })

  // НЕ трогаем изображения - они уже загружены через CORS прокси и работают
  // html2canvas с useCORS: true справится сам
  console.log('📷 Images will be captured by html2canvas directly')

  // НЕ трогаем background-image - html2canvas справится сам с useCORS: true
  console.log('🖼️ Background images will be captured by html2canvas directly')

  // Проверяем видимость элементов перед экспортом
  const allLayers = canvasElement.querySelectorAll('.dm-layer-text, .sticker-layer, .video-layer, .icon-layer, .frame-layer')
  console.log('🔍 Found layers before export:', allLayers.length)
  allLayers.forEach((layer, idx) => {
    const computed = window.getComputedStyle(layer)
    const rect = layer.getBoundingClientRect()
    console.log(`Layer ${idx + 1}:`, {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0 && computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0'
    })
  })

  // Убеждаемся, что родительские контейнеры не скрывают содержимое
  const backdropElement = canvasElement.closest('.editor-v2-canvas-backdrop')
  const containersToFix = []
  
  // ВАЖНО: Временно меняем overflow на visible для всех контейнеров
  // чтобы html2canvas мог захватить всё содержимое
  const computedFrameStyle = window.getComputedStyle(canvasElement)
  if (computedFrameStyle.overflow === 'hidden') {
    containersToFix.push({ el: canvasElement, originalOverflow: canvasElement.style.overflow })
    canvasElement.style.overflow = 'visible'
  }
  
  if (backdropElement) {
    const computed = window.getComputedStyle(backdropElement)
    if (computed.overflow === 'hidden') {
      containersToFix.push({ el: backdropElement, originalOverflow: backdropElement.style.overflow })
      backdropElement.style.overflow = 'visible'
    }
  }
  
  // stageElement уже объявлен выше, используем его
  if (stageElement) {
    const computed = window.getComputedStyle(stageElement)
    if (computed.overflow === 'hidden') {
      containersToFix.push({ el: stageElement, originalOverflow: stageElement.style.overflow })
      stageElement.style.overflow = 'visible'
    }
  }

  // Даем браузеру время на отрисовку всех элементов
  await new Promise(r => setTimeout(r, 1000));
  
  // Принудительно показываем все элементы перед экспортом
  console.log('All elements in canvas:', {
    total: canvasElement.querySelectorAll('*').length,
    children: canvasElement.children.length
  });
  
  // Выводим в лог структуру DOM для отладки
  console.log('Canvas element structure:', canvasElement);
  
  // Показываем все дочерние элементы
  Array.from(canvasElement.children).forEach((child, i) => {
    console.log(`Child ${i}:`, {
      tag: child.tagName,
      class: child.className,
      id: child.id,
      children: child.children.length,
      display: window.getComputedStyle(child).display,
      visibility: window.getComputedStyle(child).visibility,
      opacity: window.getComputedStyle(child).opacity
    });
  });
  const allElements = canvasElement.querySelectorAll('*');
  const originalStyles = [];
  
  allElements.forEach(el => {
    // Сохраняем оригинальные стили
    const style = window.getComputedStyle(el);
    originalStyles.push({
      element: el,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity
    });
    
    // Принудительно показываем все элементы
    if (style.display === 'none') el.style.display = 'block';
    if (style.visibility === 'hidden') el.style.visibility = 'visible';
    if (style.opacity === '0') el.style.opacity = '1';
  });
  
  // Даем браузеру время на применение стилей
  await new Promise(r => requestAnimationFrame(r));

  try {
    let dataUrl
    let ext
        scale: 4,
        backgroundColor: null
      })
      ext = 'svg'
      console.log('✅ SVG export completed, size:', dataUrl.length)
    } else {
      // PNG/JPEG через html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      console.log('🖼️ Starting html2canvas export...')
      
      // Get the actual dimensions of the canvas content
      const canvasRect = canvasElement.getBoundingClientRect();
      const width = Math.ceil(canvasRect.width);
      const height = Math.ceil(canvasRect.height);
      
      console.log(`📏 Canvas dimensions: ${width}x${height}`);
      
      if (width === 0 || height === 0) {
        throw new Error('Canvas has zero dimensions');
      }
      
      // Конфигурация html2canvas с улучшенной обработкой изображений
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: format === 'jpeg' ? '#ffffff' : null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        imageTimeout: 30000, // Увеличиваем таймаут для загрузки изображений
        removeContainer: false,
        foreignObjectRendering: true,
        width: width,
        height: height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        // Улучшенная обработка изображений
        onclone: (clonedDoc) => {
          // Убедимся, что все изображения загружены
          const images = clonedDoc.images;
          for (let i = 0; i < images.length; i++) {
            if (!images[i].complete) {
              images[i].src = images[i].src; // Перезагружаем изображение
            }
          }
        },
        // Игнорируем только UI элементы, но НЕ слои
        ignoreElements: (element) => {
          return element.classList && (
            element.classList.contains('dm-text-handle') ||
            element.classList.contains('sticker-handle') ||
            element.classList.contains('editor-v2-canvas-grid')
          );
        }
      })

      console.log('✅ html2canvas completed, canvas size:', canvas.width, 'x', canvas.height)

      // Проверяем, не пустой ли холст
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let isEmpty = true;
      
      // Проверяем, есть ли на холсте непрозрачные пиксели
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i + 3] > 0) { // Проверяем альфа-канал
          isEmpty = false;
          break;
        }
      }
      
      if (isEmpty) {
        console.warn('⚠️ Внимание: экспортированный холст пуст!');
        // Пробуем альтернативный метод, если основной не сработал
        return await retryExport(canvasElement, format, filename);
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('html2canvas вернул пустой canvas')
      }

      dataUrl = format === 'jpeg' 
        ? canvas.toDataURL('image/jpeg', 0.95)
        : canvas.toDataURL('image/png')
      
      console.log('📊 Data URL size:', dataUrl.length, 'bytes')
      
      ext = format === 'jpeg' ? 'jpg' : 'png'
    }
    
    if (!dataUrl || dataUrl.length < 100) {
      console.error('❌ Export failed: invalid data URL')
      throw new Error('Не удалось создать изображение для экспорта')
    }
    
    downloadDataUrl(dataUrl, `${filename}.${ext}`)
    
    console.log('✅ Export successful')
    return true
    
  } catch (error) {
    console.error('❌ Export error:', error)
    console.error('❌ Export error stack:', error.stack)
    // Не показываем alert здесь, чтобы HeaderBar мог показать toast
    return false
  } finally {
    // Восстанавливаем checkerboard
    checkerElements.forEach(({ el, bgImg }) => {
      el.style.backgroundImage = bgImg
    })
    // Восстанавливаем оригинальные стили
    originalStyles.forEach(({ element, display, visibility, opacity }) => {
      if (display !== undefined) element.style.display = display;
      if (visibility !== undefined) element.style.visibility = visibility;
      if (opacity !== undefined) element.style.opacity = opacity;
    });
    elementsToHide.forEach(({ el, className, hadClass, visibility }) => {
      if (hadClass) el.classList.add(className)
      if (visibility !== undefined) el.style.visibility = visibility
    })
    // Восстанавливаем видимость слоев, которые были скрыты
    layersToShow.forEach(({ el, display, visibility, opacity }) => {
      if (display !== undefined) el.style.display = display
      if (visibility !== undefined) el.style.visibility = visibility
      if (opacity !== undefined) el.style.opacity = opacity
    })
    // Восстанавливаем overflow контейнеров
    containersToFix.forEach(({ el, originalOverflow }) => {
      el.style.overflow = originalOverflow || ''
    })
    if (stageElement) stageElement.style.transform = originalStageTransform
  }
}

/**
 * Скачивает data URL как файл
 */
function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
