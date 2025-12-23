// src/editorV2/modals/ExportModal.jsx

import React, { useState, useEffect } from 'react'
import { getUserProfile } from '../../services/userService'
import { detectExportKind } from '../utils/detectExportKind'

// Список категорий для BAZAR
const BAZAR_CATEGORIES = [
  { id: "patriot", label: "Патриот" },
  { id: "music", label: "Музыка" },
  { id: "clip", label: "Клип" },
  { id: "ads", label: "Реклама" },
  { id: "history", label: "История" },
  { id: "intro", label: "Интро" },
  { id: "travel", label: "Трип" },
  { id: "blog", label: "Блог" },
  { id: "education", label: "Учеба" },
  { id: "female", label: "Женские" },
  { id: "sport", label: "Спорт" },
  { id: "entertainment", label: "Развлечение" },
  { id: "news", label: "Новости" },
  { id: "hobby", label: "Хобби" },
  { id: "humor", label: "Юмор" },
  { id: "games", label: "Игры" }
]

const VIDEO_FORMATS = [
  { id: '720p', label: 'MP4 В· 720p', premium: false, resolution: '720p' },
  { id: '1080p', label: 'MP4 В· 1080p', premium: true, resolution: '1080p' },
]

const PHOTO_FORMATS = [
  { id: 'jpeg', label: 'JPEG', premium: false },
  { id: 'png', label: 'PNG', premium: false },
  { id: 'png-transparent', label: 'PNG (прозрачный)', premium: true },
  { id: 'svg', label: 'SVG', premium: true },
]

