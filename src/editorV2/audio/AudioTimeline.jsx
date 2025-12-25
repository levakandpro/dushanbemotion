import React, { useRef, useCallback, useEffect } from 'react'
import TimeRuler, { LEFT_OFFSET } from './TimeRuler'
import AudioClipItem from './AudioClipItem'
import VisualGroupTrack from './VisualGroupTrack'
import {
  calculateProjectDuration
} from './audioTypes'
import { getAudioEngine } from './audioEngine'
import { AudioIcon } from '../components/TimelineIcons'

/**
 * Основной компонент аудио-таймлайна
 */
export default function AudioTimeline({
  timeline,
  onUpdateTimeline,
  isPremium = false,
  stickerClips = [],
  onUpdateStickerClips,
  selectedStickerClipId,
  selectedStickerClipIds = [],
  onSelectStickerClip,
  textClips = [],
  onUpdateTextClips,
  selectedTextClipId,
  selectedTextClipIds = [],
  onSelectTextClip,
  project,
  onSelectLayer,
  onUpdateLayer
}) {
  const scrollContainerRef = useRef(null) // Контейнер для скроллируемых дорожек
  const timelineContentRef = useRef(null)
  const tracksContainerRef = useRef(null) // Контейнер с дорожками (внутри скроллируемой области)

  const {
    clips = [],
    projectDuration = 600, // 10 минут по умолчанию
    currentTime = 0,
    isPlaying = false,
    pixelsPerSecond = 60,
    selectedClipId = null,
    animationMaxDuration = 0
  } = timeline || {}

  const audioEngineRef = useRef(null)
  
  // Состояние навигации (только для UI, не влияет на позиции клипов)
  const [navState, setNavState] = React.useState({
    offsetX: 0, // Горизонтальный сдвиг для панорамирования (используется только для playhead)
    zoom: 1,    // Масштаб (1 = 100%)
    isPanning: false,
    isSpacePressed: false
  })
  
  // Состояние раскрытия визуальной группы (синхронизировано между левой и правой частями)
  const [isVisualGroupExpanded, setIsVisualGroupExpanded] = React.useState(false)
  
  const panStartRef = useRef({ x: 0, scrollLeft: 0 })
  const timeRulerScrollRef = useRef(null) // Ref для скролла TimeRuler
  const isSyncingScroll = useRef(false) // Флаг для предотвращения циклической синхронизации

  // =============================================
  // ОБНОВЛЕНИЕ СОСТОЯНИЯ
  // =============================================
  
  const updateState = useCallback((updates) => {
    onUpdateTimeline({
      ...timeline,
      ...updates
    })
  }, [timeline, onUpdateTimeline])

  // КРИТИЧНО: Сброс playhead на 0 при монтировании компонента
  useEffect(() => {
    updateState({ currentTime: 0, isPlaying: false })
  }, []) // Пустой массив - выполнится ОДИН раз при монтировании

  // Автоскролл playhead при воспроизведении
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const playheadX = currentTime * pixelsPerSecond
    const containerWidth = container.clientWidth
    const scrollLeft = container.scrollLeft
    const playheadRelativeX = playheadX - scrollLeft

    // Если playhead выходит за правый край видимой области
    if (playheadRelativeX > containerWidth - 100) {
      container.scrollLeft = playheadX - containerWidth + 100
    }
    // Если playhead выходит за левый край видимой области
    else if (playheadRelativeX < 100 && scrollLeft > 0) {
      container.scrollLeft = Math.max(0, playheadX - 100)
    }
  }, [currentTime, isPlaying, pixelsPerSecond])

  // Инициализация аудио-движка
  useEffect(() => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = getAudioEngine()
    }
    
    // Устанавливаем callback для обновления времени
    audioEngineRef.current.onTimeUpdate = (time) => {
      updateState({ currentTime: time })
    }

    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.pause()
        audioEngineRef.current.onTimeUpdate = null
      }
    }
  }, [updateState])

  // Синхронизация клипов с движком
  useEffect(() => {
    if (audioEngineRef.current && clips.length > 0) {
      audioEngineRef.current.syncClips(clips)
    }
  }, [clips])

  // Управление воспроизведением
  useEffect(() => {
    if (!audioEngineRef.current) return

    if (isPlaying) {
      // Запускаем воспроизведение
      if (!audioEngineRef.current.isPlaying) {
        audioEngineRef.current.play(clips, currentTime)
      }
    } else {
      // Останавливаем воспроизведение
      if (audioEngineRef.current.isPlaying) {
        audioEngineRef.current.pause()
      }
    }
  }, [isPlaying, clips, currentTime])
  
  // Обновление клипов во время воспроизведения
  useEffect(() => {
    if (!audioEngineRef.current || !isPlaying) return
    if (audioEngineRef.current.isPlaying && clips.length > 0) {
      audioEngineRef.current.syncClips(clips)
    }
  }, [clips, isPlaying])

  // Автоматическая остановка при достижении конца (только если есть контент)
  useEffect(() => {
    // Не останавливаем автоматически - пользователь может тянуть playhead дальше
    // Остановка происходит только вручную
  }, [isPlaying, currentTime, projectDuration, updateState])


  const updateClips = useCallback((newClips) => {
    const newProjectDuration = calculateProjectDuration(
      newClips,
      animationMaxDuration,
      3
    )
    
    updateState({
      clips: newClips,
      projectDuration: newProjectDuration
    })
  }, [animationMaxDuration, updateState])

  // =============================================
  // УПРАВЛЕНИЕ КЛИПАМИ
  // =============================================


  const handleSelectClip = useCallback((clipId, e) => {
    // Alt+клик = мультивыделение
    if (e?.altKey) {
      const currentSelected = timeline.selectedClipIds || []
      const isAlreadySelected = currentSelected.includes(clipId)
      
      if (isAlreadySelected) {
        // Убираем из выделения
        updateState({ 
          selectedClipIds: currentSelected.filter(id => id !== clipId),
          selectedClipId: currentSelected.filter(id => id !== clipId)[0] || null
        })
      } else {
        // Добавляем к выделению
        updateState({ 
          selectedClipIds: [...currentSelected, clipId],
          selectedClipId: clipId
        })
      }
    } else {
      // Обычный клик = одиночное выделение
      updateState({ 
        selectedClipId: clipId,
        selectedClipIds: [clipId]
      })
    }
  }, [updateState, timeline])

  const handleMoveClip = useCallback((clipId, newStartTime) => {
    const newClips = clips.map(clip =>
      clip.id === clipId
        ? { ...clip, startTime: Math.max(0, newStartTime) }
        : clip
    )
    updateClips(newClips)
  }, [clips, updateClips])

  const handleTrimStart = useCallback((clipId, newStartTime) => {
    const newClips = clips.map(clip => {
      if (clip.id !== clipId) return clip
      
      const delta = newStartTime - clip.startTime
      const newDuration = clip.duration - delta
      
      if (newDuration < 0.1) return clip
      
      return {
        ...clip,
        startTime: newStartTime,
        offsetInSource: clip.offsetInSource + delta,
        duration: newDuration
      }
    })
    updateClips(newClips)
  }, [clips, updateClips])

  const handleTrimEnd = useCallback((clipId, newEndTime) => {
    const newClips = clips.map(clip => {
      if (clip.id !== clipId) return clip
      
      const newDuration = newEndTime - clip.startTime
      
      if (newDuration < 0.1) return clip
      
      const maxDuration = clip.sourceDuration - clip.offsetInSource
      
      return {
        ...clip,
        duration: Math.min(newDuration, maxDuration)
      }
    })
    updateClips(newClips)
  }, [clips, updateClips])

  const handleDeleteClip = useCallback((clipId) => {
    const newClips = clips.filter(clip => clip.id !== clipId)
    updateClips(newClips)
    
    if (selectedClipId === clipId) {
      updateState({ selectedClipId: null })
    }
  }, [clips, selectedClipId, updateClips, updateState])

  // =============================================
  // УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ
  // =============================================

  const handleSeek = useCallback((time) => {
    const newTime = Math.max(0, time) // Убрали ограничение по projectDuration
    
    if (audioEngineRef.current) {
      audioEngineRef.current.seek(newTime)
    }
    
    updateState({ currentTime: newTime })
  }, [updateState])

  // =============================================
  // RENDER
  // =============================================

  // Позиция плейхеда (от начала шкалы времени)
  const playheadPosition = currentTime * pixelsPerSecond

  // Статистика для панели - считаем ОТОБРАЖАЕМЫЕ дорожки
  // Новая структура: Визуальная группа (1) + Переходы (1) + FX (1) + Аудио (1) = 4 дорожки минимум
  // Если визуальная группа развернута, добавляем количество слоев внутри
  const totalLayers = 4 // Визуальная группа + Переходы + FX + Аудио (минимальная высота)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // =============================================
  // НАВИГАЦИЯ: ПРОБЕЛ + ЛКМ (панорамирование)
  // =============================================

  // Отслеживание нажатия ПРОБЕЛА для панорамирования (только при Space + ЛКМ)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Устанавливаем флаг только если событие не было предотвращено (т.е. не play/pause)
      if (e.code === 'Space' && !e.defaultPrevented && !e.target.matches('input, textarea, [contenteditable="true"]')) {
        setNavState(prev => ({ ...prev, isSpacePressed: true }))
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setNavState(prev => ({ ...prev, isSpacePressed: false, isPanning: false }))
        // Сбрасываем курсор при отпускании Space
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.cursor = ''
        }
      }
    }

    // Используем обычный phase (не capture), чтобы hotkeys обработал первым
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Проверка, находится ли курсор над областью дорожек таймлайна (не над левой колонкой)
  const isOverTracksArea = useCallback((clientX, clientY) => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return false
    
    const containerRect = scrollContainer.getBoundingClientRect()
    const mouseX = clientX - containerRect.left
    const mouseY = clientY - containerRect.top
    
    // Проверяем, что курсор находится внутри контейнера дорожек
    if (mouseX < 0 || mouseY < 0 || mouseX > containerRect.width || mouseY > containerRect.height) {
      return false
    }
    
    // Проверяем, что курсор не над TimeRuler
    const timeRuler = scrollContainer.closest('.timeline-track-area')?.querySelector('.time-ruler')
    if (timeRuler) {
      const timeRulerRect = timeRuler.getBoundingClientRect()
      if (clientY >= timeRulerRect.top && clientY <= timeRulerRect.bottom) {
        return false
      }
    }
    
    return true
  }, [])

  // Обработчик начала панорамирования
  const handlePanStart = useCallback((e) => {
    if (!navState.isSpacePressed || e.button !== 0) return
    
    // Проверяем, что клик не по клипу или интерактивному элементу
    const target = e.target
    const isInteractiveElement = target.closest(
      '.audio-clip-item, .visual-layer-clip, .sticker-clip-item, .text-clip-item, button, input, select, textarea'
    )
    
    if (isInteractiveElement) return

    // Проверяем, что курсор находится над областью дорожек таймлайна
    if (!isOverTracksArea(e.clientX, e.clientY)) return

    e.preventDefault()
    e.stopPropagation()
    
    setNavState(prev => ({ ...prev, isPanning: true }))
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      panStartRef.current = {
        x: e.clientX,
        scrollLeft: scrollContainer.scrollLeft
      }
    }
  }, [navState.isSpacePressed, isOverTracksArea])

  // Экспортируем isPanningTimeline для использования в клипах
  const isPanningTimeline = navState.isPanning

  // Обработчик движения при панорамировании
  const handlePanMove = useCallback((e) => {
    if (!navState.isPanning) return

    const deltaX = e.clientX - panStartRef.current.x
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      // Двигаем только горизонтальный скролл контейнера с дорожками
      const newScrollLeft = panStartRef.current.scrollLeft - deltaX
      scrollContainer.scrollLeft = newScrollLeft
    }
  }, [navState.isPanning])

  // Обработчик окончания панорамирования
  const handlePanEnd = useCallback(() => {
    setNavState(prev => ({ ...prev, isPanning: false }))
  }, [])

  // Подписка на события мыши для панорамирования
  useEffect(() => {
    if (!navState.isPanning) return

    window.addEventListener('mousemove', handlePanMove)
    window.addEventListener('mouseup', handlePanEnd)

    return () => {
      window.removeEventListener('mousemove', handlePanMove)
      window.removeEventListener('mouseup', handlePanEnd)
    }
  }, [navState.isPanning, handlePanMove, handlePanEnd])

  // Синхронизация позиции TimeRuler с треками (только визуальная синхронизация)
  useEffect(() => {
    const tracksContainer = scrollContainerRef.current
    const timeRulerContainer = timeRulerScrollRef.current
    
    if (!tracksContainer || !timeRulerContainer) return
    
    const syncRulerPosition = () => {
      const scrollLeft = tracksContainer.scrollLeft
      timeRulerContainer.style.transform = `translateX(-${scrollLeft}px)`
    }
    
    tracksContainer.addEventListener('scroll', syncRulerPosition)
    
    return () => {
      tracksContainer.removeEventListener('scroll', syncRulerPosition)
    }
  }, [])

  // =============================================
  // НАВИГАЦИЯ: ALT + КОЛЕСО (зум)
  // =============================================

  const handleWheel = useCallback((e) => {
    if (!e.altKey) return

    e.preventDefault()
    e.stopPropagation()

    const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05
    const newZoom = Math.max(0.2, Math.min(3, navState.zoom + zoomDelta))

    if (Math.abs(newZoom - navState.zoom) < 0.01) return

    setNavState(prev => ({ ...prev, zoom: newZoom }))
  }, [navState.zoom])

  // CSS трансформации для навигации (только зум, без смещения - смещение через scrollLeft)
  const navTransform = `scaleX(${navState.zoom})`

  return (
    <div className="audio-timeline audio-timeline-simple">
      <div className="timeline-main">
        <div className="timeline-track-area">
          {/* Контейнер с трансформациями для навигации */}
          <div 
            ref={timelineContentRef}
            className="timeline-content-wrapper"
            style={{ 
              transform: navTransform,
              transformOrigin: 'left center',
              willChange: navState.isPanning ? 'transform' : 'auto'
            }}
          >
            {/* Структура с фиксированной левой колонкой и скроллируемой областью */}
            <div className="timeline-tracks-layout" style={{ height: '20px', minHeight: '20px' }}>
              {/* Левая колонка - статистика */}
              <div className="timeline-labels-column" style={{ 
                background: 'linear-gradient(180deg, var(--dm-timeline-bg) 0%, rgba(7, 23, 17, 0.9) 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '8px'
              }}>
                <div style={{ display: 'flex', gap: '6px', fontSize: '8px', opacity: 0.55 }}>
                  <span style={{ fontWeight: 400, color: '#DFFEF3' }}>Слоёв {totalLayers}</span>
                  <span style={{ fontWeight: 400, color: '#DFFEF3', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>

              {/* Правая колонка - ruler без скролла */}
              <div 
                style={{ 
                  height: '20px',
                  minHeight: '20px',
                  background: 'linear-gradient(180deg, var(--dm-timeline-bg) 0%, rgba(7, 23, 17, 0.9) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  flex: 1
                }}
              >
                <div 
                  ref={timeRulerScrollRef}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%'
                  }}
                >
                  <TimeRuler
                    projectDuration={Math.max(projectDuration, currentTime + 60)}
                    pixelsPerSecond={pixelsPerSecond}
                    leftOffset={0}
                    onSeek={handleSeek}
                    totalLayers={totalLayers}
                    formatTime={formatTime}
                    currentTime={currentTime}
                  />
                </div>
              </div>
            </div>

            {/* Структура с фиксированной левой колонкой и скроллируемой областью дорожек */}
            <div className="timeline-tracks-layout">
              {/* Фиксированная левая колонка с лейблами */}
              <div className="timeline-labels-column">
                {/* 1. ВИЗУАЛЬНАЯ ГРУППА (сворачиваемая, по умолчанию СВЕРНУТА) */}
                <VisualGroupTrack
                  project={project}
                  pixelsPerSecond={pixelsPerSecond}
                  playheadTime={currentTime}
                  totalDuration={projectDuration}
                  onSelectLayer={onSelectLayer}
                  onUpdateLayer={onUpdateLayer}
                  isPanningTimeline={isPanningTimeline}
                  renderMode="labels"
                  isExpanded={isVisualGroupExpanded}
                  onToggleExpanded={() => setIsVisualGroupExpanded(!isVisualGroupExpanded)}
                />

                {/* 2. ПЕРЕХОДЫ (тонкая дорожка) */}
                <div className="audio-track audio-track-thin">
                  <div className="audio-track-label">
                    <span>Переходы</span>
                  </div>
                </div>

                {/* 3. FX / ЭФФЕКТЫ */}
                <div className="audio-track">
                  <div className="audio-track-label">
                    <span>FX</span>
                  </div>
                </div>

                {/* АУДИО */}
                <div className="audio-track">
                  <div className="audio-track-label">
                    <AudioIcon 
                      style={{
                        position: 'absolute',
                        width: '42px',
                        height: '42px',
                        color: 'rgba(147, 112, 255, 0.06)',
                        zIndex: 0,
                        transform: 'rotate(-15deg)',
                        pointerEvents: 'none'
                      }}
                    />
                    <span>АУДИО</span>
                  </div>
                </div>
              </div>

              {/* Скроллируемая область с дорожками */}
              <div 
                className="timeline-tracks"
                ref={scrollContainerRef}
                onMouseDown={handlePanStart}
                onWheel={handleWheel}
                onMouseMove={(e) => {
                  // Меняем курсор только когда Space зажат и курсор над дорожками
                  if (navState.isSpacePressed && isOverTracksArea(e.clientX, e.clientY)) {
                    scrollContainerRef.current?.style.setProperty('cursor', navState.isPanning ? 'grabbing' : 'grab')
                  } else {
                    scrollContainerRef.current?.style.setProperty('cursor', '')
                  }
                }}
                onMouseLeave={() => {
                  // Сбрасываем курсор при уходе мыши из области
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.style.cursor = ''
                  }
                }}
                style={{ cursor: navState.isSpacePressed && navState.isPanning ? 'grabbing' : '' }}
              >
                {/* Playhead (курсор времени) - фиксированный относительно видимой области дорожек */}
                <div
                  className="playhead"
                  style={{ 
                    left: `${currentTime * pixelsPerSecond}px`,
                    transform: `scaleX(${1 / navState.zoom})` // Компенсируем зум для playhead
                  }}
                >
                  <div className="playhead-head" />
                  <div className="playhead-line" />
                </div>

                {/* Контейнер с дорожками */}
                <div 
                  ref={tracksContainerRef}
                  className="timeline-tracks-content"
                  style={{ 
                    width: `${Math.max(projectDuration, currentTime + 60) * pixelsPerSecond}px`
                  }}
                >
                  {/* 1. ВИЗУАЛЬНАЯ ГРУППА - контент (рендерим клипы для каждого слоя) */}
                  <VisualGroupTrack
                    project={project}
                    pixelsPerSecond={pixelsPerSecond}
                    playheadTime={currentTime}
                    totalDuration={projectDuration}
                    onSelectLayer={onSelectLayer}
                    onUpdateLayer={onUpdateLayer}
                    isPanningTimeline={isPanningTimeline}
                    renderMode="tracks"
                    isExpanded={isVisualGroupExpanded}
                    onToggleExpanded={() => setIsVisualGroupExpanded(!isVisualGroupExpanded)}
                  />

                  {/* 2. ПЕРЕХОДЫ - контент */}
                  <div className="audio-track audio-track-thin">
                    <div className="audio-track-content" />
                  </div>

                  {/* 3. FX / ЭФФЕКТЫ - контент */}
                  <div className="audio-track">
                    <div className="audio-track-content" />
                  </div>

                  {/* АУДИО - контент */}
                  <div className="audio-track">
                    <div className="audio-track-content">
                      {clips.map(clip => {
                        const selectedIds = timeline.selectedClipIds || []
                        const isClipSelected = selectedIds.includes(clip.id) || selectedClipId === clip.id
                        
                        return (
                          <AudioClipItem
                            key={clip.id}
                            clip={clip}
                            pixelsPerSecond={pixelsPerSecond}
                            isSelected={isClipSelected}
                            onSelect={handleSelectClip}
                            onMove={handleMoveClip}
                            onTrimStart={handleTrimStart}
                            onTrimEnd={handleTrimEnd}
                            onDelete={handleDeleteClip}
                            isPanningTimeline={isPanningTimeline}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
