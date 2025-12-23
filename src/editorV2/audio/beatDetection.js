// src/editorV2/audio/beatDetection.js
// Детектор пиков (Beat Detection) для синхронизации стикеров с музыкой

/**
 * Анализирует аудио и находит сильные удары (биты)
 * @param {ArrayBuffer} audioBuffer - Аудио данные
 * @returns {Promise<Array<number>>} - Массив временных меток битов в секундах
 */
export async function detectBeats(audioBuffer) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const decodedData = await audioContext.decodeAudioData(audioBuffer.slice(0))
    
    // Получаем данные первого канала
    const channelData = decodedData.getChannelData(0)
    const sampleRate = decodedData.sampleRate
    
    // Параметры анализа
    const windowSize = 2048 // размер окна анализа
    const hopSize = 512 // шаг между окнами
    const threshold = 0.3 // порог для определения пика
    
    const beats = []
    const energyHistory = []
    const historySize = 43 // ~1 секунда истории при hopSize=512 и sampleRate=44100
    
    // Проходим по всему аудио
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      // Вычисляем энергию текущего окна
      let energy = 0
      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[i + j]
        energy += sample * sample
      }
      energy = Math.sqrt(energy / windowSize)
      
      // Вычисляем среднюю энергию из истории
      let avgEnergy = 0
      if (energyHistory.length > 0) {
        avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length
      }
      
      // Если текущая энергия превышает порог - это бит
      if (energy > avgEnergy * (1 + threshold) && energy > 0.1) {
        const timeInSeconds = i / sampleRate
        
        // Избегаем дублей (минимальное расстояние между битами 0.1 сек)
        if (beats.length === 0 || timeInSeconds - beats[beats.length - 1] > 0.1) {
          beats.push(timeInSeconds)
        }
      }
      
      // Обновляем историю энергии
      energyHistory.push(energy)
      if (energyHistory.length > historySize) {
        energyHistory.shift()
      }
    }
    
    console.log(`🎵 Обнаружено ${beats.length} битов:`, beats.slice(0, 10))
    
    return beats
  } catch (error) {
    console.error('Ошибка детекции битов:', error)
    return []
  }
}

/**
 * Фильтрует биты по интервалу
 * @param {Array<number>} beats - Все биты
 * @param {string} filter - Фильтр: 'all', 'strong', '1/2', '1/4'
 * @returns {Array<number>} - Отфильтрованные биты
 */
export function filterBeats(beats, filter = 'all') {
  switch (filter) {
    case 'all':
      return beats
    
    case 'strong':
      // Оставляем только каждый 2-й бит (сильные доли)
      return beats.filter((_, index) => index % 2 === 0)
    
    case '1/2':
      // Каждые 2 удара
      return beats.filter((_, index) => index % 2 === 0)
    
    case '1/4':
      // Каждые 4 удара
      return beats.filter((_, index) => index % 4 === 0)
    
    default:
      return beats
  }
}

/**
 * Проверяет, находится ли текущее время близко к биту
 * @param {number} currentTime - Текущее время воспроизведения
 * @param {Array<number>} beats - Массив битов
 * @param {number} tolerance - Допуск в секундах
 * @returns {boolean} - true если близко к биту
 */
export function isNearBeat(currentTime, beats, tolerance = 0.05) {
  return beats.some(beatTime => Math.abs(currentTime - beatTime) < tolerance)
}

/**
 * Находит ближайший бит к текущему времени
 * @param {number} currentTime - Текущее время
 * @param {Array<number>} beats - Массив битов
 * @returns {number|null} - Время ближайшего бита или null
 */
export function getNearestBeat(currentTime, beats) {
  if (!beats || beats.length === 0) return null
  
  let nearest = beats[0]
  let minDiff = Math.abs(currentTime - beats[0])
  
  for (const beat of beats) {
    const diff = Math.abs(currentTime - beat)
    if (diff < minDiff) {
      minDiff = diff
      nearest = beat
    }
  }
  
  return nearest
}

