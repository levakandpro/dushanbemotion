import React from 'react'
import logo from '../../../editorV2/components/bazar/assets/logo.svg'
import './index.css'

export default function Loader({
  fullscreen = true,
  inline = false,
  size = 'default',
  showText = true,
  text = 'Подождите секунду…',
  className = '',
}) {
  const classes = [
    'dm-loader',
    fullscreen && !inline && 'dm-loader--fullscreen',
    inline && 'dm-loader--inline',
    size !== 'default' && `dm-loader--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="dm-loader__content">
        <div className="dm-loader__container">
          {/* Орбитальные точки */}
          <div className="dm-loader__dots">
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
            <span className="dm-loader__dot" />
          </div>
          {/* Логотип по центру без фона */}
          <img src={logo} alt="D Motion" className="dm-loader__logo" />
        </div>
        {showText && <p className="dm-loader__text">{text}</p>}
      </div>
    </div>
  )
}
