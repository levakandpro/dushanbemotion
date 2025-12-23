// src/editorV2/audio/audioAdapter.ts

import { AudioTrackConfig, AudioFxState, AudioMasterConfig } from './audioFxTypes'
import { getPresetById } from './audioFxPresets'

/**
 * Адаптер для конвертации старых AudioClip в новые AudioTrackConfig
 */

interface LegacyAudioClip {
  id: string
  audioSourceId: string
  startTime: number
  duration: number
  offsetInSource?: number
  volume?: number
  fadeIn?: number
  fadeOut?: number
  normalize?: boolean
  eqPreset?: string
  reverbPreset?: string
  pitch?: number
  speed?: number
  muted?: boolean
}

/**
 * Конвертирует старый AudioClip в AudioTrackConfig
 */
export async function clipToTrackConfig(
  clip: LegacyAudioClip,
  audioBuffer: AudioBuffer
): Promise<AudioTrackConfig> {
  // Создаем базовый AudioFxState
  const fx: AudioFxState = {
    volume: clip.muted ? 0 : (clip.volume || 1.0),
    fadeIn: clip.fadeIn ? clip.fadeIn / clip.duration : 0,
    fadeOut: clip.fadeOut ? clip.fadeOut / clip.duration : 0,
    normalize: clip.normalize || false,
    premiumEffects: {}
  }

  // Применяем пресеты, если есть
  if (clip.eqPreset && clip.eqPreset !== 'none') {
    const preset = getPresetById(clip.eqPreset)
    if (preset && preset.fx.premiumEffects?.eq) {
      fx.premiumEffects!.eq = preset.fx.premiumEffects.eq
    }
  }

  if (clip.reverbPreset && clip.reverbPreset !== 'none') {
    const preset = getPresetById(clip.reverbPreset)
    if (preset && preset.fx.premiumEffects?.reverb) {
      fx.premiumEffects!.reverb = preset.fx.premiumEffects.reverb
    }
  }

  // Pitch через playbackRate (упрощенно)
  // В реальности нужен более сложный алгоритм

  return {
    id: clip.id,
    buffer: audioBuffer,
    fx,
    startTime: clip.startTime,
    duration: clip.duration
  }
}

/**
 * Загружает аудио-файл в AudioBuffer
 */
export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const audioContext = new AudioContext()
  return audioContext.decodeAudioData(arrayBuffer)
}

/**
 * Создает AudioMasterConfig из настроек проекта
 */
export function createMasterConfig(project?: any): AudioMasterConfig {
  return {
    volume: 1.0,
    limiter: {
      enabled: true,
      threshold: -1.0,
      release: 0.01
    }
  }
}

