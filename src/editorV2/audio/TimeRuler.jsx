import React from 'react'

// Экспортируем для использования в других компонентах
export const LEFT_OFFSET = 0 // Шкала начинается с 00:00 в самом начале

const AVAILABLE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60]
const TARGET_LABEL_SPACING = 100
const MINOR_DIVISIONS = 4

/**
 * Динамический TimeRuler с адаптивным шагом меток
 * @param {number} pixelsPerSecond - масштаб таймлайна
 * @param {number} duration - длительность проекта
 * @param {number} leftOffset - отступ слева (ширина колонки лейблов)
 */
export default function TimeRuler({
  projectDuration,
  pixelsPerSecond,
  onSeek,
  leftOffset = LEFT_OFFSET,
  totalLayers = 0,
  formatTime,
  currentTime = 0
}) {
  const duration = projectDuration
  const totalWidth = leftOffset + duration * pixelsPerSecond

  // Выбираем оптимальный шаг для меток (ближайший к 100px)
  const chooseLabelStep = () => {
    let bestStep = AVAILABLE_STEPS[0]
    let minDiff = Infinity
    
    for (const step of AVAILABLE_STEPS) {
      const labelStepPx = step * pixelsPerSecond
      const diff = Math.abs(labelStepPx - TARGET_LABEL_SPACING)
      
      if (diff < minDiff) {
        minDiff = diff
        bestStep = step
      }
    }
    
    return bestStep
  }

  const labelStepSec = chooseLabelStep()
  const minorStepSec = labelStepSec / MINOR_DIVISIONS

  // Генерация меток (major + minor) по формуле: tickX = leftOffset + t * pixelsPerSecond
  const generateMarkers = () => {
    const markers = []
    
    // Major метки с подписями
    for (let t = 0; t <= duration; t += labelStepSec) {
      const x = leftOffset + t * pixelsPerSecond
      markers.push({
        type: 'major',
        time: t,
        position: x,
        label: formatTime(t)
      })
    }
    
    // Minor метки без подписей (между major)
    for (let t = minorStepSec; t < duration; t += minorStepSec) {
      // Пропускаем позиции, где уже есть major метки
      const isMajor = Math.abs(t % labelStepSec) < 0.001
      if (!isMajor) {
        const x = leftOffset + t * pixelsPerSecond
        markers.push({
          type: 'minor',
          time: t,
          position: x
        })
      }
    }
    
    return markers
  }

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    // Вычисляем время относительно leftOffset (без ограничения по duration)
    const time = Math.max(0, (x - leftOffset) / pixelsPerSecond)
    onSeek(time)
  }
  
  // Обработка перетаскивания playhead с автоскроллом
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStateRef = React.useRef({ autoScrollActive: false, direction: 0 })
  
  React.useEffect(() => {
    const timeRulerElement = document.querySelector('.time-ruler')
    if (!timeRulerElement) return
    
    const handleMouseDown = (e) => {
      setIsDragging(true)
      handleClick(e)
    }
    
    const handleMouseMove = (e) => {
      if (!isDragging) return
      
      const tracksContainer = document.querySelector('.timeline-tracks')
      if (!tracksContainer) return
      
      const tracksRect = tracksContainer.getBoundingClientRect()
      const x = e.clientX - tracksRect.left // Позиция мыши внутри контейнера
      const w = tracksRect.width
      const scrollLeft = tracksContainer.scrollLeft
      
      // Вычисляем время: scrollLeft + x (в пикселях), затем делим на pixelsPerSecond
      const newTime = Math.max(0, (scrollLeft + x - leftOffset) / pixelsPerSecond)
      onSeek(newTime)
      
      // Автоскролл при приближении к краям
      const edgeThreshold = 40
      
      if (x > w - edgeThreshold) {
        // Близко к правому краю - скроллим вправо
        dragStateRef.current.autoScrollActive = true
        dragStateRef.current.direction = 1
      } else if (x < edgeThreshold && scrollLeft > 0) {
        // Близко к левому краю - скроллим влево
        dragStateRef.current.autoScrollActive = true
        dragStateRef.current.direction = -1
      } else {
        // В центральной области - не скроллим
        dragStateRef.current.autoScrollActive = false
        dragStateRef.current.direction = 0
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      dragStateRef.current.autoScrollActive = false
      dragStateRef.current.direction = 0
    }
    
    timeRulerElement.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      timeRulerElement.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, leftOffset, pixelsPerSecond, onSeek])
  
  // Автоскролл таймера
  React.useEffect(() => {
    if (!isDragging || !dragStateRef.current.autoScrollActive) return
    
    const interval = setInterval(() => {
      const tracksContainer = document.querySelector('.timeline-tracks')
      if (!tracksContainer) return
      
      const scrollSpeed = 10
      if (dragStateRef.current.direction === 1) {
        // Скроллим вправо
        tracksContainer.scrollLeft += scrollSpeed
      } else if (dragStateRef.current.direction === -1 && tracksContainer.scrollLeft > 0) {
        // Скроллим влево
        tracksContainer.scrollLeft -= scrollSpeed
      }
    }, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [isDragging])

  return (
    <div className="time-ruler" onClick={handleClick} style={{ width: `${totalWidth}px`, height: '20px', position: 'relative' }}>
      {/* Метки времени */}
      {generateMarkers().map((marker, idx) => (
        <div
          key={`${marker.type}-${marker.time}-${idx}`}
          className={`time-marker time-marker-${marker.type}`}
          style={{ left: `${marker.position}px` }}
        >
          <div className="time-marker-line" />
          {marker.type === 'major' && (
            <div className="time-marker-label">{marker.label}</div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Форматирует время в формат MM:SS
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

