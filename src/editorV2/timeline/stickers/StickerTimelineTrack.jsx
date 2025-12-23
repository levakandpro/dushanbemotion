// src/editorV2/timeline/stickers/StickerTimelineTrack.jsx
import React from 'react'
import StickerClipItem from './StickerClipItem'
import { snapTime, getAllClipEdges } from './stickerTimelineState'
import { StickerIcon } from '../../components/TimelineIcons'

export default function StickerTimelineTrack({
  clips,
  selectedClipId,
  selectedClipIds = [],
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  pixelsPerSecond,
  playheadTime,
  totalDuration,
  isPanningTimeline = false
}) {
  
  const handleMove = (clipId, newStartTime, snapOptions) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    const duration = clip.endTime - clip.startTime
    const otherEdges = getAllClipEdges(clips, clipId)
    
    const snappedStart = snapTime(newStartTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15
    })
    
    const safeStart = Math.max(0, snappedStart)
    
    onUpdateClip(clipId, {
      startTime: safeStart,
      endTime: safeStart + duration
    })
  }

  const handleTrimStart = (clipId, newStartTime) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    const otherEdges = getAllClipEdges(clips, clipId)
    const snappedStart = snapTime(newStartTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15
    })

    const safeStart = Math.max(
      0,
      Math.min(snappedStart, clip.endTime - 0.1)
    )
    
    onUpdateClip(clipId, { startTime: safeStart })
  }

  const handleTrimEnd = (clipId, newEndTime) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    const otherEdges = getAllClipEdges(clips, clipId)
    const snappedEnd = snapTime(newEndTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15
    })

    const safeEnd = Math.max(clip.startTime + 0.1, snappedEnd)
    
    onUpdateClip(clipId, { endTime: safeEnd })
  }

  return (
    <div className="sticker-timeline-track audio-track">
      {/* Заголовок трека - идентичный аудио */}
      <div className="audio-track-label sticker-track-label">
        {/* Фоновая иконка (как в™Є у аудио) */}
        <StickerIcon 
          style={{
            position: 'absolute',
            width: '28px',
            height: '28px',
            color: 'rgba(147, 112, 255, 0.06)',
            zIndex: 0,
            transform: 'rotate(-15deg)',
            pointerEvents: 'none',
            top: '8px'
          }}
        />
        {/* Текст по центру */}
        <span>СТИКЕРЫ</span>
      </div>

      {/* Область с клипами - идентичная аудио */}
      <div className="audio-track-content sticker-track-content">
        {clips.map(clip => {
          const isClipSelected = selectedClipIds.includes(clip.id) || selectedClipId === clip.id
          
          return (
            <StickerClipItem
              key={clip.id}
              clip={clip}
              pixelsPerSecond={pixelsPerSecond}
              isSelected={isClipSelected}
              onSelect={onSelectClip}
              onMove={handleMove}
              onTrimStart={handleTrimStart}
              onTrimEnd={handleTrimEnd}
              onDelete={onDeleteClip}
              isPanningTimeline={isPanningTimeline}
            />
          )
        })}
      </div>
    </div>
  )
}

