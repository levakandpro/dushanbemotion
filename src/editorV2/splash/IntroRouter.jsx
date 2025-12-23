import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IntroSplash from './IntroSplash'
import MobileIntroSplash from './MobileIntroSplash'

/**
 * Роутер intro - выбирает какой экран показать:
 * - Мобильные устройства → MobileIntroSplash (всегда, пока не выберут)
 * - Десктоп → IntroSplash (обычный)
 */
export default function IntroRouter() {
  const navigate = useNavigate()
  const [showMobileIntro, setShowMobileIntro] = useState(null)

  useEffect(() => {
    // Проверяем мобильное устройство
    const isMobileDevice = window.innerWidth <= 768

    // Проверяем, выбрал ли пользователь версию ранее
    const versionPreference = localStorage.getItem('dm_version_preference')

    // Если уже выбрал → переходим сразу в редактор
    if (versionPreference) {
      navigate('/editor', { replace: true })
      return
    }

    // Если мобильное устройство и НЕ выбрана версия → показываем мобильный intro
    setShowMobileIntro(isMobileDevice)
  }, [navigate])

  // Пока решаем
  if (showMobileIntro === null) {
    return null
  }

  // Мобильный intro
  if (showMobileIntro) {
    return <MobileIntroSplash />
  }

  // Обычный intro (десктоп)
  return <IntroSplash />
}

