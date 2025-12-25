// src/auth/Login.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getRedirectUrl } from '../utils/getRedirectUrl'
import { ADMIN_EMAILS } from './adminConfig'
import './Auth.css'
import MobileBackButton from '../editorV2/components/MobileBackButton'

export default function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const success = searchParams.get('success')
    const msg = searchParams.get('message')
    const err = searchParams.get('error')

    // Успешные состояния
    if (success === '1') {
      setMessage('Готово. Теперь войдите в аккаунт.')
    }

    // Сообщения
    if (msg === 'confirm_email') {
      setMessage('Проверьте почту и подтвердите email, затем войдите.')
    }
    if (msg === 'reset_sent') {
      setMessage('Письмо для сброса пароля отправлено. Проверьте почту.')
    }

    // Ошибки
    if (err === 'auth_failed') {
      setError('Ошибка авторизации. Попробуйте ещё раз.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password

      if (!cleanEmail || !cleanPassword) {
        setError('Заполните все поля')
        setLoading(false)
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setError('Ошибка конфигурации: проверьте настройки Supabase в .env файле')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          setError('Неверный email или пароль')
        } else if (
          error.message.includes('Email not confirmed') ||
          error.message.includes('email_not_confirmed')
        ) {
          setError('Email не подтвержден. Проверьте почту и подтвердите регистрацию.')
        } else if (error.message.includes('Too many requests')) {
          setError('Слишком много попыток входа. Подождите и попробуйте снова.')
        } else {
          setError(`Ошибка: ${error.message}`)
        }
        setLoading(false)
        return
      }

      if (data?.user) {
        // Если админ - направляем в админку
        if (ADMIN_EMAILS.includes(data.user.email?.toLowerCase())) {
          navigate('/admin')
        } else {
          navigate('/editor')
        }
      } else {
        setError('Вход выполнен, но данные пользователя не получены')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Неожиданная ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl('/auth/callback'),
        },
      })

      if (oauthError) {
        setError(oauthError.message || 'Ошибка входа через Google')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа через Google')
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Кнопка назад в редактор для мобильных */}
      <MobileBackButton onClick={() => navigate('/editor')} />
      
      <div className="auth-card">
        <h1 className="auth-title">Вход в DMOTION</h1>

        {message && <div className="auth-message">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
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
            />
          </div>

          <button
            type="submit"
            className="auth-button auth-button-primary"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
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
          Войти через Google
        </button>

        <div className="auth-links">
          <Link to="/auth/forgot-password">Забыли пароль?</Link>
          <Link to="/auth/register">Создать аккаунт</Link>
        </div>
      </div>
    </div>
  )
}
