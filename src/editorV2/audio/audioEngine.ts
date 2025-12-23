// src/editorV2/audio/audioEngine.ts

import {
  AudioFxState,
  AudioTrackConfig,
  AudioMasterConfig,
  AudioEqSettings,
  AudioCompressorSettings,
  AudioReverbSettings,
  AudioStereoSettings,
  AudioTapeSettings,
  AudioNoiseGateSettings
} from './audioFxTypes'

/**
 * Единый аудио-движок для превью и экспорта
 * Использует WebAudio API для обработки звука
 */

export class AudioEngine {
  private audioContext: AudioContext | OfflineAudioContext
  private masterGain: GainNode
  private limiterNode: DynamicsCompressorNode
  private isOffline: boolean

  constructor(sampleRate?: number, length?: number) {
    if (sampleRate && length) {
      // OfflineAudioContext для экспорта
      this.audioContext = new OfflineAudioContext(2, length, sampleRate)
      this.isOffline = true
    } else {
      // AudioContext для превью
      this.audioContext = new AudioContext()
      this.isOffline = false
    }

    // Master gain
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 1.0

    // Limiter (soft compressor)
    this.limiterNode = this.audioContext.createDynamicsCompressor()
    this.limiterNode.threshold.value = -1.0
    this.limiterNode.knee.value = 1.0
    this.limiterNode.ratio.value = 20.0
    this.limiterNode.attack.value = 0.001
    this.limiterNode.release.value = 0.01

    // Подключение: masterGain -> limiter -> destination
    this.masterGain.connect(this.limiterNode)
    this.limiterNode.connect(this.audioContext.destination)
  }

  /**
   * Обновляет настройки master
   */
  setMasterConfig(config: AudioMasterConfig) {
    this.masterGain.gain.value = config.volume

    if (config.limiter.enabled) {
      this.limiterNode.threshold.value = config.limiter.threshold
      this.limiterNode.release.value = config.limiter.release
    }
  }

  /**
   * Создает цепочку обработки для трека
   */
  createTrackChain(trackConfig: AudioTrackConfig): AudioBufferSourceNode {
    const { buffer, fx } = trackConfig

    // Source
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer

    // Нормализация (если включена)
    let currentNode: AudioNode = source

    if (fx.normalize) {
      const normalizeGain = this.audioContext.createGain()
      const maxLevel = this.getMaxLevel(buffer)
      if (maxLevel > 0) {
        normalizeGain.gain.value = 1.0 / maxLevel
      }
      currentNode.connect(normalizeGain)
      currentNode = normalizeGain
    }

    // Noise Gate
    if (fx.premiumEffects?.noiseGate?.enabled) {
      const gateNode = this.createNoiseGate(fx.premiumEffects.noiseGate)
      currentNode.connect(gateNode)
      currentNode = gateNode
    }

    // EQ (несколько фильтров в цепи)
    if (fx.premiumEffects?.eq?.enabled) {
      const eqNodes = this.createEqChain(fx.premiumEffects.eq)
      for (const eqNode of eqNodes) {
        currentNode.connect(eqNode)
        currentNode = eqNode
      }
    }

    // Compressor
    if (fx.premiumEffects?.compressor?.enabled) {
      const compressorNode = this.createCompressor(fx.premiumEffects.compressor)
      currentNode.connect(compressorNode)
      currentNode = compressorNode
    }

    // Tape/Saturation
    if (fx.premiumEffects?.tape?.enabled) {
      const tapeNode = this.createTape(fx.premiumEffects.tape)
      currentNode.connect(tapeNode)
      currentNode = tapeNode
    }

    // Reverb (send/return)
    if (fx.premiumEffects?.reverb?.enabled) {
      const reverbNodes = this.createReverb(fx.premiumEffects.reverb)
      // Параллельное подключение: dry + wet
      const dryGain = this.audioContext.createGain()
      const wetGain = this.audioContext.createGain()
      dryGain.gain.value = fx.premiumEffects.reverb.dryLevel
      wetGain.gain.value = fx.premiumEffects.reverb.wetLevel

      currentNode.connect(dryGain)
      currentNode.connect(reverbNodes.sendGain)
      reverbNodes.returnGain.connect(wetGain)

      const merger = this.audioContext.createChannelMerger(2)
      dryGain.connect(merger, 0, 0)
      wetGain.connect(merger, 0, 1)
      currentNode = merger
    }

    // Stereo
    if (fx.premiumEffects?.stereo?.enabled) {
      const stereoNode = this.createStereo(fx.premiumEffects.stereo)
      currentNode.connect(stereoNode)
      currentNode = stereoNode
    }

    // Track Gain (громкость + fades)
    const trackGain = this.audioContext.createGain()
    this.applyFades(trackGain.gain, trackConfig, fx)
    currentNode.connect(trackGain)

    // Подключение к master
    trackGain.connect(this.masterGain)

    return source
  }

