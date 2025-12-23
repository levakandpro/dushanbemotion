// src/shared/ui/Input.jsx

import React from 'react'
import './Input.css'

export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="shared-input-wrapper">
      {label && (
        <label className="shared-input-label">
          {label}
        </label>
      )}
      <input
        className={`shared-input ${error ? 'shared-input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="shared-input-error-text">{error}</span>
      )}
    </div>
  )
}

