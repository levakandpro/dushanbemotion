// src/auth/AuthorOnboardingPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUser, createOrUpdateProfile, isUsernameAvailable, getUserProfile } from '../services/userService'
import { COUNTRIES, getCountryFlagUrl } from '../shared/constants/countries'
import InfoTooltip from '../shared/components/InfoTooltip'
import Loader from '../components/ui/Loader'
import './Auth.css'

const ACCOUNT_TYPES = [
  { value: 'studio', label: 'Студия' },
  { value: 'pro', label: 'Профессионал' },
  { value: 'solo', label: 'Одиночка' }
]

export default function AuthorOnboardingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Форма
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('Tajikistan')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [accountType, setAccountType] = useState('solo')
  const [gender, setGender] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  // Ошибки валидации
  const [errors, setErrors] = useState({})
  
  // Проверка username в реальном времени
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const countryDropdownRef = useRef(null)
  const [locale, setLocale] = useState('ru')
  const [localeDropdownOpen, setLocaleDropdownOpen] = useState(false)
  const localeDropdownRef = useRef(null)

  useEffect(() => {
    // Проверяем, авторизован ли пользователь и имеет ли статус автора
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          navigate('/')
          return
        }
        
        // Проверяем профиль - онбординг доступен только для авторов
        const profile = await getUserProfile(user.id)
        if (!profile || profile.is_author !== true) {
          // Не автор - редирект на страницу аккаунта
          navigate('/account')
          return
        }
        
        // Если автор уже прошёл онбординг - редирект в панель автора
        if (profile.author_onboarded === true) {
          navigate('/author')
          return
        }
        
        // Авто-подстановка данных из Google
        if (user.user_metadata?.full_name) {
          setDisplayName(user.user_metadata.full_name)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        navigate('/')
      }
    }
    checkAuth()
  }, [navigate])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false)
      }
    }

    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [countryDropdownOpen])

  // Валидация username
  const validateUsername = (value) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (normalized.length < 3) {
      return 'Минимум 3 символа'
    }
    if (normalized.length > 20) {
      return 'Максимум 20 символов'
    }
    if (!/^[a-z0-9-]{3,20}$/.test(normalized)) {
      return 'Только латинские буквы, цифры и дефис'
    }
    return null
  }

  // Обработка изменения username
  const handleUsernameChange = async (value) => {
    // Нормализуем: только нижний регистр, только a-z, 0-9, -
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setUsername(normalized)
    
    // Очищаем предыдущие ошибки
    setErrors(prev => ({ ...prev, username: undefined }))
    setUsernameAvailable(null)

    // Валидация
    const validationError = validateUsername(normalized)
    if (validationError) {
      setErrors(prev => ({ ...prev, username: validationError }))
      return
    }

    // Проверка уникальности
    if (normalized.length >= 3) {
      setUsernameChecking(true)
      try {
        const available = await isUsernameAvailable(normalized)
        setUsernameAvailable(available)
        if (!available) {
          setErrors(prev => ({ ...prev, username: 'Этот адрес уже занят' }))
        }
      } catch (err) {
        console.error('Username check error:', err)
        setErrors(prev => ({ ...prev, username: 'Ошибка проверки' }))
      } finally {
        setUsernameChecking(false)
      }
    }
  }

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Валидация
    const newErrors = {}
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Введите имя'
    }
    
    const usernameError = validateUsername(username)
    if (usernameError) {
      newErrors.username = usernameError
    } else if (usernameAvailable === false) {
      newErrors.username = 'Этот адрес уже занят'
    }
    
    if (!country) {
      newErrors.country = 'Выберите страну'
    }
    
    if (!accountType) {
      newErrors.accountType = 'Выберите тип аккаунта'
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'Необходимо принять условия'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Отправка
    setSubmitting(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Пользователь не найден')
      }

      await createOrUpdateProfile(user.id, {
        display_name: displayName.trim(),
        username: username.toLowerCase(),
        country,
        account_type: accountType,
        gender: gender,
        is_author: true,
        author_onboarded: true
      })

      // Редирект в панель автора
      navigate('/author')
    } catch (err) {
      console.error('Profile creation error:', err)
      setErrors({ username: err.message || 'Ошибка сохранения профиля' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  const selectedCountry = COUNTRIES.find(c => c.name === country) || COUNTRIES[0]

  return (
    <div className="auth-container">
      <div className="auth-box auth-box-onboarding onboarding-card">
        <div className="onboarding-card-header">
          <div className="onboarding-header-locale" ref={localeDropdownRef}>
            <button
              type="button"
              className="auth-locale-icon-btn"
              onMouseEnter={() => setLocaleDropdownOpen(true)}
              onMouseLeave={() => setLocaleDropdownOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
            {localeDropdownOpen && (
              <div 
                className="auth-locale-dropdown"
                onMouseEnter={() => setLocaleDropdownOpen(true)}
                onMouseLeave={() => setLocaleDropdownOpen(false)}
              >
                <button
                  type="button"
                  className={`auth-locale-btn ${locale === 'ru' ? 'active' : ''}`}
                  onClick={() => {
                    setLocale('ru')
                    setLocaleDropdownOpen(false)
                  }}
                >
                  Русский
                </button>
                <button
                  type="button"
                  className={`auth-locale-btn ${locale === 'tj' ? 'active' : ''}`}
                  onClick={() => {
                    setLocale('tj')
                    setLocaleDropdownOpen(false)
                  }}
                >
                  Точики
                </button>
                <button
                  type="button"
                  className={`auth-locale-btn ${locale === 'en' ? 'active' : ''}`}
                  onClick={() => {
                    setLocale('en')
                    setLocaleDropdownOpen(false)
                  }}
                >
                  English
                </button>
              </div>
            )}
          </div>
          <h1 className="auth-title">Добро пожаловать в D`MOTION</h1>
          <p className="auth-subtitle">Заполните несколько полей - и ваш творческий профиль будет готов к работе.</p>
        </div>
        
        <div className="onboarding-card-body">

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Имя */}
          <div className="auth-field">
            <label className="auth-label">
              Имя
              <InfoTooltip text="Имя будет вашей творческой подписью. Выберите то, под чем вам приятно выпускать работу." />
            </label>
            <input
              type="text"
              className={`auth-input ${errors.displayName ? 'auth-input-error' : ''}`}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setErrors(prev => ({ ...prev, displayName: undefined }))
              }}
              placeholder="Ваше имя"
              disabled={submitting}
            />
            {errors.displayName && (
              <div className="auth-error">{errors.displayName}</div>
            )}
          </div>

          {/* Адрес профиля и Страна в одной строке */}
          <div className="auth-field-row">
            <div className="auth-field">
              <label className="auth-label">
                Адрес профиля
                <InfoTooltip text="Уникальный URL вашей страницы. Разрешены латинские буквы, цифры и дефис. Нельзя менять после создания!" />
                <span className="auth-hint">dmotion.tj/u/{username || 'username'}</span>
              </label>
              <div className="auth-username-wrapper">
                <input
                  type="text"
                  className={`auth-input ${errors.username ? 'auth-input-error' : ''} ${usernameAvailable === true ? 'auth-input-success' : ''}`}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="username"
                  disabled={submitting}
                  maxLength={20}
                />
                {usernameChecking && (
                  <span className="auth-username-status checking">Проверяем…</span>
                )}
                {usernameAvailable === false && !usernameChecking && username.length >= 3 && (
                  <span className="auth-username-status taken">Занято</span>
                )}
                {usernameAvailable === true && !usernameChecking && (
                  <span className="auth-username-status available">Доступно!</span>
                )}
              </div>
              {errors.username && (
                <div className="auth-error">{errors.username}</div>
              )}
              {!errors.username && username && username.length >= 3 && !usernameChecking && (
                <div className="auth-hint-small">
                  Только латинские буквы, цифры и дефис (3-20 символов)
                </div>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label">Страна</label>
              <div className="auth-country-dropdown-wrapper" ref={countryDropdownRef}>
              <button
                type="button"
                className={`auth-country-dropdown-btn ${errors.country ? 'auth-input-error' : ''} ${countryDropdownOpen ? 'open' : ''}`}
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                disabled={submitting}
              >
                <span className="auth-country-selected">
                  <img 
                    src={getCountryFlagUrl(selectedCountry.code)} 
                    alt={selectedCountry.name}
                    className="auth-country-flag-img"
                    onError={(e) => {
                      const target = e.target
                      target.style.display = 'none'
                      if (target.nextSibling) {
                        target.nextSibling.style.display = 'inline'
                      }
                    }}
                  />
                  <span style={{ display: 'none' }}>{selectedCountry.flag}</span>
                  {selectedCountry.name}
                </span>
                <span className="auth-country-arrow">▼</span>
              </button>
              {countryDropdownOpen && (
                <div className="auth-country-dropdown-menu">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      className={`auth-country-item ${country === c.name ? 'selected' : ''}`}
                      onClick={() => {
                        setCountry(c.name)
                        setCountryDropdownOpen(false)
                        setErrors(prev => ({ ...prev, country: undefined }))
                      }}
                    >
                      <img 
                        src={getCountryFlagUrl(c.code)} 
                        alt={c.name}
                        className="auth-country-flag-img"
                        onError={(e) => {
                          const target = e.target
                          target.style.display = 'none'
                          if (target.nextSibling) {
                            target.nextSibling.style.display = 'inline'
                          }
                        }}
                      />
                      <span className="auth-country-flag" style={{ display: 'none' }}>{c.flag}</span>
                      <span className="auth-country-text">{c.code} {c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.country && (
              <div className="auth-error">{errors.country}</div>
            )}
            </div>
          </div>

          {/* Пол */}
          <div className="auth-field">
            <label className="auth-label">Пол</label>
            <div className="auth-account-types">
              <button
                type="button"
                className={`auth-account-type-btn ${gender === 'male' ? 'auth-account-type-btn-active' : ''}`}
                onClick={() => {
                  setGender('male')
                  setErrors(prev => ({ ...prev, gender: undefined }))
                }}
                disabled={submitting}
              >
                Мужской
              </button>
              <button
                type="button"
                className={`auth-account-type-btn ${gender === 'female' ? 'auth-account-type-btn-active' : ''}`}
                onClick={() => {
                  setGender('female')
                  setErrors(prev => ({ ...prev, gender: undefined }))
                }}
                disabled={submitting}
              >
                Женский
              </button>
            </div>
            {errors.gender && (
              <div className="auth-error">{errors.gender}</div>
            )}
          </div>

          {/* Тип аккаунта */}
          <div className="auth-field">
            <label className="auth-label">
              Тип аккаунта
              <InfoTooltip text="Формат работы - стиль вашей панели. Выберите то, что подходит вашему уровню." />
            </label>
            <div className="auth-account-types">
              {ACCOUNT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`auth-account-type-btn ${accountType === type.value ? 'auth-account-type-btn-active' : ''}`}
                  onClick={() => {
                    setAccountType(type.value)
                    setErrors(prev => ({ ...prev, accountType: undefined }))
                  }}
                  disabled={submitting}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {errors.accountType && (
              <div className="auth-error">{errors.accountType}</div>
            )}
          </div>

          {/* Согласие с правилами */}
          <div className="auth-field">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked)
                  setErrors(prev => ({ ...prev, terms: undefined }))
                }}
                disabled={submitting}
              />
              <span>Я принимаю <a href="/terms" target="_blank" className="auth-link">Условия использования</a> и <a href="/privacy" target="_blank" className="auth-link">Политику конфиденциальности</a></span>
            </label>
            {errors.terms && (
              <div className="auth-error">{errors.terms}</div>
            )}
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            className="auth-button auth-button-primary"
            disabled={submitting || usernameChecking}
          >
            {submitting ? 'Сохранение...' : 'Завершить настройку'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}

