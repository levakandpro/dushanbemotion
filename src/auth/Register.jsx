// src/auth/Register.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'
import MobileBackButton from '../editorV2/components/MobileBackButton'

export default function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!fullName.trim() || !cleanEmail || !password || !confirmPassword) {
      setError('Заполните все поля')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName.trim() },
          // После подтверждения письма пусть ведёт на страницу "Email подтвержден"
          emailRedirectTo: `${window.location.origin}/auth/confirmed`,
        },
      })

      if (error) throw error

      // Отправляем уведомление в Telegram о новом пользователе
      import('../services/telegramService')
        .then(({ notifyNewUser }) => {
          return notifyNewUser(fullName.trim(), null, cleanEmail)
        })
        .then((result) => {
          console.log('[Register] Telegram notification sent:', result)
        })
        .catch((e) => {
          console.error('[Register] Telegram notification error:', e)
        })

      // В Supabase обычно email_confirmed_at = null до подтверждения.
      // Поэтому сразу показываем понятное сообщение на login.
      navigate('/auth/login?message=confirm_email')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
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
        setError(oauthError.message || 'Ошибка регистрации через Google')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации через Google')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Кнопка назад в редактор для мобильных */}
      <MobileBackButton onClick={() => navigate('/editor')} />
      
      <div className="auth-card">
        <h1 className="auth-title">Регистрация в DMOTION</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="fullName">Имя</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Ваше имя"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button auth-button-primary"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-divider">
          <span>или</span>
        </div>

        <button
          type="button"
          className="auth-button auth-button-google"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.185l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.037-3.71H.957v2.332C2.438 15.983 5.482 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.963 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.006-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.963 7.293C4.672 5.157 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Зарегистрироваться через Google
        </button>

        <div className="auth-links">
          <Link to="/auth/login">Уже есть аккаунт? Войти</Link>
        </div>
      </div>
    </div>
  )
}
