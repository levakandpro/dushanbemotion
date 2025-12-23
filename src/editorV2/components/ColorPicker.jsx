// src/editorV2/components/ColorPicker.jsx
import React, { useCallback, useState, useEffect } from 'react'
import './ColorPicker.css' // Убедись, что создашь/обновишь этот CSS

// Вспомогательные функции (оставляем логику расчетов, она верная)
function hexToRgb(hex) {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return { r: 255, g: 255, b: 255 }
  const v = parseInt(hex.slice(1), 16)
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}
function rgbToHex(r, g, b) {
  const toHex = (x) => { const h = x.toString(16); return h.length === 1 ? '0' + h : h }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}
function hsvToRgb(h, s, v) {
  let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export default function ColorPicker({ value = '#ffffff', onChange, onReset, defaultValue }) {
  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(value)
    return rgbToHsv(rgb.r, rgb.g, rgb.b)
  })

  useEffect(() => {
    const rgb = hexToRgb(value)
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    setHsv(newHsv)
  }, [value])

  const updateColor = (newHsv) => {
    setHsv(newHsv)
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
    onChange?.(rgbToHex(rgb.r, rgb.g, rgb.b))
  }

  const handlePickEyedropper = async () => {
    if (!window.EyeDropper) return alert('Ваш браузер не поддерживает пипетку')
    const eyeDropper = new window.EyeDropper()
    try {
      const result = await eyeDropper.open()
      onChange?.(result.sRGBHex)
    } catch (e) {}
  }

  return (
    <div className="dm-color-picker-root">
      {/* Главное поле выбора */}
      <div 
        className="dm-color-main-field"
        style={{ backgroundColor: rgbToHex(...Object.values(hsvToRgb(hsv.h, 1, 1))) }}
        onMouseDown={(e) => {
          const move = (ev) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const s = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
            const v = Math.max(0, Math.min(1, 1 - (ev.clientY - rect.top) / rect.height))
            updateColor({ ...hsv, s, v })
          }
          move(e)
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', () => window.removeEventListener('mousemove', move), { once: true })
        }}
      >
        <div className="dm-color-cursor" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
      </div>

      {/* Полоска Радуги (Hue) */}
      <div className="dm-hue-slider-wrapper">
        <input 
          type="range" className="dm-hue-slider" min="0" max="1" step="0.001"
          value={hsv.h} onChange={(e) => updateColor({ ...hsv, h: parseFloat(e.target.value) })}
        />
      </div>

      <div className="dm-color-footer">
        <div className="dm-hex-display">
          <span className="dm-hash">#</span>
          <input type="text" value={value.replace('#', '')} onChange={(e) => onChange?.('#' + e.target.value)} />
        </div>
        
        <button className="dm-eyedropper-btn" onClick={handlePickEyedropper} title="Пипетка">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M18.5 3.5a2.12 2.12 0 0 1 3 3L11.75 16.25l-4.5 1.5 1.5-4.5L18.5 3.5zM4 20h3l12-12-3-3L4 17v3z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}