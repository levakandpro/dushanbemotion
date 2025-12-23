// src/auth/ForgotPassword.jsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (!cleanEmail) {
        setError('Введите email')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      // Успех → на login с зелёным сообщением
      navigate('/auth/login?message=reset_sent')
    } catch (err) {
      setError(err.message || 'Ошибка отправки письма')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Восстановление пароля</h1>

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
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button auth-button-primary"
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить инструкции'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/auth/login">Вернуться к входу</Link>
        </div>
      </div>
    </div>
  )
}
