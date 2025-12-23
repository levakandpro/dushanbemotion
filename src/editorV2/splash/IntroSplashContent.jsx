// src/editorV2/splash/IntroSplashContent.jsx
import React, { useEffect, useState, useRef } from 'react'
import '../styles/editorV2-mobile.css'
import intro1 from '../../assets/flashintro/intro (1).mp4'
import intro2 from '../../assets/flashintro/intro (2).mp4'
import intro3 from '../../assets/flashintro/intro (3).mp4'
import intro4 from '../../assets/flashintro/intro (4).mp4'
import intro5 from '../../assets/flashintro/intro (5).mp4'
import intro6 from '../../assets/flashintro/intro (6).mp4'
import intro7 from '../../assets/flashintro/intro (7).mp4'
import intro8 from '../../assets/flashintro/intro (8).mp4'
import intro9 from '../../assets/flashintro/intro (9).mp4'
import intro10 from '../../assets/flashintro/intro (10).mp4'
import intro11 from '../../assets/flashintro/intro (11).mp4'
import intro12 from '../../assets/flashintro/intro (12).mp4'
import intro13 from '../../assets/flashintro/intro (13).mp4'
import intro14 from '../../assets/flashintro/intro (14).mp4'
import intro15 from '../../assets/flashintro/intro (15).mp4'
import intro16 from '../../assets/flashintro/intro (16).mp4'

const HERO_VIDEOS = [
  intro1, intro2, intro3, intro4,
  intro5, intro6, intro7, intro8,
  intro9, intro10, intro11, intro12,
  intro13, intro14, intro15, intro16
]

