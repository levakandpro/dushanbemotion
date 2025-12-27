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
export async function exportCanvas(format, filename = 'canvas') {
  const canvasElement = document.querySelector('.editor-v2-canvas-frame')
  
  if (!canvasElement) {
    console.error('❌ Canvas element not found (.editor-v2-canvas-frame)')
    return false
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

  // Сохраняем оригинальные src всех изображений ПЕРЕД любыми изменениями
  const imagesToRestore = []
  const images = canvasElement.querySelectorAll('img')
  
  console.log('📷 Found', images.length, 'img elements')
  
  // ВАЖНО: Сначала сохраняем ВСЕ оригинальные src, даже если не будем их менять
  images.forEach(img => {
    if (img.src) {
      imagesToRestore.push({ img, originalSrc: img.src })
    }
  })
  
  // Теперь конвертируем только те, которые нуждаются в конвертации (CORS проблемы)
  // НО: если изображение уже отображается на странице и загружено - не трогаем его!
  for (const img of images) {
    // Пропускаем уже base64/blob изображения
    if (!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) {
      continue
    }
    
    // Пропускаем если изображение уже загружено и видимо (работает через CORS прокси)
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      console.log('✓ img already loaded (skipping):', img.src.substring(0, 50))
      continue
    }
    
    // Только для проблемных изображений пытаемся конвертировать
    const originalSrc = img.src
    console.log('🔄 Converting img to base64:', originalSrc.substring(0, 50))
    const base64 = await fetchImageAsBase64(originalSrc)
    
    if (base64) {
      // Сохраняем в массиве (уже сохранено выше, но обновляем для ясности)
      const restoreEntry = imagesToRestore.find(r => r.img === img)
      if (restoreEntry) {
        img.src = base64
        // Ждем загрузки нового base64 изображения
        await new Promise(resolve => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
          } else {
            const timeout = setTimeout(() => {
              img.onload = null
              img.onerror = null
              console.warn('⚠️ Image load timeout, continuing...')
              resolve()
            }, 3000)
            img.onload = () => {
              clearTimeout(timeout)
              img.onerror = null
              resolve()
            }
            img.onerror = () => {
              clearTimeout(timeout)
              img.onload = null
              console.warn('⚠️ Image load error, restoring original src')
              // Если загрузка не удалась - сразу восстанавливаем оригинал
              img.src = originalSrc
              resolve()
            }
          }
        })
        console.log('✓ img converted:', originalSrc.substring(0, 50))
      }
    } else {
      console.warn('⚠️ Failed to convert img, keeping original:', originalSrc.substring(0, 50))
      // Оставляем оригинальный src, он уже сохранен в imagesToRestore
    }
  }

  // Конвертируем CSS background-image в base64 через прокси
  const bgToRestore = []
  const allElements = canvasElement.querySelectorAll('*')
  
  console.log('🖼️ Checking background-image styles...')
  
  for (const el of allElements) {
    const style = window.getComputedStyle(el)
    const bgImage = style.backgroundImage
    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
      const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/)
      if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
        const url = urlMatch[1]
        // Сохраняем оригинальный background-image ПЕРЕД изменением
        const originalBg = el.style.backgroundImage || bgImage
        bgToRestore.push({ el, originalBg })
        
        console.log('🔄 Converting bg to base64:', url.substring(0, 50))
        const base64 = await fetchImageAsBase64(url)
        if (base64) {
          el.style.backgroundImage = `url(${base64})`
          console.log('✓ bg converted:', url.substring(0, 50))
        } else {
          console.warn('⚠️ Failed to convert bg, keeping original:', url.substring(0, 50))
          // Оставляем оригинальный background-image
        }
      }
    }
  }

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

  // Дополнительная задержка для завершения всех загрузок изображений и применения стилей
  await new Promise(r => setTimeout(r, 500))

  try {
    let dataUrl
    let ext

    // Проверяем размеры canvas перед экспортом
    const canvasRect = canvasElement.getBoundingClientRect()
    console.log('📐 Canvas dimensions:', { width: canvasRect.width, height: canvasRect.height })
    
    // Проверяем что внутри canvas есть видимые элементы
    const visibleLayers = Array.from(canvasElement.querySelectorAll('.dm-layer-text, .sticker-layer, .video-layer, .icon-layer, .frame-layer')).filter(layer => {
      const rect = layer.getBoundingClientRect()
      const style = window.getComputedStyle(layer)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
    })
    console.log('👁️ Visible layers count:', visibleLayers.length, 'out of', allLayers.length)

    if (format === 'svg') {
      // SVG через modern-screenshot
      const { domToSvg } = await import('modern-screenshot')
      dataUrl = await domToSvg(canvasElement, {
        scale: 4,
        backgroundColor: null
      })
      ext = 'svg'
      console.log('✅ SVG export completed, size:', dataUrl.length)
    } else {
      // PNG/JPEG через html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      console.log('🖼️ Starting html2canvas export...')
      
      // Упрощенные настройки для надежного захвата
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: format === 'jpeg' ? '#ffffff' : null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        imageTimeout: 20000,
        ignoreElements: (element) => {
          // Игнорируем только UI элементы, но НЕ слои
          return element.classList.contains('dm-text-handle') || 
                 element.classList.contains('sticker-handle') ||
                 element.classList.contains('editor-v2-canvas-grid')
        }
      })

      console.log('✅ html2canvas completed, canvas size:', canvas.width, 'x', canvas.height)

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
    // Восстанавливаем img элементы (ВСЕГДА, даже если не меняли)
    imagesToRestore.forEach(({ img, originalSrc }) => {
      if (img && originalSrc && img.src !== originalSrc) {
        img.src = originalSrc
      }
    })
    // Восстанавливаем background-image
    bgToRestore.forEach(({ el, originalBg }) => {
      el.style.backgroundImage = originalBg
    })
    // Восстанавливаем checkerboard
    checkerElements.forEach(({ el, bgImg }) => {
      el.style.backgroundImage = bgImg
    })
    elementsToHide.forEach(({ el, visibility, className, hadClass }) => {
      if (hadClass) el.classList.add(className)
      else el.style.visibility = visibility !== undefined ? visibility : ''
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
