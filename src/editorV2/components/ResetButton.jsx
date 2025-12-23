import React from 'react'

/**
 * Кнопка сброса параметра к дефолтному значению
 * @param {boolean} isChanged - изменился ли параметр от дефолтного
 * @param {function} onReset - функция сброса
 * @param {string} className - дополнительные классы
 */
export default function ResetButton({ isChanged, onReset, className = '' }) {
  if (!isChanged) return null
  
  return (
    <button
      type="button"
      className={`dm-reset-btn ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onReset) onReset()
      }}
      title="Сбросить к значению по умолчанию"
    >
      ⟲
    </button>
  )
}

