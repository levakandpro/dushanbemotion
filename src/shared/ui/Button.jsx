// src/shared/ui/Button.jsx

import React from 'react'
import './Button.css'

export default function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`shared-button shared-button-${variant} shared-button-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

