// src/editorV2/splash/AuthModal.jsx
import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [forgotPassword, setForgotPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data?.user) {
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirmed`,
        },
      })

      if (signUpError) throw signUpError

      if (data?.user) {
        // Отправляем уведомление в Telegram о новом пользователе
        import('../../services/telegramService').then(({ notifyNewUser }) => {
          notifyNewUser(null, null, email)
        }).catch(e => console.error('Telegram error:', e))
        
        setSuccessMessage('Письмо отправлено, подтвердите email')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSuccessMessage('Письмо для сброса пароля отправлено на ваш email')
    } catch (err) {
      setError(err.message || 'Ошибка отправки письма')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        console.error('Google OAuth error:', oauthError)
        setError(oauthError.message || 'Ошибка входа через Google')
        setLoading(false)
      }
      // Если успешно, произойдет редирект на Google, затем на /auth/callback
    } catch (err) {
      console.error('Unexpected Google auth error:', err)
      setError(err.message || 'Ошибка входа через Google')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Вкладки */}
        <div className="auth-modal-tabs">
          <button
            className={`auth-modal-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login')
              setError(null)
              setSuccessMessage(null)
              setForgotPassword(false)
            }}
          >
            ВХОД
          </button>
          <button
            className={`auth-modal-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register')
              setError(null)
              setSuccessMessage(null)
              setForgotPassword(false)
            }}
          >
            РЕГИСТРАЦИЯ
          </button>
        </div>

        {/* Форма входа */}
        {activeTab === 'login' && !forgotPassword && (
          <form onSubmit={handleLogin} className="auth-modal-form">
            <h2 className="auth-modal-title">Вход в DMOTION</h2>

            {error && <div className="auth-modal-error">{error}</div>}
            {successMessage && <div className="auth-modal-success">{successMessage}</div>}

            <div className="auth-modal-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="auth-modal-field">
              <label htmlFor="login-password">Пароль</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="button"
              className="auth-modal-forgot"
              onClick={() => setForgotPassword(true)}
              disabled={loading}
            >
              Забыли пароль?
            </button>

            <button
              type="submit"
              className="auth-modal-submit"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            <div className="auth-modal-divider">
              <span>или</span>
            </div>

            <button
              type="button"
              className="auth-modal-google"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.33-1.584-5.04-3.71H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.96 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.003-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.96 7.29C4.67 5.163 6.653 3.58 9 3.58z"/>
              </svg>
              Войти через Google
            </button>
          </form>
        )}

        {/* Форма восстановления пароля */}
        {activeTab === 'login' && forgotPassword && (
          <form onSubmit={handleForgotPassword} className="auth-modal-form">
            <h2 className="auth-modal-title">Восстановление пароля</h2>

            {error && <div className="auth-modal-error">{error}</div>}
            {successMessage && <div className="auth-modal-success">{successMessage}</div>}

            <div className="auth-modal-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-modal-submit"
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Отправить письмо'}
            </button>

            <button
              type="button"
              className="auth-modal-back"
              onClick={() => {
                setForgotPassword(false)
                setError(null)
                setSuccessMessage(null)
              }}
            >
              ← Назад к входу
            </button>
          </form>
        )}

        {/* Форма регистрации */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="auth-modal-form">
            <h2 className="auth-modal-title">Регистрация в DMOTION</h2>

            {error && <div className="auth-modal-error">{error}</div>}
            {successMessage && <div className="auth-modal-success">{successMessage}</div>}

            <div className="auth-modal-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="auth-modal-field">
              <label htmlFor="register-password">Пароль</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-modal-submit"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>

            <div className="auth-modal-divider">
              <span>или</span>
            </div>

            <button
              type="button"
              className="auth-modal-google"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.33-1.584-5.04-3.71H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.96 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.003-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.96 7.29C4.67 5.163 6.653 3.58 9 3.58z"/>
              </svg>
              Войти через Google
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

