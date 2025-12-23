// src/editorV2/view/ViewProjectScreen.jsx
import React, { useEffect, useState, useRef } from 'react'
import { loadShared } from '../utils/projectShareService'
import EditorShell from '../layout/EditorShell'
import Loader from '../../components/ui/Loader'
import './ViewProjectScreen.css'

/**
 * Компонент для просмотра shared проекта в режиме read-only
 */
export default function ViewProjectScreen({ shareId }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [timelineHidden, setTimelineHidden] = useState(false)
  const swipeStartRef = useRef(null)

  useEffect(() => {
    if (!shareId) {
      setError('Share ID is required')
      setLoading(false)
      return
    }

    async function loadProject() {
      try {
        setLoading(true)
        const loadedProject = await loadShared(shareId)
        setProject(loadedProject)
        setError(null)
      } catch (err) {
        console.error('ViewProjectScreen: Error loading shared project', err)
        setError(err.message || 'Failed to load shared project')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [shareId])

  // Обработка свайпов для скрытия/показа шапки и подвала
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        swipeStartRef.current = {
          y: e.touches[0].clientY,
          time: Date.now()
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!swipeStartRef.current || e.touches.length !== 1) return

      const currentY = e.touches[0].clientY
      const dy = currentY - swipeStartRef.current.y
      const screenHeight = window.innerHeight
      const threshold = 50

      // Свайп вниз (от верха) - скрыть шапку
      if (swipeStartRef.current.y < screenHeight * 0.2 && dy > threshold && !headerHidden) {
        setHeaderHidden(true)
        swipeStartRef.current = null
      }
      // Свайп вверх (от верха) - показать шапку
      else if (swipeStartRef.current.y < screenHeight * 0.2 && dy < -threshold && headerHidden) {
        setHeaderHidden(false)
        swipeStartRef.current = null
      }
      // Свайп вверх (от низа) - скрыть таймлайн
      else if (swipeStartRef.current.y > screenHeight * 0.8 && dy < -threshold && !timelineHidden) {
        setTimelineHidden(true)
        swipeStartRef.current = null
      }
      // Свайп вниз (от низа) - показать таймлайн
      else if (swipeStartRef.current.y > screenHeight * 0.8 && dy > threshold && timelineHidden) {
        setTimelineHidden(false)
        swipeStartRef.current = null
      }
    }

    const handleTouchEnd = () => {
      swipeStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [headerHidden, timelineHidden])

  if (loading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="view-project-screen view-project-error">
        <div className="view-project-error-content">
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="view-project-btn"
          >
            Вернуться в редактор
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="view-project-screen view-project-error">
        <div className="view-project-error-content">
          <h2>Проект не найден</h2>
          <p>Проект с указанным ID не существует или был удален.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="view-project-btn"
          >
            Вернуться в редактор
          </button>
        </div>
      </div>
    )
  }

  // В режиме просмотра передаем пустые функции для onChangeProject
  // чтобы предотвратить редактирование
  const handleChangeProject = () => {
    // В режиме просмотра изменения запрещены
    console.log('ViewProjectScreen: Editing is disabled in view mode')
  }

  return (
    <div className="view-project-screen">
      {/* Баннер режима просмотра */}
      <div className={`view-project-banner ${headerHidden ? 'view-project-banner-hidden' : ''}`}>
        <span className="view-project-banner-icon">👁️</span>
        <span className="view-project-banner-text">Режим просмотра</span>
        <button
          onClick={() => window.location.href = '/'}
          className="view-project-banner-btn"
        >
          Открыть в редакторе
        </button>
      </div>

      {/* Редактор в режиме только просмотра */}
      <div className={`view-project-editor-wrapper ${timelineHidden ? 'view-project-timeline-hidden' : ''}`}>
        <EditorShell
          project={project}
          activeTool="background"
          onChangeTool={() => {}} // Запрещено менять инструменты
          onNewProject={() => window.location.href = '/'}
          onUndo={() => {}} // Запрещено undo
          onRedo={() => {}} // Запрещено redo
          canUndo={false}
          canRedo={false}
          onChangeProject={handleChangeProject}
          onAccount={() => {}}
          onOpenBaza={() => {}}
          isReadOnly={true} // Флаг для отключения редактирования
          isCleanView={false}
          onToggleCleanView={() => {}}
        />
      </div>
    </div>
  )
}