  /**
   * Создает цепочку EQ (3 фильтра: low, mid, high)
   */
  private createEqChain(eq: AudioEqSettings): BiquadFilterNode[] {
    const nodes: BiquadFilterNode[] = []

    // Low shelf
    const lowFilter = this.audioContext.createBiquadFilter()
    lowFilter.type = 'lowshelf'
    lowFilter.frequency.value = eq.lowFreq || 200
    lowFilter.gain.value = eq.lowGain
    nodes.push(lowFilter)

    // Mid peak
    const midFilter = this.audioContext.createBiquadFilter()
    midFilter.type = 'peaking'
    midFilter.frequency.value = eq.midFreq || 2000
    midFilter.Q.value = 1.0
    midFilter.gain.value = eq.midGain
    nodes.push(midFilter)

    // High shelf
    const highFilter = this.audioContext.createBiquadFilter()
    highFilter.type = 'highshelf'
    highFilter.frequency.value = eq.highFreq || 8000
    highFilter.gain.value = eq.highGain
    nodes.push(highFilter)

    return nodes
  }

  /**
   * Создает компрессор
   */
  private createCompressor(comp: AudioCompressorSettings): DynamicsCompressorNode {
    const compressor = this.audioContext.createDynamicsCompressor()
    compressor.threshold.value = comp.threshold
    compressor.ratio.value = comp.ratio
    compressor.attack.value = comp.attack
    compressor.release.value = comp.release
    compressor.knee.value = comp.knee
    return compressor
  }

  /**
   * Создает реверб (send/return)
   */
  private createReverb(reverb: AudioReverbSettings): {
    sendGain: GainNode
    convolver: ConvolverNode
    returnGain: GainNode
  } {
    const sendGain = this.audioContext.createGain()
    sendGain.gain.value = 1.0

    const convolver = this.audioContext.createConvolver()
    // TODO: Загрузить IR (Impulse Response) для разных размеров комнаты
    // Пока используем простой реверб через задержку
    const delay = this.audioContext.createDelay()
    delay.delayTime.value = 0.1
    const feedbackGain = this.audioContext.createGain()
    feedbackGain.gain.value = reverb.decay * 0.3
    delay.connect(feedbackGain)
    feedbackGain.connect(delay)

    sendGain.connect(delay)
    const returnGain = this.audioContext.createGain()
    delay.connect(returnGain)

    return { sendGain, convolver, returnGain }
  }

  /**
   * Создает стерео-обработку
   */
  private createStereo(stereo: AudioStereoSettings): StereoPannerNode {
    const panner = this.audioContext.createStereoPanner()
    panner.pan.value = stereo.pan
    // Width через ChannelSplitter/Merger (упрощенно через pan)
    return panner
  }

  /**
   * Создает tape/saturation эффект
   */
  private createTape(tape: AudioTapeSettings): WaveShaperNode {
    const shaper = this.audioContext.createWaveShaper()
    const curve = new Float32Array(65536)
    const deg = Math.PI / 180

    for (let i = 0; i < 65536; i++) {
      const x = (i * 2) / 65536 - 1
      // Waveshaping для saturation
      const k = 2 * tape.saturation / (1 - tape.saturation)
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
    }

    shaper.curve = curve
    shaper.oversample = '4x'
    return shaper
  }

  /**
   * Создает noise gate
   */
  private createNoiseGate(gate: AudioNoiseGateSettings): GainNode {
    // Упрощенная реализация через GainNode
    // В реальности нужен ScriptProcessorNode или AudioWorklet для RMS
    const gateGain = this.audioContext.createGain()
    gateGain.gain.value = 1.0
    // TODO: Реализовать через AudioWorklet для анализа RMS
    return gateGain
  }

  /**
   * Применяет fade in/out к gain
   */
  private applyFades(
    gainParam: AudioParam,
    trackConfig: AudioTrackConfig,
    fx: AudioFxState
  ) {
    const now = this.audioContext.currentTime
    const startTime = trackConfig.startTime
    const duration = trackConfig.duration

    // Начальная громкость
    gainParam.setValueAtTime(0, startTime)

    // Fade In
    if (fx.fadeIn > 0) {
      const fadeInDuration = duration * fx.fadeIn
      gainParam.linearRampToValueAtTime(
        fx.volume,
        startTime + fadeInDuration
      )
    } else {
      gainParam.setValueAtTime(fx.volume, startTime)
    }

    // Основная громкость
    const fadeOutStart = startTime + duration * (1 - fx.fadeOut)
    gainParam.setValueAtTime(fx.volume, fadeOutStart)

    // Fade Out
    if (fx.fadeOut > 0) {
      gainParam.linearRampToValueAtTime(0, startTime + duration)
    } else {
      gainParam.setValueAtTime(0, startTime + duration)
    }
  }

  /**
   * Вычисляет максимальный уровень в буфере (для нормализации)
   */
  private getMaxLevel(buffer: AudioBuffer): number {
    let max = 0
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        max = Math.max(max, Math.abs(channelData[i]))
      }
    }
    return max
  }

  /**
   * Получить AudioContext
   */
  getContext(): AudioContext | OfflineAudioContext {
    return this.audioContext
  }

  /**
   * Для OfflineAudioContext: запустить рендеринг
   */
  async render(): Promise<AudioBuffer> {
    if (!this.isOffline) {
      throw new Error('render() can only be called on OfflineAudioContext')
    }
    return (this.audioContext as OfflineAudioContext).startRendering()
  }
}

