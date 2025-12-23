// src/editorV2/panels/AudioPanel.jsx
import React, { useEffect, useRef } from 'react'
import AudioClipEditor from '../audio/AudioClipEditor'
import {
  ScissorsIcon,
  AddAudioIcon,
  TimelineHeaderIcon
} from '../audio/TimelineIcon'
import { findClipAtTime, splitClip, calculateProjectDuration } from '../audio/audioTypes'

/**
 * Панель настроек аудио в правом тулбаре
 */
export default function AudioPanel({ project, onChangeProject }) {
  const panelRef = useRef(null)
  const [isHoveringAdd, setIsHoveringAdd] = React.useState(false)
  const timeline = project?.timeline || {}
  const { 
    clips = [], 
    selectedClipId = null,
    isPlaying = false,
    currentTime = 0,
    animationMaxDuration = 0
  } = timeline
  
  const selectedClip = clips.find(c => c.id === selectedClipId) || null
  
  const handleUpdateClip = (clipId, updates) => {
    if (!onChangeProject || !project) return
    
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        const updatedClip = { ...clip, ...updates }
        // Пересчитываем флаг премиум-эффектов
        const isPremiumEffectUsed = 
          (updatedClip.pitch && updatedClip.pitch !== 0) ||
          (updatedClip.eqPreset && updatedClip.eqPreset !== 'none') ||
          (updatedClip.reverbPreset && updatedClip.reverbPreset !== 'none')
        
        return { ...updatedClip, isPremiumEffectUsed }
      }
      return clip
    })
    
    onChangeProject({
      ...project,
      timeline: {
        ...timeline,
        clips: updatedClips
      }
    })
  }
  
  const handleSplit = () => {
    if (!onChangeProject || !project) return
    
    const clipToSplit = findClipAtTime(clips, currentTime)
    if (!clipToSplit) return
    
    const result = splitClip(clipToSplit, currentTime)
    if (!result) return
    
    const [firstClip, secondClip] = result
    const newClips = clips.map(clip =>
      clip.id === clipToSplit.id ? firstClip : clip
    )
    newClips.push(secondClip)
    
    const newProjectDuration = calculateProjectDuration(newClips, animationMaxDuration, 3)
    
    onChangeProject({
      ...project,
      timeline: {
        ...timeline,
        clips: newClips,
        projectDuration: newProjectDuration
      }
    })
  }
  
  const handleAddAudio = async () => {
    if (!onChangeProject || !project) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      
      audio.onloadedmetadata = async () => {
        let duration = audio.duration || 0
        
        const lastClip = clips.length > 0
          ? clips.reduce((max, clip) => 
              (clip.startTime + clip.duration) > (max.startTime + max.duration) ? clip : max
            )
          : null
        
        const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0
        
        const newClip = {
          id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          audioSourceId: url,
          audioSourceName: file.name.replace(/\.\w+$/, ''),
          name: file.name.replace(/\.\w+$/, ''),
          startTime,
          duration,
          offsetInSource: 0,
          sourceDuration: duration,
          volume: 1.0,
          muted: false,
          fadeIn: 0,
          fadeOut: 0,
          speed: 1,
          loop: false,
          normalize: false,
          pitch: 0,
          eqPreset: 'none',
          reverbPreset: 'none',
          isPremiumEffectUsed: false,
          waveform: null,
          visible: true,
          locked: false
        }
        
        const newClips = [...clips, newClip]
        const newProjectDuration = calculateProjectDuration(newClips, animationMaxDuration, 3)
        
        onChangeProject({
          ...project,
          timeline: {
            ...timeline,
            clips: newClips,
            projectDuration: newProjectDuration,
            isTimelineExpanded: true
          }
        })
      }
    }
    
    input.click()
  }
  
  const handleDelete = () => {
    if (!selectedClip || !onChangeProject || !project) return
    
    const newClips = clips.filter(clip => clip.id !== selectedClip.id)
    const newProjectDuration = calculateProjectDuration(newClips, animationMaxDuration, 3)
    
    onChangeProject({
      ...project,
      timeline: {
        ...timeline,
        clips: newClips,
        projectDuration: newProjectDuration,
        selectedClipId: null
      }
    })
  }

  // Анимация пульса при выборе клипа
  useEffect(() => {
    if (selectedClip && panelRef.current) {
      panelRef.current.classList.add('dm-audio-panel-pulse')
      const timer = setTimeout(() => {
        if (panelRef.current) {
          panelRef.current.classList.remove('dm-audio-panel-pulse')
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [selectedClip?.id])

  return (
    <div className="dm-audio-panel" ref={panelRef}>
      <div className="dm-audio-panel-header">
        <div className="dm-audio-panel-title-row">
          <TimelineHeaderIcon size={20} className="dm-audio-panel-icon" />
          <h3 className="dm-audio-panel-title">
            {isHoveringAdd ? 'Добавить аудио' : 'Аудио панель'}
          </h3>
          <button
            className="dm-audio-add-round-btn"
            onClick={handleAddAudio}
            onMouseEnter={() => setIsHoveringAdd(true)}
            onMouseLeave={() => setIsHoveringAdd(false)}
          >
            <AddAudioIcon size={18} />
          </button>
        </div>
      </div>
      
      <div className="dm-audio-panel-controls">
        <button
          className="dm-audio-control-btn"
          onClick={handleSplit}
          disabled={!findClipAtTime(clips, currentTime)}
        >
          <ScissorsIcon size={16} />
          <span>Split</span>
        </button>
        
        <button
          className="dm-audio-control-btn dm-audio-delete-btn"
          onClick={handleDelete}
          disabled={!selectedClip}
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          <span>Удалить</span>
        </button>
      </div>
      
      <div className="dm-audio-panel-body">
        {selectedClip ? (
          <AudioClipEditor
            clip={selectedClip}
            onUpdateClip={handleUpdateClip}
            isPremium={false}
          />
        ) : (
          <div className="dm-audio-panel-empty">
            <div className="dm-audio-empty-icon">🎧</div>
            <div className="dm-audio-empty-text">
              <div className="dm-audio-empty-title">Нет выбранного аудио-клипа</div>
              <div className="dm-audio-empty-subtitle">Выберите клип на таймлайне для редактирования</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

