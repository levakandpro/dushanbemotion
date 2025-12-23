// src/editorV2/audio/audioPreview.ts

import { AudioEngine } from './audioEngine'
import { AudioTrackConfig, AudioMasterConfig } from './audioFxTypes'

/**
 * Модуль превью аудио в реальном времени
 * Использует AudioContext для воспроизведения
 */

export class AudioPreview {
  private engine: AudioEngine | null = null
  private sources: AudioBufferSourceNode[] = []
  private isPlaying: boolean = false

  /**
   * Инициализирует движок для превью
   */
  init() {
    if (this.engine) {
      this.cleanup()
    }
    this.engine = new AudioEngine()
  }

  /**
   * Воспроизводит треки с эффектами
   */
  async playTracks(
    tracks: AudioTrackConfig[],
    master: AudioMasterConfig,
    startTime: number = 0
  ) {
    if (!this.engine) {
      this.init()
    }

    if (this.isPlaying) {
      this.stop()
    }

    const engine = this.engine!
    engine.setMasterConfig(master)

    const context = engine.getContext() as AudioContext
    const currentTime = context.currentTime

    // Создаем и запускаем все треки
    this.sources = []
    for (const trackConfig of tracks) {
      const source = engine.createTrackChain({
        ...trackConfig,
        startTime: currentTime + trackConfig.startTime - startTime
      })
      
      const playTime = currentTime + Math.max(0, trackConfig.startTime - startTime)
      if (playTime < currentTime + trackConfig.duration) {
        source.start(playTime)
        this.sources.push(source)
      }
    }

    this.isPlaying = true
  }

  /**
   * Останавливает воспроизведение
   */
  stop() {
    this.sources.forEach(source => {
      try {
        source.stop()
      } catch (e) {
        // Игнорируем ошибки, если уже остановлен
      }
    })
    this.sources = []
    this.isPlaying = false
  }

  /**
   * Очищает ресурсы
   */
  cleanup() {
    this.stop()
    if (this.engine) {
      const context = this.engine.getContext()
      if (context instanceof AudioContext) {
        context.close().catch(() => {})
      }
    }
    this.engine = null
  }

  /**
   * Проверяет, играет ли сейчас
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }
}

// Singleton для превью
export const audioPreview = new AudioPreview()

