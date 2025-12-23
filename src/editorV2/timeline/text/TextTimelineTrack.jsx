// src/editorV2/timeline/text/TextTimelineTrack.jsx

import React from 'react'
import TextClipItem from './TextClipItem'
import { snapTextTime, getAllTextClipEdges } from './textTimelineState'

export default function TextTimelineTrack({
  clips = [],
  selectedClipId,
  selectedClipIds = [],
  onSelectClip,
  onUpdateClip,
  pixelsPerSecond,
  playheadTime,
  isPanningTimeline = false
}) {
  const handleMove = (clipId, newStartTime) => {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) return

    const duration = clip.endTime - clip.startTime
    const otherEdges = getAllTextClipEdges(clips, clipId)

    const snappedStart = snapTextTime(newStartTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15,
    })

    const safeStart = Math.max(0, snappedStart)

    onUpdateClip(clipId, {
      startTime: safeStart,
      endTime: safeStart + duration,
    })
  }

  const handleTrimStart = (clipId, newStartTime) => {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) return

    const otherEdges = getAllTextClipEdges(clips, clipId)
    const snappedStart = snapTextTime(newStartTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15,
    })

    const safeStart = Math.max(0, Math.min(snappedStart, clip.endTime - 0.1))

    onUpdateClip(clipId, { startTime: safeStart })
  }

  const handleTrimEnd = (clipId, newEndTime) => {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) return

    const otherEdges = getAllTextClipEdges(clips, clipId)
    const snappedEnd = snapTextTime(newEndTime, {
      otherClipEdges: otherEdges,
      playheadTime,
      tolerance: 0.15,
    })

    const safeEnd = Math.max(clip.startTime + 0.1, snappedEnd)

    onUpdateClip(clipId, { endTime: safeEnd })
  }

  return (
    <div className="sticker-timeline-track audio-track">
      {/* Заголовок дорожки текста */}
      <div className="audio-track-label sticker-track-label">
        <span>ТЕКСТ</span>
      </div>

      <div className="audio-track-content sticker-track-content">
        {clips.map((clip) => {
          const isClipSelected =
            (selectedClipIds && selectedClipIds.includes(clip.id)) ||
            selectedClipId === clip.id

          return (
            <TextClipItem
              key={clip.id}
              clip={clip}
              pixelsPerSecond={pixelsPerSecond}
              isSelected={isClipSelected}
              onSelect={onSelectClip}
              onMove={handleMove}
              onTrimStart={handleTrimStart}
              onTrimEnd={handleTrimEnd}
              isPanningTimeline={isPanningTimeline}
            />
          )
        })}
      </div>
    </div>
  )
}


