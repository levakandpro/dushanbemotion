// src/pages/AccountPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUser, getUserProfile, ensureProfileExists } from '../services/userService'
import { getFavoritesByType, getFavoritesCounts, removeFromFavorites } from '../services/favoritesService'
import { getMyProfile, checkUsernameAvailability, updateMyProfile } from '../services/profileService'
import { getUserOrders } from '../services/safeDealService'
import logoSvg from '../editorV2/components/bazar/assets/logo.svg'
import Loader from '../components/ui/Loader'
import './AccountPage.css'

const TabIcons = {
  images: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  music: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  sounds: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  stickers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  icons: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  fonts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
}

const FAVORITE_TABS = [
  { id: 'images', label: 'Изображения', emptyText: 'Здесь появятся ваши сохранённые изображения' },
  { id: 'music', label: 'Музыка', emptyText: 'Здесь появятся ваши сохранённые треки' },
  { id: 'sounds', label: 'Звуки', emptyText: 'Здесь появятся ваши сохранённые звуки' },
  { id: 'stickers', label: 'Стикеры', emptyText: 'Здесь появятся ваши сохранённые стикеры' },
  { id: 'icons', label: 'Иконки', emptyText: 'Здесь появятся ваши сохранённые иконки' },
  { id: 'fonts', label: 'Шрифты', emptyText: 'Здесь появятся ваши сохранённые шрифты' },
]

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [becomeAuthorLoading, setBecomeAuthorLoading] = useState(false)

  const goToCanvas = useCallback(() => {
    navigate('/editor')
  }, [navigate])
  
  // Избранное
  const [activeTab, setActiveTab] = useState('images')
  const [favorites, setFavorites] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [counts, setCounts] = useState({})

  // Мои заказы (как клиент)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Редактирование профиля
  const [nameInput, setNameInput] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle | checking | free | taken | mine | invalid
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef(null)

  // Соцсети
  const [socials, setSocials] = useState({
    social_instagram: '',
    social_telegram: '',
    social_youtube: '',
    social_tiktok: '',
    social_facebook: '',
    social_x: '',
    social_pinterest: '',
    social_whatsapp: '',
    social_gmail: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  // Загружаем избранное при смене вкладки
  useEffect(() => {
    if (user) {
      loadFavorites(activeTab)
    }
  }, [activeTab, user])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate('/auth/login')
        return
      }
      setUser(currentUser)

      const profileData = await getUserProfile(currentUser.id)
      console.log('🔍 AccountPage profile:', {
        current_plan: profileData?.current_plan,
        plan_expires_at: profileData?.plan_expires_at,
        is_lifetime: profileData?.is_lifetime
      })
      setProfile(profileData)
      
      // Заполняем инпуты текущими значениями
      setNameInput(profileData?.display_name || '')
      setUsernameInput(profileData?.username || '')
      setUsernameStatus(profileData?.username ? 'mine' : 'idle')
      
      // Заполняем соцсети
      setSocials({
        social_instagram: profileData?.social_instagram || '',
        social_telegram: profileData?.social_telegram || '',
        social_youtube: profileData?.social_youtube || '',
        social_tiktok: profileData?.social_tiktok || '',
        social_facebook: profileData?.social_facebook || '',
        social_x: profileData?.social_x || '',
        social_pinterest: profileData?.social_pinterest || '',
        social_whatsapp: profileData?.social_whatsapp || '',
        social_gmail: profileData?.social_gmail || ''
      })
      
      // Загружаем счётчики избранного
      const favCounts = await getFavoritesCounts(currentUser.id)
      setCounts(favCounts)

      // Загружаем заказы пользователя (как клиент)
      loadUserOrders(currentUser.id)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserOrders = async (userId) => {
    setOrdersLoading(true)
    try {
      const userOrders = await getUserOrders(userId, 'client')
      setOrders(userOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadFavorites = async (type) => {
    if (!user) return
    setFavoritesLoading(true)
    try {
      const items = await getFavoritesByType(user.id, type)
      setFavorites(items)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }

  const handleRemoveFavorite = async (assetId) => {
    if (!user) return
    const success = await removeFromFavorites(user.id, activeTab, assetId)
    if (success) {
      setFavorites(prev => prev.filter(f => f.asset_id !== assetId))
      setCounts(prev => ({ ...prev, [activeTab]: Math.max(0, (prev[activeTab] || 0) - 1) }))
    }
  }

  // Валидация username
  const validateUsername = (value) => {
    const normalized = value.trim().toLowerCase()
    if (normalized.length < 3 || normalized.length > 24) return false
    if (normalized.startsWith('_')) return false
    return /^[a-z0-9_]+$/.test(normalized)
  }

  // Проверка username с debounce
  const checkUsername = useCallback(async (value) => {
    const normalized = value.trim().toLowerCase()
    
    // Если равно текущему
    if (normalized === profile?.username) {
      setUsernameStatus('mine')
      return
    }
    
    // Валидация формата
    if (!validateUsername(value)) {
      setUsernameStatus('invalid')
      return
    }
    
    setUsernameStatus('checking')
    
    try {
      const result = await checkUsernameAvailability(normalized, user?.id)
      setUsernameStatus(result.status)
    } catch (err) {
      console.error('Username check error:', err)
      setUsernameStatus('idle')
    }
  }, [profile?.username, user?.id])

  // Обработчик изменения username
  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsernameInput(value)
    setProfileError('')
    setProfileSuccess('')
    
    // Отменяем предыдущий debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    const normalized = value.trim().toLowerCase()
    
    // Быстрые проверки без запроса
    if (normalized === profile?.username) {
      setUsernameStatus('mine')
      return
    }
    
    if (!validateUsername(value)) {
      setUsernameStatus('invalid')
      return
    }
    
    // Debounce запроса в БД
    debounceRef.current = setTimeout(() => {
      checkUsername(value)
    }, 400)
  }

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Сохранение профиля
  const handleSaveProfile = async () => {
    setProfileError('')
    setProfileSuccess('')
    
    if (usernameStatus === 'taken') {
      setProfileError('Username занят')
      return
    }
    
    if (usernameStatus === 'invalid') {
      setProfileError('Неверный формат username')
      return
    }
    
    setSaving(true)
    
    try {
      console.log('Saving socials:', socials)
      const result = await updateMyProfile({
        display_name: nameInput.trim(),
        username: usernameInput.trim().toLowerCase(),
        ...socials
      })
      console.log('Update result:', result)
      
      // Перезагружаем профиль
      const updatedProfile = await getMyProfile()
      console.log('Updated profile:', updatedProfile)
      setProfile(updatedProfile)
      setNameInput(updatedProfile?.display_name || '')
      setUsernameInput(updatedProfile?.username || '')
      setUsernameStatus('mine')
      setSocials({
        social_instagram: updatedProfile?.social_instagram || '',
        social_telegram: updatedProfile?.social_telegram || '',
        social_youtube: updatedProfile?.social_youtube || '',
        social_tiktok: updatedProfile?.social_tiktok || '',
        social_facebook: updatedProfile?.social_facebook || '',
        social_x: updatedProfile?.social_x || '',
        social_pinterest: updatedProfile?.social_pinterest || '',
        social_whatsapp: updatedProfile?.social_whatsapp || '',
        social_gmail: updatedProfile?.social_gmail || ''
      })
      setProfileSuccess('Сохранено')
    } catch (err) {
      console.error('Save profile error:', err)
      
      // Обработка ошибок
      if (err?.code === '23514') {
        setProfileError('Недопустимый формат username')
      } else if (err?.code === '23505') {
        setProfileError('Username занят')
        setUsernameStatus('taken')
      } else {
        setProfileError(err?.message || 'Ошибка сохранения')
      }
    } finally {
      setSaving(false)
    }
  }

  // Текст статуса username
  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case 'free': return 'Свободно'
      case 'taken': return 'Занято'
      case 'mine': return 'Ваш текущий'
      case 'invalid': return 'Неверный формат (a-z, 0-9, _, 3-24 символа)'
      case 'checking': return 'Проверяю…'
      default: return ''
    }
  }

  const getUsernameStatusClass = () => {
    switch (usernameStatus) {
      case 'free': return 'account-username-status--free'
      case 'taken': return 'account-username-status--taken'
      case 'invalid': return 'account-username-status--invalid'
      case 'mine': return 'account-username-status--mine'
      default: return ''
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  const handleBecomeAuthor = async () => {
    if (!user) return
    
    setBecomeAuthorLoading(true)
    try {
      // Используем ensureProfileExists для гарантированного создания/обновления профиля
      // Устанавливаем role='author' и is_author=true
      await ensureProfileExists(user.id, {
        role: 'author',
        is_author: true
      })
      
      // Редирект в панель автора
      navigate('/author')
    } catch (error) {
      // Детальный вывод ошибки
      const errorMessage = error?.message || 'Неизвестная ошибка'
      const errorCode = error?.code || ''
      const errorDetails = error?.details || ''
      const errorHint = error?.hint || ''
      
      console.error('Error becoming author:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        fullError: JSON.stringify(error, null, 2)
      })
      
      // Показываем понятную ошибку пользователю
      let userMessage = 'Ошибка при активации режима автора'
      if (errorMessage) {
        userMessage += `:\n${errorMessage}`
      }
      if (errorCode) {
        userMessage += `\nКод: ${errorCode}`
      }
      if (errorHint) {
        userMessage += `\nПодсказка: ${errorHint}`
      }
      
      alert(userMessage)
    } finally {
      setBecomeAuthorLoading(false)
    }
  }

  const handleGoToAuthorPanel = () => {
    navigate('/author')
  }

  if (loading) {
    return <Loader />
  }

  const isAuthor = profile?.is_author === true
  const currentTabInfo = FAVORITE_TABS.find(t => t.id === activeTab)
  
  // Проверка премиум тарифа
  const hasPremium = profile?.current_plan && 
    profile.current_plan !== 'free' && 
    profile.current_plan !== null &&
    (profile.is_lifetime || (profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()))
  
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Хелперы для статусов заказа
  const getOrderStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает',
      pending_payment: 'Проверка оплаты',
      paid: 'Оплачен',
      in_progress: 'В работе',
      delivered: 'Сдан',
      approved: 'Завершён',
      cancelled: 'Отменён',
      disputed: 'Спор',
      refunded: 'Возврат'
    }
    return labels[status] || status
  }

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: '#ff9500',
      pending_payment: '#ff9500',
      paid: '#007aff',
      in_progress: '#5856d6',
      delivered: '#34c759',
      approved: '#30d158',
      cancelled: '#ff3b30',
      disputed: '#ff2d55',
      refunded: '#6c757d'
    }
    return colors[status] || '#86868b'
  }

  // Компактный рендер для авторов
  if (isAuthor) {
    return (
      <div className="account-page account-page--author">
        <div className="account-author-container">
          {/* Компактный хедер с выходом и статусом */}
          <div className="account-author-header">
            <div className="account-author-header-left">
              <img
                src={logoSvg}
                alt="D Motion"
                className="account-logo-sm"
                role="button"
                tabIndex={0}
                onClick={goToCanvas}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') goToCanvas()
                }}
                style={{ cursor: 'pointer' }}
              />
              <h1 className="account-author-title">Мой кабинет</h1>
              <span className="account-author-badge">Автор</span>
            </div>
            <div className="account-author-header-right">
              <button className="account-author-panel-btn" onClick={handleGoToAuthorPanel}>
                Панель автора →
              </button>
              <button className="account-author-logout-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </div>

          {/* Основной контент в сетке 3 колонки */}
          <div className="account-author-grid">
            {/* Колонка 1: Профиль */}
            <div className="account-author-card">
              <h3 className="account-author-card-title">Профиль</h3>
              <div className="account-author-field">
                <span className="account-author-label">Email</span>
                <span className="account-author-value">{user?.email || '—'}</span>
              </div>
              <div className="account-author-field">
                <label className="account-author-label">Имя</label>
                <input
                  type="text"
                  className="account-author-input"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setProfileError(''); setProfileSuccess(''); }}
                  placeholder="Ваше имя"
                />
              </div>
              <div className="account-author-field">
                <label className="account-author-label">Username</label>
                <input
                  type="text"
                  className="account-author-input"
                  value={usernameInput}
                  onChange={handleUsernameChange}
                  placeholder="username"
                />
                {usernameStatus !== 'idle' && (
                  <span className={`account-username-status ${getUsernameStatusClass()}`}>
                    {getUsernameStatusText()}
                  </span>
                )}
              </div>
              {profileError && <div className="account-profile-error">{profileError}</div>}
              {profileSuccess && <div className="account-profile-success">{profileSuccess}</div>}
              <button
                className="account-author-save-btn"
                onClick={handleSaveProfile}
                disabled={saving || usernameStatus === 'checking'}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>

            {/* Колонка 2: Тариф */}
            <div className="account-author-card">
              <h3 className="account-author-card-title">Тариф</h3>
              <div className="account-author-field">
                <span className="account-author-label">Текущий</span>
                <span className="account-author-value">
                  {hasPremium ? <span className="account-author-pro-badge">PRO</span> : 'Бесплатный'}
                </span>
              </div>
              {hasPremium && profile?.plan_expires_at && (
                <div className="account-author-field">
                  <span className="account-author-label">До</span>
                  <span className="account-author-value">
                    {profile.is_lifetime ? '∞' : formatDate(profile.plan_expires_at)}
                  </span>
                </div>
              )}
              <button className="account-author-tariff-btn" onClick={() => navigate('/pricing')}>
                {hasPremium ? 'Управлять' : 'Тарифы'}
              </button>
            </div>

            {/* Колонка 3: Соцсети - ВСЕ 9 */}
            <div className="account-author-card account-author-card--socials">
              <h3 className="account-author-card-title">Соцсети</h3>
              <div className="account-author-socials-grid">
                <input type="text" className="account-author-input" value={socials.social_instagram || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_instagram: e.target.value }))}
                  placeholder="Instagram" />
                <input type="text" className="account-author-input" value={socials.social_telegram || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_telegram: e.target.value }))}
                  placeholder="Telegram" />
                <input type="text" className="account-author-input" value={socials.social_youtube || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_youtube: e.target.value }))}
                  placeholder="YouTube" />
                <input type="text" className="account-author-input" value={socials.social_tiktok || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_tiktok: e.target.value }))}
                  placeholder="TikTok" />
                <input type="text" className="account-author-input" value={socials.social_facebook || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_facebook: e.target.value }))}
                  placeholder="Facebook" />
                <input type="text" className="account-author-input" value={socials.social_x || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_x: e.target.value }))}
                  placeholder="X" />
                <input type="text" className="account-author-input" value={socials.social_pinterest || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_pinterest: e.target.value }))}
                  placeholder="Pinterest" />
                <input type="text" className="account-author-input" value={socials.social_whatsapp || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_whatsapp: e.target.value }))}
                  placeholder="WhatsApp" />
                <input type="text" className="account-author-input" value={socials.social_gmail || ''}
                  onChange={(e) => setSocials(prev => ({ ...prev, social_gmail: e.target.value }))}
                  placeholder="Email" />
              </div>
            </div>
          </div>

          {/* Кнопка назад */}
          <button className="account-author-back" onClick={() => navigate('/editor')}>
            ← Назад в редактор
          </button>
        </div>
      </div>
    )
  }

  // Обычный рендер для НЕ-авторов
  return (
    <div className="account-page">
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <div className="account-header-left">
            <img
              src={logoSvg}
              alt="D Motion"
              className="account-logo"
              role="button"
              tabIndex={0}
              onClick={goToCanvas}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') goToCanvas()
              }}
              style={{ cursor: 'pointer' }}
            />
            <h1 className="account-title">Мой кабинет</h1>
          </div>
          <button 
            className="account-back-btn"
            onClick={() => navigate('/editor')}
          >
            ← Назад в редактор
          </button>
        </div>

        <div className="account-layout">
          {/* Левая колонка - Профиль */}
          <div className="account-sidebar">
            <div className="account-card">
              <div className="account-section">
                <h2 className="account-section-title">Профиль</h2>
                
                <div className="account-field account-field--row">
                  <span className="account-field-label">Email</span>
                  <span className="account-field-value">{user?.email || 'Не указан'}</span>
                </div>

                <div className="account-field">
                  <label className="account-field-label">Имя</label>
                  <input
                    type="text"
                    className="account-input"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value)
                      setProfileError('')
                      setProfileSuccess('')
                    }}
                    placeholder="Ваше имя"
                  />
                </div>

                <div className="account-field">
                  <label className="account-field-label">Username</label>
                  <input
                    type="text"
                    className="account-input"
                    value={usernameInput}
                    onChange={handleUsernameChange}
                    placeholder="username"
                  />
                  {usernameStatus !== 'idle' && (
                    <span className={`account-username-status ${getUsernameStatusClass()}`}>
                      {getUsernameStatusText()}
                    </span>
                  )}
                </div>

                {/* Соцсети */}
                <div className="account-socials-block">
                  <h3 className="account-socials-title">Соцсети</h3>
                  <div className="account-socials-grid">
                    <div className="account-field">
                      <label className="account-field-label">Instagram</label>
                      <input type="text" className="account-input" value={socials.social_instagram || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_instagram: e.target.value }))}
                        placeholder="instagram.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">Telegram</label>
                      <input type="text" className="account-input" value={socials.social_telegram || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_telegram: e.target.value }))}
                        placeholder="t.me/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">YouTube</label>
                      <input type="text" className="account-input" value={socials.social_youtube || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_youtube: e.target.value }))}
                        placeholder="youtube.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">TikTok</label>
                      <input type="text" className="account-input" value={socials.social_tiktok || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_tiktok: e.target.value }))}
                        placeholder="tiktok.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">Facebook</label>
                      <input type="text" className="account-input" value={socials.social_facebook || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_facebook: e.target.value }))}
                        placeholder="facebook.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">X</label>
                      <input type="text" className="account-input" value={socials.social_x || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_x: e.target.value }))}
                        placeholder="x.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">Pinterest</label>
                      <input type="text" className="account-input" value={socials.social_pinterest || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_pinterest: e.target.value }))}
                        placeholder="pinterest.com/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">WhatsApp</label>
                      <input type="text" className="account-input" value={socials.social_whatsapp || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_whatsapp: e.target.value }))}
                        placeholder="wa.me/..." />
                    </div>
                    <div className="account-field">
                      <label className="account-field-label">Email</label>
                      <input type="text" className="account-input" value={socials.social_gmail || ''}
                        onChange={(e) => setSocials(prev => ({ ...prev, social_gmail: e.target.value }))}
                        placeholder="your@email.com" />
                    </div>
                  </div>
                </div>

                {profileError && (
                  <div className="account-profile-error">{profileError}</div>
                )}
                {profileSuccess && (
                  <div className="account-profile-success">{profileSuccess}</div>
                )}

                <button
                  className="account-btn account-btn--primary"
                  onClick={handleSaveProfile}
                  disabled={saving || usernameStatus === 'checking'}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>

              <div className="account-divider" />

              <div className="account-section">
                <h2 className="account-section-title">Тариф</h2>
                
                <div className="account-plan">
                  <div className="account-field">
                    <span className="account-field-label">Текущий тариф</span>
                    <span className="account-field-value">
                      {hasPremium ? (
                        <span className="account-plan-badge account-plan-badge--pro">PRO</span>
                      ) : (
                        'Бесплатный'
                      )}
                    </span>
                  </div>
                  
                  {hasPremium && profile?.plan_expires_at && (
                    <div className="account-field">
                      <span className="account-field-label">Срок действия</span>
                      <span className="account-field-value">
                        {profile.is_lifetime ? 'Навсегда' : formatDate(profile.plan_expires_at)}
                      </span>
                    </div>
                  )}
                  
                  {!hasPremium && (
                    <div className="account-field">
                      <span className="account-field-label">Срок действия</span>
                      <span className="account-field-value">—</span>
                    </div>
                  )}
                  
                  <button 
                    className="account-btn account-btn--secondary"
                    onClick={() => navigate('/pricing')}
                  >
                    {hasPremium ? 'Управлять тарифом' : 'Перейти к тарифам'}
                  </button>
                </div>
              </div>

              <div className="account-divider" />

              <div className="account-section">
                <h2 className="account-section-title">Статус</h2>
                
                <div className="account-status account-status--user">
                  <span className="account-status-badge account-status-badge--user">Пользователь</span>
                  <p className="account-status-text">
                    Хотите продавать свои работы на BAZAR?
                  </p>
                  <button 
                    className="account-btn account-btn--accent"
                    onClick={handleBecomeAuthor}
                    disabled={becomeAuthorLoading}
                  >
                    {becomeAuthorLoading ? 'Подождите...' : 'Стать автором'}
                  </button>
                </div>
              </div>

              {/* Мои заказы */}
              <div className="account-divider" />
              <div className="account-section">
                <h2 className="account-section-title">Мои заказы</h2>
                
                {ordersLoading ? (
                  <Loader fullscreen={false} size="minimal" showText={false} />
                ) : orders.length === 0 ? (
                  <div className="account-orders-empty">
                    <p>У вас пока нет заказов</p>
                    <button 
                      className="account-btn account-btn--secondary"
                      onClick={() => navigate('/bazar')}
                    >
                      Найти услуги в BAZAR
                    </button>
                  </div>
                ) : (
                  <div className="account-orders-list">
                    {orders.slice(0, 5).map(order => (
                      <div 
                        key={order.id} 
                        className="account-order-item"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        <div className="account-order-info">
                          <span className="account-order-title">
                            {order.service?.title || 'Услуга'}
                          </span>
                          <span className="account-order-author">
                            Автор: {order.author?.display_name || order.author?.username || '—'}
                          </span>
                        </div>
                        <div className="account-order-right">
                          <span className="account-order-price">{order.price} с</span>
                          <span 
                            className="account-order-status"
                            style={{ 
                              background: getOrderStatusColor(order.status) + '20',
                              color: getOrderStatusColor(order.status)
                            }}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length > 5 && (
                      <button 
                        className="account-btn account-btn--ghost"
                        onClick={() => navigate('/my-orders')}
                      >
                        Показать все заказы ({orders.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="account-divider" />

              <div className="account-section">
                <button 
                  className="account-btn account-btn--logout"
                  onClick={handleLogout}
                >
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>

          {/* Правая колонка - Избранное (только для НЕ авторов) */}
          {!isAuthor && (
          <div className="account-main">
            <div className="account-card account-favorites">
              <h2 className="account-favorites-title">Избранное</h2>
              
              {/* Табы */}
              <div className="account-tabs">
                {FAVORITE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`account-tab ${activeTab === tab.id ? 'account-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="account-tab-icon">{TabIcons[tab.id]}</span>
                    <span className="account-tab-label">{tab.label}</span>
                    {counts[tab.id] > 0 && (
                      <span className="account-tab-count">{counts[tab.id]}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Контент вкладки */}
              <div className="account-favorites-content">
                {favoritesLoading ? (
                  <Loader fullscreen={false} size="minimal" showText={false} />
                ) : favorites.length === 0 ? (
                  <div className="account-favorites-empty">
                    <span className="account-favorites-empty-icon">{currentTabInfo?.icon}</span>
                    <p className="account-favorites-empty-text">{currentTabInfo?.emptyText}</p>
                  </div>
                ) : (
                  <div className="account-favorites-grid">
                    {favorites.map(item => (
                      <div key={item.id} className="account-favorite-card">
                        <div className="account-favorite-preview">
                          {activeTab === 'images' && (
                            <img src={item.asset_id} alt="" className="account-favorite-img" />
                          )}
                          {activeTab === 'stickers' && (
                            <img src={item.asset_id} alt="" className="account-favorite-img" />
                          )}
                          {activeTab === 'icons' && (
                            <div className="account-favorite-icon-preview">◆</div>
                          )}
                          {activeTab === 'music' && (
                            <div className="account-favorite-audio-preview">🎵</div>
                          )}
                          {activeTab === 'sounds' && (
                            <div className="account-favorite-audio-preview">🔊</div>
                          )}
                          {activeTab === 'fonts' && (
                            <div className="account-favorite-font-preview">Aa</div>
                          )}
                        </div>
                        <button
                          className="account-favorite-remove"
                          onClick={() => handleRemoveFavorite(item.asset_id)}
                          title="Удалить из избранного"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
