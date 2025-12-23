// src/editorV2/audio/audioExport.ts

import { AudioEngine } from './audioEngine'
import { AudioTrackConfig, AudioMasterConfig } from './audioFxTypes'

/**
 * Модуль экспорта аудио через OfflineAudioContext
 * Использует тот же граф обработки, что и превью
 */

export interface AudioExportOptions {
  tracks: AudioTrackConfig[]
  master: AudioMasterConfig
  sampleRate?: number
  duration: number // в секундах
}

/**
 * Экспортирует аудио-микс в AudioBuffer
 */
export async function exportAudioMix(
  options: AudioExportOptions
): Promise<AudioBuffer> {
  const sampleRate = options.sampleRate || 44100
  const length = Math.ceil(options.duration * sampleRate)

  // Создаем OfflineAudioContext
  const engine = new AudioEngine(sampleRate, length)

  // Настраиваем master
  engine.setMasterConfig(options.master)

  // Создаем и запускаем все треки
  const sources: AudioBufferSourceNode[] = []
  const startTime = engine.getContext().currentTime

  for (const trackConfig of options.tracks) {
    const source = engine.createTrackChain({
      ...trackConfig,
      startTime: startTime + trackConfig.startTime
    })
    source.start(startTime + trackConfig.startTime)
    sources.push(source)
  }

  // Рендерим
  return engine.render()
}

/**
 * Конвертирует AudioBuffer в WAV blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length
  const numberOfChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bytesPerSample = 2
  const blockAlign = numberOfChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const bufferSize = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, bufferSize - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // audio format (PCM)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Audio data
  let offset = 44
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += bytesPerSample
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Экспортирует аудио-микс в WAV файл
 */
export async function exportAudioMixToWav(
  options: AudioExportOptions
): Promise<Blob> {
  const buffer = await exportAudioMix(options)
  return audioBufferToWav(buffer)
}

