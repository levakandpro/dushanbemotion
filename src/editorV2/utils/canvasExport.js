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
 * С ограничением размера, чтобы избежать перегрузки браузера
 */
async function fetchImageAsBase64(url) {
  try {
    const proxyUrl = toProxyUrl(url)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // Уменьшен до 5 секунд
    
    try {
      const response = await fetch(proxyUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) return null
      
      // Проверяем размер - если слишком большой, пропускаем
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB лимит
        console.warn('Image too large, skipping:', url.substring(0, 50))
        return null
      }
      
      const blob = await response.blob()
      
      // Дополнительная проверка размера blob
      if (blob.size > 5 * 1024 * 1024) {
        console.warn('Image blob too large, skipping:', url.substring(0, 50))
        return null
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name !== 'AbortError') {
        // Не логируем таймауты, чтобы не засорять консоль
        return null
      }
      return null
    }
  } catch (e) {
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

  // Скрываем хэндлы и сетку
  const hideSelectors = ['.dm-text-handle', '.editor-v2-canvas-grid', '.sticker-handle']
  hideSelectors.forEach(sel => {
    canvasElement.querySelectorAll(sel).forEach(el => {
      elementsToHide.push({ el, visibility: el.style.visibility })
      el.style.visibility = 'hidden'
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
  // ОГРАНИЧИВАЕМ: обрабатываем только изображения, которые видны на канвасе
  // Не трогаем изображения, которые уже в base64 или blob
  const imagesToRestore = []
  const bgToRestore = []
  const images = Array.from(canvasElement.querySelectorAll('img')).filter(img => {
    // Пропускаем изображения, которые уже в правильном формате
    if (!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) {
      return false
    }
    // Пропускаем скрытые изображения
    const rect = img.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
  
  console.log('📷 Converting', images.length, 'visible img elements via proxy...')
  
  // Обрабатываем изображения последовательно, не все сразу
  try {
    for (const img of images) {
      const originalSrc = img.src
      try {
        const base64 = await fetchImageAsBase64(img.src)
        if (base64) {
          imagesToRestore.push({ img, originalSrc })
          img.src = base64
          // Ждем загрузки с таймаутом
          await new Promise(resolve => {
            if (img.complete) {
              resolve()
            } else {
              const timeout = setTimeout(() => {
                img.onload = null
                img.onerror = null
                resolve()
              }, 3000) // Уменьшен таймаут до 3 секунд
              img.onload = () => {
                clearTimeout(timeout)
                resolve()
              }
              img.onerror = () => {
                clearTimeout(timeout)
                resolve()
              }
            }
          })
        }
      } catch (imgError) {
        console.warn('Failed to convert img:', img.src.substring(0, 50), imgError)
      }
    }

    // Конвертируем CSS background-image в base64 через прокси
    // Ограничиваемся только видимыми элементами с фоновыми изображениями
    const allElements = Array.from(canvasElement.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
    
    for (const el of allElements) {
      try {
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
            }
          }
        }
      } catch (bgError) {
        // Игнорируем ошибки фоновых изображений
      }
    }
  } catch (convertError) {
    console.error('Error converting images:', convertError)
    // Восстанавливаем уже измененные изображения
    imagesToRestore.forEach(({ img, originalSrc }) => {
      img.src = originalSrc
    })
    bgToRestore.forEach(({ el, originalBg }) => {
      el.style.backgroundImage = originalBg
    })
    // Продолжаем дальше, чтобы finally все восстановил
  }

  await new Promise(r => setTimeout(r, 100))

  let exportSuccess = false
  try {
    let dataUrl
    let ext

    if (format === 'svg') {
      // SVG через modern-screenshot
      const { domToSvg } = await import('modern-screenshot')
      dataUrl = await domToSvg(canvasElement, {
        scale: 4,
        backgroundColor: null
      })
      ext = 'svg'
    } else {
      // PNG/JPEG через html2canvas - высокое качество
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: format === 'jpeg' ? '#ffffff' : null,
        scale: 4, // Высокое качество (4x)
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000
      })

      dataUrl = format === 'jpeg' 
        ? canvas.toDataURL('image/jpeg', 0.95)
        : canvas.toDataURL('image/png')
      
      ext = format === 'jpeg' ? 'jpg' : 'png'
    }
    
    downloadDataUrl(dataUrl, `${filename}.${ext}`)
    exportSuccess = true
    console.log('✅ Export successful')
    
  } catch (error) {
    console.error('❌ Export error:', error)
    exportSuccess = false
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
      else el.style.visibility = visibility || ''
    })
    if (stageElement) stageElement.style.transform = originalStageTransform
  }
  
  return exportSuccess
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
