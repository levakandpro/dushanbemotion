import React, { useState, useRef, useEffect } from 'react'
import { MuteIcon, LoopIcon, PremiumIcon, CloseIcon } from './TimelineIcon'

/**
 * Считает waveform по реальному аудио-URL
 */
async function generateWaveformFromUrl(url, samplesTarget = 700) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return []

  const ctx = new AudioCtx()
  try {
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

    const channelData = audioBuffer.getChannelData(0)
    const totalSamples = channelData.length
    if (!totalSamples) return []

    const blockSize = Math.max(1, Math.floor(totalSamples / samplesTarget))
    const peaks = []

    for (let i = 0; i < samplesTarget; i++) {
      const start = i * blockSize
      if (start >= totalSamples) break
      let end = start + blockSize
      if (end > totalSamples) end = totalSamples

      let max = 0
      for (let j = start; j < end; j++) {
        const v = Math.abs(channelData[j])
        if (v > max) max = v
      }
      peaks.push(max)
    }

    const globalMax = peaks.length ? Math.max(...peaks) : 1
    if (!globalMax) return peaks

    return peaks.map(v => v / globalMax) // норм 0..1
  } catch (e) {
    console.warn('Waveform decode failed', e)
    return []
  } finally {
    ctx.close()
  }
}

/**
 * Компонент отображения одного аудио-клипа на дорожке
 * (waveform + trim + drag)
 */
