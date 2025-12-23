// src/auth/ConfirmedPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

export default function ConfirmedPage() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(61, 191, 160, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px'
          }}>
            ✓
          </div>
          <h1 className="auth-title">Email подтвержден</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
            Ваш аккаунт успешно активирован
          </p>
        </div>

        <button
          type="button"
          className="auth-button auth-button-primary"
          onClick={() => navigate('/auth/login')}
          style={{ width: '100%' }}
        >
          Войти
        </button>
      </div>
    </div>
  )
}

