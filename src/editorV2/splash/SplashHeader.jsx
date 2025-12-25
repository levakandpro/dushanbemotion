// src/editorV2/splash/SplashHeader.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoFiol from '../../assets/icons/logofiol.svg'
import { useAuth } from '../../lib/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { getUserProfile } from '../../services/userService'
import AvatarPremiumSlideshow from '../../shared/components/AvatarPremiumSlideshow'
import { getAvatarUrl } from '../../shared/constants/avatars'
import './SplashHeader.css'

export default function SplashHeader({ onShowAuthModal }) {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showDownloadsMenu, setShowDownloadsMenu] = useState(false)
  const menuRef = useRef(null)
  const downloadsMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (downloadsMenuRef.current && !downloadsMenuRef.current.contains(event.target)) {
        setShowDownloadsMenu(false)
      }
    }

    if (showUserMenu || showDownloadsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showDownloadsMenu])

  const loadProfile = async () => {
    if (!user) return
    try {
      const profileData = await getUserProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    navigate('/auth/login')
  }

  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <>
      <header className="dm-splash-header">
        <div className="dm-splash-header-content">
          <div className="dm-splash-header-left">
            <Link to="/" className="dm-splash-header-logo-link">
              <img
                src={LogoFiol}
                alt="D MOTION"
                className="dm-splash-header-logo"
              />
            </Link>
          </div>
          <div className="dm-splash-header-right">
            <Link to="/pricing" className="dm-splash-header-btn">
              ТАРИФЫ
            </Link>
            <Link to="#lessons" className="dm-splash-header-btn">
              УРОКИ
            </Link>
            <div 
              className={`dm-splash-header-downloads ${showDownloadsMenu ? 'dm-splash-header-downloads-open' : ''}`}
              ref={downloadsMenuRef}
              onMouseEnter={() => setShowDownloadsMenu(true)}
              onMouseLeave={() => setShowDownloadsMenu(false)}
            >
              <button
                className="dm-splash-header-btn"
                onClick={() => setShowDownloadsMenu(!showDownloadsMenu)}
              >
                ЗАГРУЗКИ
                <span className="dm-splash-header-arrow">▼</span>
              </button>
              {showDownloadsMenu && (
                <div className="dm-splash-header-downloads-menu">
                  <a
                    href="#android"
                    className="dm-splash-header-downloads-item"
                    onClick={() => setShowDownloadsMenu(false)}
                  >
                    <svg className="dm-splash-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    className="dm-splash-header-downloads-item"
                    onClick={() => setShowDownloadsMenu(false)}
                  >
                    <svg className="dm-splash-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/>
                    </svg>
                    <span className="dm-downloads-item-text">
                      <span className="dm-downloads-item-title">iOS</span>
                      <span className="dm-downloads-item-soon">СКОРО</span>
                    </span>
                  </a>
                  <a
                    href="#desktop"
                    className="dm-splash-header-downloads-item"
                    onClick={() => setShowDownloadsMenu(false)}
                  >
                    <svg className="dm-splash-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            {!loading && (
              user ? (
                <div className="dm-splash-header-user" ref={menuRef}>
                  <button
                    className="dm-splash-header-avatar"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    {profile?.current_plan === 'premium' &&
                     profile?.avatar_slideshow_enabled === true &&
                     profile?.avatar_gallery &&
                     profile.avatar_gallery.length > 0 ? (
                      <AvatarPremiumSlideshow
                        urls={profile.avatar_gallery}
                        size={32}
                      />
                    ) : (
                      <img
                        src={getAvatarUrl(profile || {})}
                        alt="Avatar"
                      />
                    )}
                  </button>
                  {showUserMenu && (
                    <div className="dm-splash-header-menu">
                      <Link
                        to="/pricing"
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Premium
                      </Link>
                      <button
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Избранное
                      </button>
                      <button
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Покупки
                      </button>
                      <div className="dm-splash-header-menu-divider" />
                      <Link
                        to="/editor"
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Редактор
                      </Link>
                      {/* <Link
                        to="/bazar"
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Настройки
                      </Link> */}
                      <Link
                        to="/account"
                        className="dm-splash-header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Кабинет
                      </Link>
                      <div className="dm-splash-header-menu-divider" />
                      <button
                        className="dm-splash-header-menu-item"
                        onClick={handleLogout}
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="dm-splash-header-btn dm-splash-header-btn-primary"
                  onClick={() => {
                    if (onShowAuthModal) {
                      onShowAuthModal()
                    }
                  }}
                >
                  Вход
                </button>
              )
            )}
          </div>
        </div>
      </header>
    </>
  )
}

