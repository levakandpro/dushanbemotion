// src/editorV2/utils/renderCompleteHandler.js
/**
 * Утилита для обработки завершения рендера
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 
 * 1. После завершения рендера в браузере (Blob/Uint8Array):
 * 
 *    import { handleRenderComplete } from './renderCompleteHandler'
 *    
 *    // Где-то в коде рендеринга:
 *    const finalMp4 = await renderVideoToBlob(project) // Blob | Uint8Array
 *    const thumbnailUrl = await generateThumbnail(project) // string | null
 *    
 *    // Вызываем обработчик
 *    handleRenderComplete(finalMp4, null, thumbnailUrl)
 * 
 * 2. После завершения рендера на сервере (URL):
 * 
 *    import { handleRenderComplete } from './renderCompleteHandler'
 *    
 *    // Где-то в коде рендеринга:
 *    const response = await fetch('/api/render', { ... })
 *    const { videoUrl, thumbnailUrl } = await response.json()
 *    
 *    // Вызываем обработчик
 *    handleRenderComplete(null, videoUrl, thumbnailUrl)
 */

/**
 * Обрабатывает завершение рендера
 * @param {Blob|Uint8Array|null} finalMp4 - Результат рендера в браузере
 * @param {string|null} finalMp4Url - URL результата рендера на сервере
 * @param {string|null} thumbnailUrl - URL превью
 */
export function handleRenderComplete(finalMp4, finalMp4Url, thumbnailUrl) {
  // Проверяем, что функции доступны в window (загружены из export.html)
  if (typeof window !== 'undefined' && window.handleRenderComplete) {
    window.handleRenderComplete(finalMp4, finalMp4Url, thumbnailUrl)
  } else {
    console.error('window.handleRenderComplete is not available. Make sure export.html is loaded.')
  }
}

/**
 * Пример интеграции в место завершения рендера:
 * 
 * // Вариант 1: MediaRecorder (рендер в браузере)
 * const mediaRecorder = new MediaRecorder(canvas.captureStream())
 * const chunks = []
 * 
 * mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
 * mediaRecorder.onstop = async () => {
 *   const finalMp4 = new Blob(chunks, { type: 'video/mp4' })
 *   const thumbnailUrl = await generateThumbnail(canvas)
 *   handleRenderComplete(finalMp4, null, thumbnailUrl)
 * }
 * 
 * mediaRecorder.start()
 * // ... рендеринг ...
 * mediaRecorder.stop()
 * 
 * // Вариант 2: FFmpeg.wasm (рендер в браузере)
 * const { createFFmpeg } = FFmpeg
 * const ffmpeg = createFFmpeg({ log: true })
 * await ffmpeg.load()
 * 
 * // ... рендеринг кадров ...
 * 
 * const finalMp4 = await ffmpeg.exec(['-i', 'input.mp4', 'output.mp4'])
 * const finalMp4Bytes = ffmpeg.FS('readFile', 'output.mp4')
 * const finalMp4 = new Uint8Array(finalMp4Bytes)
 * 
 * handleRenderComplete(finalMp4, null, thumbnailUrl)
 * 
 * // Вариант 3: Серверный рендер (API)
 * const response = await fetch('/api/render', {
 *   method: 'POST',
 *   body: JSON.stringify(projectData)
 * })
 * const { videoUrl, thumbnailUrl } = await response.json()
 * 
 * handleRenderComplete(null, videoUrl, thumbnailUrl)
 */

