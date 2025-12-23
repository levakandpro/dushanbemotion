import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((opts) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const toast = {
      id,
      type: opts?.type || 'info', // info | success | error
      message: String(opts?.message || ''),
      durationMs: typeof opts?.durationMs === 'number' ? opts.durationMs : 2200
    }
    setToasts((prev) => [...prev, toast])
    if (toast.durationMs > 0) {
      setTimeout(() => remove(id), toast.durationMs)
    }
    return id
  }, [remove])

  const value = useMemo(() => ({ show, remove }), [show, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="dm-toast-host" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`dm-toast dm-toast-${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}