export default function IntroSplashContent({ onButtonClick }) {
  const staticSubtitle = 'Анимируй PNG и экспортируй на зелёном фоне - готово для TikTok и YouTube'
  const [slogan, setSlogan] = useState(staticSubtitle)
  const titleRef = useRef(null)
  const videoRef = useRef(null)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [videoError, setVideoError] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const revealTimerRef = useRef(null)
  const hasNavigatedRef = useRef(false)

  const slogans = [
    "D·MOTION открывает доступ к 42+ миллионам авторских стикеров",
    "Твой универсальный Персидско-Таджикский media-конструктор",
    "Визуальный хаб Таджикско-Персидских элементов",
    "Культура в слоях, стиль в каждом кадре",
    "Твой движок восточного дизайна",
    "600+ тысяч PNG, футажей, рамок и шрифтов для Таджикско-Персидского контента",
    "Конструктор, который знает твою культуру: стикеры, футажи, текст-шаблоны",
    "Анимируй PNG и экспортируй на зелёном фоне - готово для TikTok и YouTube",
    "1+ миллион фонов и шаблонов в едином редакторе",
    "От национальной истории до современного дизайна - создавай как топ-студии",
    "Tajik-Persian Creative Hub",
    "Все национальные элементы на прозрачном фоне - орнаменты и рамки",
    "Восточная культура в формате PNG"
  ]

  useEffect(() => {
    // Фиксированный слоган по требованию
    setSlogan(staticSubtitle)

    // Анимация переворота букв DUSHANBE MOTION
    if (titleRef.current) {
      const titleText = 'DUSHANBE MOTION'
      const letters = titleText.split('').map((char, index) => {
        const span = document.createElement('span')
        span.textContent = char === ' ' ? '\u00A0' : char
        span.style.animationDelay = `${index * 0.08}s`
        return span
      })
      
      titleRef.current.textContent = ''
      letters.forEach(span => titleRef.current.appendChild(span))
    }

    // Подсказки всегда показываются при загрузке страницы
    // Не сохраняем в localStorage, чтобы они появлялись при каждом обновлении

    // Случайный выбор видео с защитой от повторов подряд
    const pickVideo = () => {
      if (!HERO_VIDEOS.length) return null
      const last = localStorage.getItem('dm-hero-last')
      let next = HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]
      if (HERO_VIDEOS.length > 1 && last && next === last) {
        const alternatives = HERO_VIDEOS.filter(v => v !== last)
        next = alternatives[Math.floor(Math.random() * alternatives.length)]
      }
      localStorage.setItem('dm-hero-last', next)
      return next
    }

    const nextVideo = pickVideo()
    if (nextVideo) {
      setCurrentVideo(nextVideo)
    }

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
      }
    }
  }, [])

  const handleVideoPlay = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    revealTimerRef.current = setTimeout(() => {
      setShowButton(true)
    }, 3000)
  }

  const navigateOnce = () => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    onButtonClick()
  }

  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el) return
    if (el.currentTime >= 3) {
      setShowButton(true)
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
      }
    }
  }

  const handleVideoError = () => {
    setVideoError(true)
    setShowButton(true)
  }

  const handleLoadedData = () => {
    setVideoReady(true)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleLoadedMetadata = () => {
    // Форсим отрисовку первого кадра сразу после загрузки метаданных
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0.000001
      } catch (e) {}
      videoRef.current.play().catch(() => {})
    }
  }

  // Попытка моментально стартовать воспроизведение после установки src
  useEffect(() => {
    if (videoRef.current && currentVideo && !videoError) {
      requestAnimationFrame(() => {
        videoRef.current?.play()?.catch(() => {})
      })
    }
  }, [currentVideo, videoError])

  return (
    <>
      <style>{`
        .dm-intro-splash {
          position: fixed;
          inset: 0;
          z-index: 9999 !important;
          background: radial-gradient(ellipse at center, #0a1f1a 0%, #061410 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          perspective: 1000px;
          opacity: 1;
          transform: scale(1);
          filter: blur(0px);
          transition: 
            opacity 0.25s ease,
            background 0.25s ease;
        }

        .dm-intro-splash-fading {
          opacity: 0;
          transform: scale(1);
          filter: blur(0);
          background: radial-gradient(ellipse at center, #061410 0%, #000000 100%);
          pointer-events: none;
        }
        
        /* Декоративное свечение в центре */
        .dm-intro-splash::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(61, 191, 160, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulseGlow 3s ease-in-out infinite;
          pointer-events: none;
        }
        
        .dm-intro-splash-fading::before {
          opacity: 0;
          transform: scale(2);
          transition: 
            opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .dm-intro-splash .container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 10;
          transition: 
            transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          padding-top: 330px;
        }
        
        .dm-intro-splash-fading .container {
          transform: scale(0.9) translateY(-30px);
          opacity: 0;
        }

        .dm-intro-splash .title {
          font-size: 24px;
          letter-spacing: 8px;
          font-weight: 300;
          text-transform: uppercase;
          margin-top: 10px;
          display: inline-block;
          background: linear-gradient(
            135deg,
            rgba(184, 134, 11, 0.9) 0%,
            rgba(218, 165, 32, 0.8) 25%,
            rgba(184, 134, 11, 0.7) 50%,
            rgba(139, 101, 8, 0.8) 75%,
            rgba(184, 134, 11, 0.9) 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInDown 1.2s ease-out 0.3s both, goldShimmer 4s ease-in-out infinite;
        }

        @keyframes goldShimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .dm-intro-splash .title span {
          display: inline-block;
          animation: flipLetter 0.6s ease-in-out forwards, goldShimmer 4s ease-in-out infinite;
          opacity: 0;
          transform: rotateY(90deg);
          background: linear-gradient(
            135deg,
            rgba(184, 134, 11, 0.9) 0%,
            rgba(218, 165, 32, 0.8) 25%,
            rgba(184, 134, 11, 0.7) 50%,
            rgba(139, 101, 8, 0.8) 75%,
            rgba(184, 134, 11, 0.9) 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        @keyframes flipLetter {
          0% {
            opacity: 0;
            transform: rotateY(90deg);
            -webkit-text-fill-color: transparent;
          }
          50% {
            opacity: 1;
            transform: rotateY(0deg);
            -webkit-text-fill-color: transparent;
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg);
            -webkit-text-fill-color: transparent;
          }
        }

        .dm-intro-splash .subtitle {
          font-size: 15px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.6);
          max-width: 700px;
          text-align: center;
          line-height: 1.6;
          letter-spacing: 0.5px;
          animation: fadeInUp 1.2s ease-out 0.6s both;
          margin-top: -10px;
        }

        .dm-intro-splash .premium-button {
          margin-top: 72px;
          padding: 36px 140px;
          font-size: 64px;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(230, 237, 234, 0.9);
          background: rgba(10, 31, 26, 0.4);
          border: 1px solid rgba(42, 124, 105, 0.3);
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 1.2s ease-out 0.9s both;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 -1px 2px rgba(61, 191, 160, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dm-intro-splash .premium-button.premium-button-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(8px);
          animation: none !important;
          transition: opacity 180ms ease-out, transform 180ms ease-out;
        }

        .dm-intro-splash .premium-button.premium-button-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
          transition: opacity 220ms ease-out, transform 220ms ease-out;
        }

        .dm-intro-splash .premium-button:hover {
          background: rgba(10, 31, 26, 0.5);
          border-color: rgba(42, 124, 105, 0.4);
          color: rgba(230, 237, 234, 1);
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.35),
            inset 0 -1px 2px rgba(61, 191, 160, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dm-intro-splash .premium-button:active {
          box-shadow: 
            inset 0 3px 6px rgba(0, 0, 0, 0.4),
            inset 0 -1px 1px rgba(61, 191, 160, 0.1);
          transform: translateY(1px);
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Шапка */
        .dm-splash-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10001;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(-100%);
        }

        .dm-intro-splash.dm-intro-splash-header-visible .dm-splash-header {
          transform: translateY(0);
        }

        .dm-splash-header-content {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dm-splash-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dm-splash-header-logo {
          opacity: 0.95;
        }

        .dm-splash-header-title {
          font-size: 16px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 1px;
        }

        .dm-splash-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dm-splash-header-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }

        .dm-splash-header-btn:hover {
          color: #3dbfa0;
          border-color: #3dbfa0;
          background: rgba(61, 191, 160, 0.1);
        }

        .dm-splash-header-btn-primary {
          background: #3dbfa0;
          border-color: #3dbfa0;
          color: #061410;
        }

        .dm-splash-header-btn-primary:hover {
          background: #4dd4b3;
          border-color: #4dd4b3;
          color: #061410;
        }

        /* Подвал */
        .dm-splash-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10001;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(100%);
          opacity: 0;
          pointer-events: none;
        }

        .dm-intro-splash.dm-intro-splash-footer-visible .dm-splash-footer {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .dm-splash-footer-content {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.85);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          flex-wrap: wrap;
        }

        .dm-splash-footer-link {
          background: none;
          border: none;
          padding: 0;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: inherit;
        }

        .dm-splash-footer-link:hover {
          color: #3dbfa0;
        }

        .dm-splash-footer-separator {
          color: rgba(255, 255, 255, 0.2);
        }

        /* Блок соцсетей в футере */
        .dm-splash-footer-social-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          opacity: 0.75;
          text-transform: none;
          letter-spacing: normal;
        }

        .dm-splash-footer-social-icons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dm-splash-footer-social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.4);
          opacity: 0.7;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .dm-splash-footer-social-icon:hover {
          color: #3dbfa0;
          opacity: 1;
        }

        .dm-splash-footer-social-icon svg {
          width: 16px;
          height: 16px;
        }

        /* МОДАЛКИ ФУТЕРА */
        .dm-footer-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          backdrop-filter: blur(12px);
          animation: dm-footer-modal-fade-in 0.2s ease-out;
        }

        @keyframes dm-footer-modal-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dm-footer-modal {
          position: relative;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          border-radius: 16px;
          padding: 24px;
          background: rgba(4, 16, 16, 0.98);
          border: 1px solid rgba(60, 140, 120, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          animation: dm-footer-modal-slide-up 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          overflow-y: auto;
        }

        @keyframes dm-footer-modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(25px) scale(0.97);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .dm-footer-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: rgba(195, 230, 222, 0.6);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        }

        .dm-footer-modal-close:hover {
          color: #3dbfa0;
          background: rgba(61, 191, 160, 0.1);
        }

        .dm-footer-modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #e8f4f4;
          letter-spacing: -0.01em;
        }

        .dm-footer-modal-body {
          margin-bottom: 16px;
        }

        .dm-footer-modal-text {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(195, 230, 222, 0.9);
          margin: 0 0 12px 0;
        }

        .dm-footer-modal-text:last-child {
          margin-bottom: 0;
        }

        .dm-footer-modal-contacts {
          margin: 16px 0;
          padding: 12px;
          background: rgba(4, 16, 16, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(60, 140, 120, 0.2);
        }

        .dm-footer-modal-contact-item {
          margin: 0 0 8px 0;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(195, 230, 222, 0.9);
        }

        .dm-footer-modal-contact-item:last-child {
          margin-bottom: 0;
        }

        .dm-footer-modal-contact-item strong {
          color: #3dbfa0;
          font-weight: 600;
        }

        .dm-footer-modal-social {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
          padding-top: 12px;
          border-top: 1px solid rgba(60, 140, 120, 0.15);
        }

        .dm-footer-modal-social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(4, 16, 16, 0.4);
          border: 1px solid rgba(60, 140, 120, 0.2);
          color: rgba(195, 230, 222, 0.7);
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .dm-footer-modal-social-link:hover {
          background: rgba(61, 191, 160, 0.15);
          border-color: rgba(61, 191, 160, 0.4);
          color: #3dbfa0;
          transform: translateY(-2px);
        }

        .dm-footer-modal-social-link svg {
          width: 18px;
          height: 18px;
        }

        .dm-footer-modal-note {
          margin: 12px 0 0 0;
          font-size: 10px;
          line-height: 1.4;
          color: rgba(195, 230, 222, 0.5);
        }

        .dm-footer-modal-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .dm-footer-modal-list li {
          padding: 8px 0;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(195, 230, 222, 0.9);
          border-bottom: 1px solid rgba(60, 140, 120, 0.1);
        }

        .dm-footer-modal-list li:last-child {
          border-bottom: none;
        }

        .dm-footer-modal-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(60, 140, 120, 0.2);
          display: flex;
          justify-content: flex-end;
        }

        .dm-footer-modal-btn {
          padding: 10px 20px;
          border-radius: 8px;
          background: rgba(61, 191, 160, 0.15);
          border: 1px solid rgba(61, 191, 160, 0.4);
          color: #3dbfa0;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .dm-footer-modal-btn:hover {
          background: rgba(61, 191, 160, 0.25);
          border-color: rgba(61, 191, 160, 0.6);
        }

        /* Подсказки о свайпах - минималистичный дизайн */
        .dm-splash-hints {
          position: fixed;
          inset: 0;
          z-index: 10002 !important;
          pointer-events: auto;
          animation: fadeInHints 1s ease-out 1.5s both;
        }

        .dm-splash-hints-hidden {
          opacity: 0 !important;
          pointer-events: none;
          transition: opacity 0.5s ease-out;
        }

        @keyframes fadeInHints {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dm-splash-hint {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dm-splash-hint:hover {
          opacity: 0.7;
        }

        .dm-splash-hint-top {
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          animation: floatDown 3s ease-in-out infinite;
        }

        .dm-splash-hint-bottom {
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          animation: floatUp 3s ease-in-out infinite;
        }

        @keyframes floatDown {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(6px);
          }
        }

        @keyframes floatUp {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-6px);
          }
        }

        .dm-splash-hint-line {
          width: 1.5px;
          height: 40px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.3) 30%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 100%
          );
          position: relative;
        }

        .dm-splash-hint-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }

        .dm-splash-hint-bottom .dm-splash-hint-line {
          background: linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.3) 30%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 100%
          );
        }

        .dm-splash-hint-bottom .dm-splash-hint-line::before {
          top: auto;
          bottom: 0;
        }

        .dm-splash-hint-arrow {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .dm-splash-hint-arrow::before {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          border-right: 2px solid rgba(255, 255, 255, 0.7);
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
          transform: rotate(45deg);
          animation: pulseArrow 2s ease-in-out infinite;
        }

        .dm-splash-hint-bottom .dm-splash-hint-arrow::before {
          transform: rotate(-135deg);
        }

        @keyframes pulseArrow {
          0%, 100% {
            opacity: 0.5;
            transform: rotate(45deg) scale(1);
          }
          50% {
            opacity: 1;
            transform: rotate(45deg) scale(1.2);
          }
        }

        .dm-splash-hint-bottom .dm-splash-hint-arrow::before {
          animation: pulseArrowUp 2s ease-in-out infinite;
        }

        @keyframes pulseArrowUp {
          0%, 100% {
            opacity: 0.5;
            transform: rotate(-135deg) scale(1);
          }
          50% {
            opacity: 1;
            transform: rotate(-135deg) scale(1.2);
          }
        }

        .dm-splash-hint-text {
          padding: 4px 10px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          white-space: nowrap;
          font-family: 'Inter', system-ui, sans-serif;
          transition: color 0.3s ease;
        }

        .dm-splash-hint:hover .dm-splash-hint-text {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <style>{`
        .dm-intro-video-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background: radial-gradient(ellipse at center, #0a1f1a 0%, #061410 100%);
        }

        .dm-intro-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.9;
          filter: saturate(1.05) contrast(1.05);
          will-change: opacity;
          transition: opacity 80ms ease-out;
        }

        .dm-intro-video-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.35) 0%,
            rgba(0, 0, 0, 0.55) 40%,
            rgba(0, 0, 0, 0.65) 100%
          );
          mix-blend-mode: normal;
        }

        .dm-intro-video-bg-fallback .dm-intro-video {
          display: none;
        }
      `}</style>

      <div className={`dm-intro-video-bg ${videoError ? 'dm-intro-video-bg-fallback' : ''}`}>
        {currentVideo && !videoError && (
          <video
            ref={videoRef}
            className="dm-intro-video"
            src={currentVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            controls={false}
            loop={false}
            onPlay={handleVideoPlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={handleLoadedData}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={navigateOnce}
            onError={handleVideoError}
            style={{ opacity: videoReady ? 1 : 0 }}
          />
        )}
        <div className="dm-intro-video-overlay" />
      </div>

      <div className="container">
        <div className="title" ref={titleRef}>DUSHANBE MOTION</div>
        <div className="subtitle">{slogan}</div>
        <button
          className={`premium-button ${showButton || videoError ? 'premium-button-visible' : 'premium-button-hidden'}`}
          type="button"
          onClick={navigateOnce}
        >
          БА ПЕШ
        </button>
      </div>
    </>
  )
}

