import React, { useRef, useEffect, useState } from 'react'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import LogoFiol from '../../assets/icons/logofiol.svg'
import LionIcon from '../../assets/lion.svg'
import { exportCanvas } from '../utils/canvasExport'
import { getUserProfile, getCurrentUser } from '../../services/userService'
import { useToast } from '../context/ToastContext'
import { subscribeToStats, startPresenceHeartbeat, stopPresenceHeartbeat } from '../../services/statsService'
import MobileBackButton from '../components/MobileBackButton'

export default function HeaderBar({
  onAccount,
  hasContent,
  showHistoryControls,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showDownloadDropdown,
  setShowDownloadDropdown,
  downloadDropdownRef,
  canExportSVG,
  projectName,
}) {
  const toast = useToast()
  const navigate = useNavigate()
  const logoIconRef = useRef(null)
  const [showDownloadsMenu, setShowDownloadsMenu] = useState(false)
  const downloadsMenuRef = useRef(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  // Начальные значения - будут обновлены из БД
  const [siteStats, setSiteStats] = useState({ users: 0, online: 1 })

  // Проверяем PREMIUM статус пользователя
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          if (profile) {
            const hasPremium = profile.current_plan !== null && 
              (profile.is_lifetime || 
               (profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()))
            setIsPremium(hasPremium)
          }
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    }
    checkPremium()
  }, [])

  // Загружаем статистику сайта и запускаем heartbeat
  useEffect(() => {
    // Подписываемся на обновления статистики
    const unsubscribe = subscribeToStats((stats) => {
      // НИКОГДА не устанавливаем 0, если данные невалидны
      if (stats && typeof stats.users === 'number' && stats.users >= 0) {
        setSiteStats(stats)
      }
    })
    
    // Запускаем автоматический heartbeat присутствия
    const startHeartbeat = async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient')
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          startPresenceHeartbeat(user.id)
        }
      } catch (e) {
        console.warn('[HeaderBar] Не удалось запустить heartbeat:', e)
      }
    }
    
    startHeartbeat()
    
    return () => {
      unsubscribe()
      stopPresenceHeartbeat()
    }
  }, [])

  // Обработчик экспорта
  const handleExport = async (format) => {
    setShowDownloadDropdown(false)
    
    // SVG только для PREMIUM
    if (format === 'svg' && !isPremium) {
      navigate('/pricing')
      return
    }

    // Формируем имя файла
    const safeName = projectName 
      ? projectName.replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '').trim().slice(0, 50) 
      : ''
    const filename = safeName ? `dmotion_${safeName}` : `dmotion_${Date.now()}`
    const ext = format === 'jpeg' ? 'jpg' : format

    setIsExporting(true)
    try {
      const success = await exportCanvas(format, filename)
      if (success) {
        toast.show({ type: 'success', message: `Скачано: ${filename}.${ext}` })
      } else {
        toast.show({ type: 'error', message: `Не удалось скачать ${filename}.${ext}` })
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.show({ type: 'error', message: `Не удалось скачать ${filename}.${ext}` })
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadsMenuRef.current && !downloadsMenuRef.current.contains(event.target)) {
        setShowDownloadsMenu(false)
      }
      if (downloadDropdownRef && downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setShowDownloadDropdown(false)
      }
    }

    if (showDownloadsMenu || showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadsMenu, showDownloadDropdown, downloadDropdownRef])

  // Премиальная Motion анимация - редкий запуск, чтобы не мешать градиенту
  useEffect(() => {
    if (!logoIconRef.current) return

    const triggerMotion = () => {
      const icon = logoIconRef.current
      if (!icon) return

      // Добавляем класс для анимации
      icon.classList.add('logo-icon-motion')
      
      // Убираем класс после анимации
      setTimeout(() => {
        icon.classList.remove('logo-icon-motion')
      }, 3000)
    }

    // Случайный редкий интервал 420–600 секунд (~7–10 минут)
    let timeoutId
    const scheduleNext = () => {
      const delay = 420000 + Math.random() * 180000 // 420-600 сек
      timeoutId = setTimeout(() => {
        triggerMotion()
        scheduleNext()
      }, delay)
    }

    // Первый запуск тоже отложен на 7–10 минут
    const initialDelay = 420000 + Math.random() * 180000
    timeoutId = setTimeout(() => {
      triggerMotion()
      scheduleNext()
    }, initialDelay)

    return () => clearTimeout(timeoutId)
  }, [])

  // Music playing indicator (визуально, без анализа аудио)
  useEffect(() => {
    const onPlayback = (e) => {
      const next = !!e?.detail?.isPlaying
      setIsMusicPlaying(next)
    }
    window.addEventListener('dm:music:playback', onPlayback)
    return () => window.removeEventListener('dm:music:playback', onPlayback)
  }, [])

  return (
    <header className="editor-v2-header">
      {/* ЛЕВО: логотип */}
      <div className="editor-v2-header-left">
        {/* Кнопка назад для мобильных */}
        <MobileBackButton onClick={() => navigate('/')} />
        
        <div
          ref={logoIconRef}
          aria-label="DM"
          className="editor-v2-logo-icon"
          style={{
            width: 20,
            height: 20,
            cursor: 'pointer',
            WebkitMaskImage: `url(${LogoFiol})`,
            maskImage: `url(${LogoFiol})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
          onClick={handleLogoClick}
        />

        <div 
          className="editor-v2-logo-wrapper"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          <span className="editor-v2-logo">MOTION</span>
        </div>

        {/* Playing indicator (появляется только когда играет музыка) */}
        <div
          className={`dm-playing-indicator ${isMusicPlaying ? 'dm-playing-indicator-on' : ''}`}
          aria-hidden={!isMusicPlaying}
        >
          <span className="dm-playing-bar" />
          <span className="dm-playing-bar" />
          <span className="dm-playing-bar" />
          <span className="dm-playing-bar" />
        </div>

        {/* Undo / Redo (показывать только когда на канвасе есть слои) */}
        {showHistoryControls && (
          <div className="editor-v2-header-history">
            <button
              type="button"
              className="editor-v2-header-history-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Назад"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M8.5 5L4 9.5l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 9.5H11.5c3 0 4.5 1.5 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="editor-v2-header-history-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Вперёд"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M11.5 5L16 9.5 11.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.5 9.5H8.5c-3 0-4.5 1.5-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ЦЕНТР: навигационные кнопки */}
      <div className="editor-v2-header-center">
        <NavLink to="/bazar" className="editor-v2-header-nav-btn">
          BAZAR
        </NavLink>
        <div 
          className={`editor-v2-header-downloads ${showDownloadsMenu ? 'editor-v2-header-downloads-open' : ''}`}
          ref={downloadsMenuRef}
        >
          <button
            type="button"
            className="editor-v2-header-nav-btn"
            onClick={() => setShowDownloadsMenu(!showDownloadsMenu)}
          >
            ЗАГРУЗКИ
            <span className="editor-v2-header-arrow">▼</span>
          </button>
          {showDownloadsMenu && (
            <div className="editor-v2-header-downloads-menu">
              <a
                href="#android"
                className="editor-v2-header-downloads-item"
                onClick={() => setShowDownloadsMenu(false)}
              >
                <svg className="editor-v2-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7C22 8.67 21.33 8 20.5 8z" fill="#3DDC84"/>
                  <path d="M14.04 10l-1.79-3.11c-.12-.21-.37-.33-.61-.33h-1.28c-.24 0-.49.12-.61.33L8.96 10H14.04z" fill="#3DDC84"/>
                  <circle cx="9" cy="13" r="1" fill="#3DDC84"/>
                  <circle cx="15" cy="13" r="1" fill="#3DDC84"/>
                </svg>
                <span className="dm-downloads-item-text">
                  <span className="dm-downloads-item-title">Android</span>
                  <span className="dm-downloads-item-soon">СКОРО</span>
                </span>
              </a>
              <a
                href="#ios"
                className="editor-v2-header-downloads-item"
                onClick={() => setShowDownloadsMenu(false)}
              >
                <svg className="editor-v2-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/>
                </svg>
                <span className="dm-downloads-item-text">
                  <span className="dm-downloads-item-title">iOS</span>
                  <span className="dm-downloads-item-soon">СКОРО</span>
                </span>
              </a>
              <a
                href="#desktop"
                className="editor-v2-header-downloads-item"
                onClick={() => setShowDownloadsMenu(false)}
              >
                <svg className="editor-v2-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z" fill="currentColor"/>
                </svg>
                <span className="dm-downloads-item-text">
                  <span className="dm-downloads-item-title">Desktop</span>
                  <span className="dm-downloads-item-soon">СКОРО</span>
                </span>
              </a>
            </div>
          )}
        </div>
        <Link to="/pricing" className="editor-v2-header-nav-btn">
          ТАРИФЫ
        </Link>
        {hasContent && (
          <div className="editor-v2-header-downloads" ref={downloadDropdownRef}>
            <button
              type="button"
              className={`editor-v2-header-nav-btn editor-v2-header-download-btn ${isExporting ? 'editor-v2-header-download-btn--loading' : ''}`}
              onClick={() => !isExporting && setShowDownloadDropdown(!showDownloadDropdown)}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="editor-v2-spinner" />
                  Экспорт...
                </>
              ) : (
                'СКАЧАТЬ'
              )}
            </button>
            {showDownloadDropdown && (
              <div className="editor-v2-header-downloads-menu">
                <button
                  type="button"
                  className="editor-v2-header-downloads-item"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                >
                  PNG
                </button>
                <button
                  type="button"
                  className="editor-v2-header-downloads-item"
                  onClick={() => handleExport('jpeg')}
                  disabled={isExporting}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  className={`editor-v2-header-downloads-item ${!isPremium ? 'editor-v2-header-downloads-item--locked' : ''}`}
                  onClick={() => handleExport('svg')}
                  disabled={isExporting}
                >
                  SVG
                  {!isPremium && (
                    <svg className="editor-v2-lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ПРАВО: статистика + кнопка кабинета */}
      <div className="editor-v2-header-right">
        {/* Счётчики статистики */}
        <div className="dm-header-stats">
          <div className="dm-header-stats-item">
            <span className="dm-header-stats-icon">👥</span>
            <span className="dm-header-stats-value">{siteStats.users.toLocaleString()}</span>
          </div>
          <div className="dm-header-stats-item dm-header-stats-online">
            <span className="dm-header-stats-dot"></span>
            <span className="dm-header-stats-value">{siteStats.online}</span>
            <span className="dm-header-stats-label">онлайн</span>
          </div>
        </div>

        {/* Единственная кнопка "Кабинет" - для всех пользователей */}
        {onAccount && (
          <button
            type="button"
            className="editor-v2-header-btn editor-v2-header-btn-account"
            onClick={onAccount}
          >
            <span className="editor-v2-header-btn-tooltip">КАБИНЕТ</span>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="editor-v2-header-btn-icon-default"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
