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
        await new Promise(resolve => {
          if (img.complete) resolve()
          else img.onload = resolve
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

  await new Promise(r => setTimeout(r, 100))

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
    
    console.log('✅ Export successful')
    
  } catch (error) {
    console.error('❌ Export error:', error)
    return false
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
