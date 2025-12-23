// src/auth/OnboardingSuccessPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

export default function OnboardingSuccessPage() {
  const navigate = useNavigate()

  const handleContinue = () => {
    // Редирект на главную страницу (где кнопка "БА ПЕШ")
    navigate('/')
  }

  return (
    <div className="auth-container">
      <div className="auth-box auth-success-box">
        <div className="auth-success-icon">✓</div>
        <h1 className="auth-title">Спасибо за регистрацию!</h1>
        <p className="auth-message">
          Мы отправили письмо на ваш email.
          <br />
          Проверьте входящие и папку "Спам", чтобы не пропустить доступ и обновления.
        </p>
        <button
          className="auth-button auth-button-primary"
          onClick={handleContinue}
        >
          Продолжить
        </button>
      </div>
    </div>
  )
}

