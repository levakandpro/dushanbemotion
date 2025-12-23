// src/editorV2/audio/audioFxPresets.ts

import { AudioFxState, AudioPremiumEffects } from './audioFxTypes'

/**
 * Пресеты аудио-эффектов
 */

export interface AudioFxPreset {
  id: string
  label: string
  fx: AudioFxState
}

export const AUDIO_FX_PRESETS: AudioFxPreset[] = [
  {
    id: 'vocal_cleaner',
    label: 'Vocal Cleaner',
    fx: {
      volume: 1.0,
      fadeIn: 0.05,
      fadeOut: 0.05,
      normalize: true,
      premiumEffects: {
        eq: {
          enabled: true,
          lowGain: -3,
          midGain: 3,
          highGain: 2,
          lowFreq: 200,
          midFreq: 2000,
          highFreq: 8000
        },
        compressor: {
          enabled: true,
          threshold: -12,
          ratio: 4,
          attack: 0.003,
          release: 0.1,
          knee: 2
        },
        noiseGate: {
          enabled: true,
          threshold: -40,
          attack: 0.001,
          release: 0.05
        }
      }
    }
  },
  {
    id: 'phone',
    label: 'Phone',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        eq: {
          enabled: true,
          lowGain: -20,
          midGain: 8,
          highGain: -15,
          lowFreq: 300,
          midFreq: 2000,
          highFreq: 4000
        },
        tape: {
          enabled: true,
          saturation: 0.3,
          warmth: 0.2,
          noise: 0.1
        }
      }
    }
  },
  {
    id: 'radio',
    label: 'Radio',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        eq: {
          enabled: true,
          lowGain: -10,
          midGain: 5,
          highGain: -8,
          lowFreq: 400,
          midFreq: 2500,
          highFreq: 5000
        },
        tape: {
          enabled: true,
          saturation: 0.4,
          warmth: 0.3,
          noise: 0.15
        },
        compressor: {
          enabled: true,
          threshold: -8,
          ratio: 6,
          attack: 0.002,
          release: 0.08,
          knee: 3
        }
      }
    }
  },
  {
    id: 'tape',
    label: 'Tape',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        tape: {
          enabled: true,
          saturation: 0.6,
          warmth: 0.5,
          noise: 0.2
        },
        eq: {
          enabled: true,
          lowGain: 2,
          midGain: -1,
          highGain: -3,
          lowFreq: 200,
          midFreq: 2000,
          highFreq: 8000
        }
      }
    }
  },
  {
    id: 'bass_boost',
    label: 'Bass Boost',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        eq: {
          enabled: true,
          lowGain: 12,
          midGain: 0,
          highGain: 0,
          lowFreq: 100,
          midFreq: 2000,
          highFreq: 8000
        },
        compressor: {
          enabled: true,
          threshold: -6,
          ratio: 3,
          attack: 0.01,
          release: 0.1,
          knee: 2
        }
      }
    }
  },
  {
    id: 'hall_reverb',
    label: 'Hall Reverb',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        reverb: {
          enabled: true,
          roomSize: 'hall',
          wetLevel: 0.4,
          dryLevel: 0.6,
          decay: 0.8
        }
      }
    }
  },
  {
    id: 'small_room',
    label: 'Small Room',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        reverb: {
          enabled: true,
          roomSize: 'small',
          wetLevel: 0.2,
          dryLevel: 0.8,
          decay: 0.3
        }
      }
    }
  },
  {
    id: 'wide_stereo',
    label: 'Wide Stereo',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        stereo: {
          enabled: true,
          width: 1.0,
          pan: 0
        }
      }
    }
  },
  {
    id: 'mono',
    label: 'Mono',
    fx: {
      volume: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      normalize: false,
      premiumEffects: {
        stereo: {
          enabled: true,
          width: -1,
          pan: 0
        }
      }
    }
  }
]

export const getPresetById = (id: string): AudioFxPreset | undefined => {
  return AUDIO_FX_PRESETS.find(preset => preset.id === id)
}

export const getAllPresets = (): AudioFxPreset[] => {
  return AUDIO_FX_PRESETS
}

