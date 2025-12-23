// src/editorV2/modals/ShareProjectModal.jsx
import React, { useState } from 'react'
import { createShareLink } from '../utils/projectShareService'
import './ShareProjectModal.css'

export default function ShareProjectModal({ open, project, onClose }) {
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [error, setError] = useState(null)

  const handleShare = async () => {
    if (!project) {
      setError('Проект не найден')
      return
    }

    setLoading(true)
    setError(null)
    setShareUrl(null)

    try {
      const result = await createShareLink(project)
      setShareUrl(result.url)
    } catch (err) {
      console.error('ShareProjectModal: Error creating share link', err)
      setError(err.message || 'Не удалось создать ссылку для просмотра')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (!shareUrl) return
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Показываем уведомление об успешном копировании
      const btn = document.querySelector('.share-modal-copy-btn')
      if (btn) {
        const originalText = btn.textContent
        btn.textContent = 'Скопировано!'
        btn.style.background = '#4caf50'
        setTimeout(() => {
          btn.textContent = originalText
          btn.style.background = ''
        }, 2000)
      }
    }).catch(err => {
      console.error('ShareProjectModal: Error copying URL', err)
      setError('Не удалось скопировать ссылку')
    })
  }

  if (!open) return null

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Поделиться проектом</h2>
          <button className="share-modal-close" onClick={onClose}>Г-</button>
        </div>

        <div className="share-modal-body">
          {!shareUrl && !error && (
            <div className="share-modal-info">
              <p>Создайте ссылку для просмотра вашего проекта. Проект будет доступен только для просмотра.</p>
              <button
                className="share-modal-share-btn"
                onClick={handleShare}
                disabled={loading}
              >
                {loading ? 'Создание ссылки...' : 'Создать ссылку'}
              </button>
            </div>
          )}

          {loading && (
            <div className="share-modal-loading">
              <div className="share-modal-spinner" />
              <p>Создание ссылки...</p>
            </div>
          )}

          {error && (
            <div className="share-modal-error">
              <p>{error}</p>
              <button
                className="share-modal-retry-btn"
                onClick={handleShare}
                disabled={loading}
              >
                Попробовать снова
              </button>
            </div>
          )}

          {shareUrl && (
            <div className="share-modal-success">
              <p>Ссылка создана!</p>
              <div className="share-modal-url-container">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="share-modal-url-input"
                />
                <button
                  className="share-modal-copy-btn"
                  onClick={handleCopyUrl}
                >
                  Копировать
                </button>
              </div>
              <p className="share-modal-hint">
                Поделитесь этой ссылкой для просмотра проекта
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

