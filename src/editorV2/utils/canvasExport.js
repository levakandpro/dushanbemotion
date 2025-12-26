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
    console.error('Canvas element not found')
    return false
  }

  console.log('📸 Exporting canvas:', format)

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

  // Конвертируем все img элементы в base64 через прокси
  const imagesToRestore = []
  const images = canvasElement.querySelectorAll('img')
  
  console.log('📷 Converting', images.length, 'img elements via proxy...')
  
  for (const img of images) {
    if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
      const originalSrc = img.src
      const base64 = await fetchImageAsBase64(img.src)
      if (base64) {
        imagesToRestore.push({ img, originalSrc })
        img.src = base64
        // Ждем загрузки изображения с таймаутом
        await new Promise(resolve => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
          } else {
            const timeout = setTimeout(() => {
              img.onload = null
              img.onerror = null
              resolve() // Продолжаем даже если не загрузилось
            }, 3000)
            img.onload = () => {
              clearTimeout(timeout)
              img.onerror = null
              resolve()
            }
            img.onerror = () => {
              clearTimeout(timeout)
              img.onload = null
              resolve() // Продолжаем даже при ошибке
            }
          }
        })
        console.log('✓ img:', originalSrc.substring(0, 50))
      }
    }
  }

  // Конвертируем CSS background-image в base64 через прокси
  const bgToRestore = []
  const allElements = canvasElement.querySelectorAll('*')
  
  for (const el of allElements) {
    const style = window.getComputedStyle(el)
    const bgImage = style.backgroundImage
    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
      const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/)
      if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
        const url = urlMatch[1]
        const base64 = await fetchImageAsBase64(url)
        if (base64) {
          bgToRestore.push({ el, originalBg: el.style.backgroundImage })
          el.style.backgroundImage = `url(${base64})`
          console.log('✓ bg:', url.substring(0, 50))
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

  // Дополнительная задержка для завершения всех загрузок изображений
  await new Promise(r => setTimeout(r, 300))

  try {
    let dataUrl
    let ext

    // Проверяем размеры canvas перед экспортом
    const canvasRect = canvasElement.getBoundingClientRect()
    console.log('📐 Canvas dimensions:', { width: canvasRect.width, height: canvasRect.height })

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
      // PNG/JPEG через html2canvas - высокое качество
      const html2canvas = (await import('html2canvas')).default
      
      console.log('🖼️ Starting html2canvas export...')
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: format === 'jpeg' ? '#ffffff' : null,
        scale: 2, // Снижаем scale для надежности (было 4)
        useCORS: true,
        allowTaint: false,
        logging: true, // Включаем логирование для отладки
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          // Игнорируем только UI элементы, но НЕ слои
          return element.classList.contains('dm-text-handle') || 
                 element.classList.contains('sticker-handle') ||
                 element.classList.contains('editor-v2-canvas-grid')
        }
      })

      console.log('✅ html2canvas completed, canvas size:', canvas.width, 'x', canvas.height)

      dataUrl = format === 'jpeg' 
        ? canvas.toDataURL('image/jpeg', 0.95)
        : canvas.toDataURL('image/png')
      
      console.log('📊 Data URL size:', dataUrl.length, 'bytes')
      
      ext = format === 'jpeg' ? 'jpg' : 'png'
    }
    
    downloadDataUrl(dataUrl, `${filename}.${ext}`)
    
    console.log('✅ Export successful')
    
  } catch (error) {
    console.error('❌ Export error:', error)
  } finally {
    // Восстанавливаем img элементы
    imagesToRestore.forEach(({ img, originalSrc }) => {
      img.src = originalSrc
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
    if (stageElement) stageElement.style.transform = originalStageTransform
  }
  
  return true
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
