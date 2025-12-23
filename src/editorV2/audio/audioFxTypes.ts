// src/editorV2/audio/audioFxTypes.ts

/**
 * Типы для системы аудио-эффектов
 */

export interface AudioEqSettings {
  enabled: boolean
  lowGain: number // -20 до +20 dB
  midGain: number // -20 до +20 dB
  highGain: number // -20 до +20 dB
  lowFreq?: number // частота низких (по умолчанию 200 Hz)
  midFreq?: number // частота средних (по умолчанию 2000 Hz)
  highFreq?: number // частота высоких (по умолчанию 8000 Hz)
}

export interface AudioCompressorSettings {
  enabled: boolean
  threshold: number // -60 до 0 dB
  ratio: number // 1 до 20
  attack: number // 0 до 1 секунды
  release: number // 0 до 1 секунды
  knee: number // 0 до 40 dB
}

export interface AudioReverbSettings {
  enabled: boolean
  roomSize: 'small' | 'medium' | 'large' | 'hall'
  wetLevel: number // 0 до 1
  dryLevel: number // 0 до 1
  decay: number // 0 до 1
}

export interface AudioStereoSettings {
  enabled: boolean
  width: number // -1 (mono) до 1 (full stereo)
  pan: number // -1 (left) до 1 (right)
}

export interface AudioTapeSettings {
  enabled: boolean
  saturation: number // 0 до 1
  warmth: number // 0 до 1
  noise: number // 0 до 1
}

export interface AudioNoiseGateSettings {
  enabled: boolean
  threshold: number // -60 до 0 dB
  attack: number // 0 до 0.1 секунды
  release: number // 0 до 1 секунды
}

export interface AudioLimiterSettings {
  enabled: boolean
  threshold: number // -10 до 0 dB
  release: number // 0 до 0.1 секунды
}

export interface AudioPremiumEffects {
  eq?: AudioEqSettings
  compressor?: AudioCompressorSettings
  reverb?: AudioReverbSettings
  stereo?: AudioStereoSettings
  tape?: AudioTapeSettings
  noiseGate?: AudioNoiseGateSettings
  limiter?: AudioLimiterSettings
}

export interface AudioFxState {
  volume: number // 0 до 1
  fadeIn: number // 0 до 1 (доля длительности клипа)
  fadeOut: number // 0 до 1 (доля длительности клипа)
  normalize: boolean
  premiumEffects?: AudioPremiumEffects
}

export interface AudioTrackConfig {
  id: string
  buffer: AudioBuffer
  fx: AudioFxState
  startTime: number // время начала на таймлайне
  duration: number // длительность клипа
}

export interface AudioMasterConfig {
  volume: number // 0 до 1
  limiter: AudioLimiterSettings
}