export default function ExportModal({ 
  open, 
  onClose, 
  onExport, 
  project 
}) {
  const [selectedFormat, setSelectedFormat] = useState('720p')
  const [publishOption, setPublishOption] = useState(null) // 'bazar' | 'drafts' | null
  const [allowOpenProject, setAllowOpenProject] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('all')
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDurationWarning, setShowDurationWarning] = useState(false)

  // Определяем тип проекта (видео или фото) с помощью detectExportKind
  const exportKind = project ? detectExportKind(project) : 'image'
  const isVideo = exportKind === 'video'
  const formats = isVideo ? VIDEO_FORMATS : PHOTO_FORMATS

  // Вычисляем длительность проекта в секундах
  const getProjectDurationSeconds = () => {
    if (!project) return 0
    
    // Приоритет: timeline.projectDuration (в секундах)
    if (project.timeline?.projectDuration) {
      return project.timeline.projectDuration
    }
    
    // Альтернатива: durationMs (в миллисекундах) / 1000
    if (project.durationMs) {
      return project.durationMs / 1000
    }
    
    // Если нет явной длительности, вычисляем из timeline
    if (project.timeline?.clips && project.timeline.clips.length > 0) {
      const maxEnd = Math.max(
        ...project.timeline.clips.map(clip => (clip.startTime || 0) + (clip.duration || 0))
      )
      return maxEnd || 0
    }
    
    return 0
  }

  const durationSeconds = getProjectDurationSeconds()
  const MAX_DURATION_SECONDS = 5 * 60 // 5 минут
  const isDurationExceeded = durationSeconds > MAX_DURATION_SECONDS

  // Загружаем профиль пользователя для проверки плана
  useEffect(() => {
    if (open) {
      loadUserProfile()
      // Устанавливаем название по умолчанию
      if (project?.name) {
        setTitle(project.name)
      }
      // Устанавливаем формат по умолчанию в зависимости от типа проекта
      if (exportKind === 'video') {
        setSelectedFormat('720p')
      } else {
        setSelectedFormat('jpeg')
      }
      // Сбрасываем опции публикации
      setPublishOption(null)
      setAllowOpenProject(false)
      setDescription('')
      setCategory('all')
    }
  }, [open, project, exportKind])

  const loadUserProfile = async () => {
    try {
      const { getCurrentUser } = await import('../../services/userService')
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        if (profile) {
          // Проверяем, есть ли активный премиум план
          const hasPremium = profile.current_plan !== null && 
            (profile.is_lifetime || 
             (profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()))
          setIsPremium(hasPremium)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleFormatSelect = (formatId) => {
    const format = formats.find(f => f.id === formatId)
    if (!format) return

    // Если формат премиумный и пользователь не премиум - показываем модалку
    if (format.premium && !isPremium) {
      // TODO: Показать модалку "Перейти на PREMIUM"
      alert('Этот формат доступен только для PREMIUM пользователей')
      return
    }

    setSelectedFormat(formatId)
  }

  const handlePublishOptionChange = (option) => {
    setPublishOption(option === publishOption ? null : option)
  }

  const handleExport = () => {
    if (!onExport) return

    // Проверка длительности перед экспортом
    if (isDurationExceeded) {
      setShowDurationWarning(true)
      return
    }

    const exportData = {
      format: selectedFormat,
      publishOption, // 'bazar' | 'drafts' | null
      allowOpenProject,
      title: title.trim() || project?.name || 'DM Project',
      description: description.trim() || null,
      category: category !== 'all' ? category : null,
    }

    onExport(exportData)
  }

  if (!open) return null

  return (
    <div className="editor-v2-modal-backdrop dm-modal-enter">
      <div className="editor-v2-modal editor-v2-modal-glass">
        <div className="editor-v2-modal-body">
          <div className="editor-v2-modal-right">
            <div className="editor-v2-modal-header-block">
              <h2 className="editor-v2-modal-title">Экспорт и публикация</h2>
              <p className="editor-v2-modal-desc">
                Выберите формат и настройки публикации
              </p>
            </div>

            <div className="editor-v2-modal-content">
            {/* Предупреждение о длительности */}
            {isVideo && isDurationExceeded && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#ff6b6b',
                fontSize: '13px',
                lineHeight: '1.5'
              }}>
                Проект превышает максимальную длительность (5 минут). Экспорт недоступен.
              </div>
            )}

            {/* Блок "Формат" */}
            <div className="editor-v2-modal-section">
              <h3 className="editor-v2-modal-subtitle">
                {isVideo ? 'Формат видео' : 'Формат изображения'}
              </h3>
              <div className="editor-v2-option-column">
                {formats.map((format) => {
                  const isSelected = selectedFormat === format.id
                  const isLocked = format.premium && !isPremium
                  
                  return (
                    <button
                      key={format.id}
                      type="button"
                      className={
                        'editor-v2-option-pill ' +
                        (isSelected ? 'editor-v2-option-pill-active' : '') +
                        (isLocked ? 'editor-v2-option-pill-locked' : '')
                      }
                      onClick={() => handleFormatSelect(format.id)}
                      disabled={isLocked}
                    >
                      <div className="editor-v2-option-pill-left">
                        <span className="editor-v2-option-pill-label">
                          {format.label}
                        </span>
                        {format.premium && (
                          <span className="editor-v2-premium-badge">🔒 Premium</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Блок "После экспорта" */}
            <div className="editor-v2-modal-section">
              <h3 className="editor-v2-modal-subtitle">После экспорта</h3>
              
              {/* Радио-выбор публикации */}
              <div className="editor-v2-option-column">
                <button
                  type="button"
                  className={
                    'editor-v2-option-pill ' +
                    (publishOption === null ? 'editor-v2-option-pill-active' : '')
                  }
                  onClick={() => handlePublishOptionChange(null)}
                >
                  <div className="editor-v2-option-pill-left">
                    <span className="editor-v2-option-pill-label">
                      Только скачать файл
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={
                    'editor-v2-option-pill ' +
                    (publishOption === 'bazar' ? 'editor-v2-option-pill-active' : '')
                  }
                  onClick={() => handlePublishOptionChange('bazar')}
                >
                  <div className="editor-v2-option-pill-left">
                    <span className="editor-v2-option-pill-label">
                      Отправить в MEDIA BAZAR
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={
                    'editor-v2-option-pill ' +
                    (publishOption === 'drafts' ? 'editor-v2-option-pill-active' : '')
                  }
                  onClick={() => handlePublishOptionChange('drafts')}
                >
                  <div className="editor-v2-option-pill-left">
                    <span className="editor-v2-option-pill-label">
                      Сохранить в черновики
                    </span>
                  </div>
                </button>
              </div>

              {/* Чекбокс "Разрешить открыть проект" */}
              <div className="editor-v2-modal-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={allowOpenProject}
                    onChange={(e) => setAllowOpenProject(e.target.checked)}
                  />
                  <span>Разрешить открыть проект как шаблон</span>
                </label>
              </div>
            </div>

            {/* Поля для публикации (показываются только если выбрана публикация) */}
            {(publishOption === 'bazar' || publishOption === 'drafts') && (
              <div className="editor-v2-modal-section">
                <h3 className="editor-v2-modal-subtitle">Информация о публикации</h3>
                
                {/* Название */}
                <div className="editor-v2-modal-field">
                  <label>Название</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Название проекта"
                    maxLength={100}
                  />
                </div>

                {/* Описание */}
                <div className="editor-v2-modal-field">
                  <label>Описание (необязательно)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание проекта"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Категория */}
                <div className="editor-v2-modal-field">
                  <label>Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Все</option>
                    {BAZAR_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            </div>

            <div className="editor-v2-modal-footer">
              <button
                type="button"
                className="editor-v2-modal-btn editor-v2-modal-btn-ghost"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type="button"
                className="editor-v2-modal-btn editor-v2-modal-btn-primary"
                onClick={handleExport}
                disabled={isLoading || isDurationExceeded}
                title={isDurationExceeded ? 'Проект слишком длинный (максимум 5 минут)' : ''}
              >
                {isLoading ? 'Экспорт...' : 'Экспортировать'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка предупреждения о длительности */}
      {showDurationWarning && (
        <div className="editor-v2-modal-backdrop" style={{ zIndex: 10000 }} onClick={() => setShowDurationWarning(false)}>
          <div className="editor-v2-modal editor-v2-modal-glass" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="editor-v2-modal-body" style={{ gridTemplateColumns: '1fr' }}>
              <div className="editor-v2-modal-header-block">
                <h2 className="editor-v2-modal-title" style={{ color: '#ff6b6b' }}>Слишком длинный проект</h2>
                <p className="editor-v2-modal-desc">
                  Максимальная длительность видео для экспорта - 5 минут. Укоротите проект или разделите его на части.
                </p>
                <p className="editor-v2-modal-desc" style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Текущая длительность: {Math.floor(durationSeconds / 60)}:{String(Math.floor(durationSeconds % 60)).padStart(2, '0')}
                </p>
              </div>
              <div className="editor-v2-modal-footer">
                <button
                  type="button"
                  className="editor-v2-modal-btn editor-v2-modal-btn-primary"
                  onClick={() => setShowDurationWarning(false)}
                >
                  Понял
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

