// src/editorV2/components/ErrorDisplay.jsx
import React, { useState, useEffect } from 'react'
import { getErrorStore } from '../store/errorStore'
import './ErrorDisplay.css'

export default function ErrorDisplay() {
  const [errors, setErrors] = useState([])
  const errorStore = getErrorStore()

  useEffect(() => {
    const unsubscribe = errorStore.subscribe((newErrors) => {
      setErrors([...newErrors])
    })
    setErrors(errorStore.getErrors())
    return unsubscribe
  }, [errorStore])

  if (errors.length === 0) return null

  // Берем последнюю ошибку
  const lastError = errors[errors.length - 1]

  const handleDismiss = () => {
    errorStore.removeError(lastError.id)
  }

  return (
    <div className="dm-error-container">
      <div className={`dm-error-toast ${lastError.type || 'error'}`}>
        <div className="dm-error-content">
          <span className="dm-error-icon">
            {lastError.type === 'warning' ? '⚠️' : '⚡'}
          </span>
          <div className="dm-error-message">
            {lastError.message || 'Произошла непредвиденная ошибка'}
          </div>
        </div>
        
        <div className="dm-error-actions">
          {lastError.retryable && (
            <button className="dm-error-retry" onClick={() => lastError.onRetry?.()}>
              ПОВТОРИТЬ
            </button>
          )}
          <button className="dm-error-close" onClick={handleDismiss}>✕</button>
        </div>
        
        {/* Полоска прогресса до исчезновения */}
        <div className="dm-error-progress"></div>
      </div>
    </div>
  )
}