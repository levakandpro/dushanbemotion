import React from 'react'
import { useToast } from '../context/ToastContext'
import './IdeasBox.css'

// Минималистичная иконка пера
const PenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.02 5.84L18.16 10.98L7.88 21.27C7.64 21.5 7.35 21.66 7.03 21.72L2.99 22.55C2.85 22.58 2.71 22.55 2.59 22.47C2.47 22.39 2.38 22.27 2.34 22.13L1.52 18.09C1.45 17.77 1.61 17.47 1.84 17.24L12.13 6.96L13.02 5.84ZM13.02 5.84L15.42 3.44C16.98 1.88 19.52 1.88 21.08 3.44C22.64 5 22.64 7.53 21.08 9.09L18.68 11.5L13.02 5.84Z" 
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function IdeasBox({ title = 'ВАШИ ИДЕИ', context = 'Общее' }) {
  const toast = useToast()
  const [text, setText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const send = React.useCallback(async () => {
    const message = text.trim()
    if (!message) return
    setSending(true)
    try {
      const workerUrl = 'https://stickers-manifest.natopchane.workers.dev'
      const resp = await fetch(`${workerUrl}/api/sendTelegramFeedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[${context}] ${message}` }),
      })
      if (resp.ok) {
        setText(''); setIsExpanded(false)
        toast.show({ type: 'success', message: 'Отправлено' })
      } else { throw new Error() }
    } catch {
      toast.show({ type: 'error', message: 'Ошибка сервера' })
    } finally { setSending(false) }
  }, [context, text, toast])

  return (
    <div className="dm-ideas-root">
      {!isExpanded ? (
        <button className="dm-ideas-trigger" onClick={() => setIsExpanded(true)} title="Предложить идею">
          <PenIcon />
        </button>
      ) : (
        <div className="dm-ideas-card">
          <div className="dm-ideas-header">
            <span>{title}</span>
            <button className="dm-ideas-close" onClick={() => setIsExpanded(false)}>✕</button>
          </div>
          <textarea
            className="dm-ideas-input"
            placeholder="Опишите вашу задумку..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="dm-ideas-footer">
            <button className="dm-ideas-send-btn" onClick={send} disabled={sending || !text.trim()}>
              {sending ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}