export default function AudioClipItem({
  clip,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onMove,
  onTrimStart,
  onTrimEnd,
  onDelete,
  isPanningTimeline = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isTrimming, setIsTrimming] = useState(null) // 'start' | 'end' | null
  const [waveformSamples, setWaveformSamples] = useState([])

  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)
  const clipRef = useRef(null)

  const left = clip.startTime * pixelsPerSecond
  const width = clip.duration * pixelsPerSecond

  // Тянем реальный waveform один раз для URL
  useEffect(() => {
    let cancelled = false
    if (!clip.audioSourceId) {
      setWaveformSamples([])
      return
    }

    ;(async () => {
      try {
        const samples = await generateWaveformFromUrl(clip.audioSourceId, 800)
        if (!cancelled) setWaveformSamples(samples)
      } catch (e) {
        console.warn('Waveform error', e)
        if (!cancelled) setWaveformSamples([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clip.audioSourceId])

  // ==== DRAG / TRIM ====

  const handleMouseDown = (e) => {
    if (e.target.closest('.clip-trim-handle')) return
    e.stopPropagation()
    
    // Если включена панорама таймлайна - не обрабатываем drag клипа
    if (isPanningTimeline) return
    
    onSelect(clip.id, e) // Передаём событие для проверки Alt
    
    // При мультивыделении не начинаем драг
    if (!e.altKey) {
      setIsDragging(true)
      dragStartX.current = e.clientX
      dragStartTime.current = clip.startTime
    }
  }

  const handleTrimMouseDown = (e, side) => {
    e.stopPropagation()
    onSelect(clip.id, e)
    setIsTrimming(side)
    dragStartX.current = e.clientX
    dragStartTime.current =
      side === 'start'
        ? clip.startTime
        : clip.startTime + clip.duration
  }

  useEffect(() => {
    if (!isDragging && !isTrimming) return
    if (isPanningTimeline) {
      // Если включена панорама - сбрасываем drag
      setIsDragging(false)
      setIsTrimming(null)
      return
    }

    const handleMouseMove = (e) => {
      if (isPanningTimeline) return
      
      const deltaX = e.clientX - dragStartX.current
      const deltaTime = deltaX / pixelsPerSecond

      if (isDragging) {
        const newStartTime = Math.max(0, dragStartTime.current + deltaTime)
        onMove(clip.id, newStartTime)
      } else if (isTrimming === 'start') {
        const newStartTime = Math.max(
          0,
          Math.min(
            dragStartTime.current + deltaTime,
            clip.startTime + clip.duration - 0.1
          )
        )
        onTrimStart(clip.id, newStartTime)
      } else if (isTrimming === 'end') {
        const newEndTime = Math.max(
          clip.startTime + 0.1,
          dragStartTime.current + deltaTime
        )
        onTrimEnd(clip.id, newEndTime)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsTrimming(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isTrimming, clip, pixelsPerSecond, onMove, onTrimStart, onTrimEnd, isPanningTimeline])

  // ==== WAVEFORM ====

  const renderWaveform = () => {
    if (!waveformSamples.length) return null

    const height = 40
    const mid = height / 2
    const amp = height / 2

    return (
      <svg
        viewBox={`0 0 ${waveformSamples.length} ${height}`}
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      >
        <defs>
          <linearGradient
            id={`waveGrad-${clip.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#ffbd4a" />
            <stop offset="50%" stopColor="#111111" />
            <stop offset="100%" stopColor="#ffbd4a" />
          </linearGradient>
        </defs>
        {waveformSamples.map((v, i) => {
          const value = Math.max(0, Math.min(1, v || 0))
          const y1 = mid - value * amp
          const y2 = mid + value * amp
          return (
            <line
              key={i}
              x1={i}
              x2={i}
              y1={y1}
              y2={y2}
              stroke={`url(#waveGrad-${clip.id})`}
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
      </svg>
    )
  }

  return (
    <div
      ref={clipRef}
      className={`audio-clip-item ${isSelected ? 'selected' : ''} ${
        isDragging ? 'dragging' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Trim handle - начало */}
      <div
        className="clip-trim-handle clip-trim-start"
        onMouseDown={(e) => handleTrimMouseDown(e, 'start')}
        style={{
          width: '6px',
          cursor: 'ew-resize',
          alignSelf: 'stretch',
          borderRadius: '8px 0 0 8px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1))',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)'
        }}
      />

      {/* Контент клипа + waveform */}
      <div
        className="clip-content"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '48px',
          flex: 1,
          borderRadius: '10px',
          background:
            'linear-gradient(180deg,#b58cff 0%,#8d63ff 45%,#6a3af0 100%)',
          boxShadow:
            '0 10px 24px rgba(0,0,0,0.65), inset 0 0 10px rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.16)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          boxSizing: 'border-box'
        }}
      >
        {/* фон waveform */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.95,
            pointerEvents: 'none',
            mixBlendMode: 'screen'
          }}
        >
          {renderWaveform()}
        </div>

        {/* верхний слой с текстом и иконками */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '8px',
            fontSize: '11px',
            color: '#ffffff',
            textShadow: '0 0 4px rgba(0,0,0,0.9)'
          }}
        >
          <div
            className="clip-name"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}
          >
            {clip.audioSourceName}
          </div>

          <div
            className="clip-icons"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {clip.muted && (
              <span className="clip-icon">
                <MuteIcon size={14} />
              </span>
            )}
            {clip.loop && (
              <span className="clip-icon">
                <LoopIcon size={14} />
              </span>
            )}
            {clip.isPremiumEffectUsed && (
              <span className="clip-icon premium">
                <PremiumIcon size={14} />
              </span>
            )}
          </div>

          {isSelected && (
            <button
              className="clip-delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(clip.id)
              }}
              style={{
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '999px',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Trim handle - конец */}
      <div
        className="clip-trim-handle clip-trim-end"
        onMouseDown={(e) => handleTrimMouseDown(e, 'end')}
        style={{
          width: '6px',
          cursor: 'ew-resize',
          alignSelf: 'stretch',
          borderRadius: '0 8px 8px 0',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1))',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)'
        }}
      />

      {/* Индикаторы fade */}
      {clip.fadeIn > 0 && (
        <div
          className="clip-fade clip-fade-in"
          style={{
            position: 'absolute',
            left: left,
            top: 0,
            bottom: 0,
            width: `${(clip.fadeIn / clip.duration) * 100}%`,
            pointerEvents: 'none',
            background:
              'linear-gradient(to right, rgba(0,0,0,0.7), transparent)'
          }}
        />
      )}
      {clip.fadeOut > 0 && (
        <div
          className="clip-fade clip-fade-out"
          style={{
            position: 'absolute',
            right: `calc(100% - ${left + width}px)`,
            top: 0,
            bottom: 0,
            width: `${(clip.fadeOut / clip.duration) * 100}%`,
            pointerEvents: 'none',
            background:
              'linear-gradient(to left, rgba(0,0,0,0.7), transparent)'
          }}
        />
      )}
    </div>
  )
}
