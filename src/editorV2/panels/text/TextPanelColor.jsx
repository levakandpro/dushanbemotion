import React, { useCallback, useState, useEffect, useRef } from 'react'
import ResetButton from '../../components/ResetButton'
import { isFieldChanged, TEXT_DEFAULTS } from '../../utils/textDefaults'

// HEX → RGB
function hexToRgb(hex) {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return { r: 255, g: 255, b: 255 }
  const v = parseInt(hex.slice(1), 16)
  return {
    r: (v >> 16) & 255,
    g: (v >> 8) & 255,
    b: v & 255,
  }
}

// RGB → HEX
function rgbToHex(r, g, b) {
  const toHex = (x) => {
    const h = x.toString(16)
    return h.length === 1 ? '0' + h : h
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

// RGB → HSV
function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

// HSV → RGB
function hsvToRgb(h, s, v) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r1 = 0, g1 = 0, b1 = 0
  if (h >= 0 && h < 60) {
    r1 = c
    g1 = x
    b1 = 0
  } else if (h >= 60 && h < 120) {
    r1 = x
    g1 = c
    b1 = 0
  } else if (h >= 120 && h < 180) {
    r1 = 0
    g1 = c
    b1 = x
  } else if (h >= 180 && h < 240) {
    r1 = 0
    g1 = x
    b1 = c
  } else if (h >= 240 && h < 300) {
    r1 = x
    g1 = 0
    b1 = c
  } else {
    r1 = c
    g1 = 0
    b1 = x
  }

  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  return { r, g, b }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

// CSS-градиент из массива стопов
function buildGradientCss(type, angle, stops) {
  const stopStr = stops.map((s) => `${s.color} ${s.pos}%`).join(", ")
  if (type === "radial") {
    return `radial-gradient(circle, ${stopStr})`
  }
  return `linear-gradient(${angle}deg, ${stopStr})`
}

const TEXT_COLOR_SWATCHES = [
  '#ffffff',
  '#000000',
  '#ff0044',
  '#ffcc00',
  '#00e0ff',
  '#00ff99',
  '#9b6bff'
]

export default function TextPanelColor(props) {
  const { currentLayer, onChangeLayer, project } = props

  if (!currentLayer) return null

  const initialColor = currentLayer.fill || '#ffffff'
  const initialRgb = hexToRgb(initialColor)
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b)

  const [hue, setHue] = useState(initialHsv.h)
  const [sat, setSat] = useState(initialHsv.s)
  const [val, setVal] = useState(initialHsv.v)
  const [hex, setHex] = useState(initialColor)
  const [alpha, setAlpha] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState(false)

  // ======== TABS ========
  const [activeTab, setActiveTab] = useState(() => {
    const fill = currentLayer.fill || '#ffffff'
    return fill.includes('gradient') ? 'gradient' : 'color'
  })
  const [premiumExpanded, setPremiumExpanded] = useState(false)

  // ======== GRADIENT STATE ========
  const [gradientType, setGradientType] = useState("linear")
  const [gradientAngle, setGradientAngle] = useState(135)
  const [gradStops, setGradStops] = useState([
    { color: "#7b5cff", pos: 0 },
    { color: "#ff6b9d", pos: 50 },
    { color: "#5865f2", pos: 100 },
  ])
  const [selectedStopIdx, setSelectedStopIdx] = useState(0)
  const [gradDragging, setGradDragging] = useState(false)
  const [gHue, setGHue] = useState(0)
  const [gSat, setGSat] = useState(1)
  const [gVal, setGVal] = useState(1)
  const [gradFlash, setGradFlash] = useState(false)

  const selectedStop = gradStops[selectedStopIdx] ?? gradStops[0]


  // ======== GRADIENT PRESETS ========
  const GRADIENT_PRESETS = [
    { name: "Sunset", stops: [{ color: "#FF6B6B", pos: 0 }, { color: "#FFA500", pos: 50 }, { color: "#FFD700", pos: 100 }], angle: 135, type: "linear", premium: false },
    { name: "Ocean", stops: [{ color: "#667EEA", pos: 0 }, { color: "#764BA2", pos: 100 }], angle: 135, type: "linear", premium: false },
    { name: "Vaporwave", stops: [{ color: "#FC5C7D", pos: 0 }, { color: "#6A82FB", pos: 100 }], angle: 135, type: "linear", premium: false },
    { name: "Twilight", stops: [{ color: "#1F2937", pos: 0 }, { color: "#7C3AED", pos: 50 }, { color: "#EC4899", pos: 100 }], angle: 90, type: "linear", premium: false },
    { name: "Mint", stops: [{ color: "#00D084", pos: 0 }, { color: "#00E5CC", pos: 100 }], angle: 45, type: "linear", premium: false },
    { name: "Fire", stops: [{ color: "#FF0000", pos: 0 }, { color: "#FF7F00", pos: 100 }], angle: 180, type: "radial", premium: false },
    { name: "Neon Dreams", stops: [{ color: "#FF00FF", pos: 0 }, { color: "#00FFFF", pos: 50 }, { color: "#FF00FF", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Cyberpunk", stops: [{ color: "#0F0C29", pos: 0 }, { color: "#302B63", pos: 50 }, { color: "#24243e", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Aurora", stops: [{ color: "#00F5FF", pos: 0 }, { color: "#00D4FF", pos: 33 }, { color: "#00FF88", pos: 66 }, { color: "#00FFD4", pos: 100 }], angle: 90, type: "linear", premium: true },
    { name: "Royal Purple", stops: [{ color: "#667EEA", pos: 0 }, { color: "#764BA2", pos: 50 }, { color: "#F093FB", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Golden Hour", stops: [{ color: "#F09819", pos: 0 }, { color: "#EDDE5D", pos: 50 }, { color: "#F09819", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Midnight Blue", stops: [{ color: "#0C0C0C", pos: 0 }, { color: "#1A1A2E", pos: 50 }, { color: "#16213E", pos: 100 }], angle: 180, type: "linear", premium: true },
    { name: "Coral Reef", stops: [{ color: "#FF6B6B", pos: 0 }, { color: "#FF8E53", pos: 50 }, { color: "#FF6B9D", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Electric Blue", stops: [{ color: "#00C9FF", pos: 0 }, { color: "#92FE9D", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Cosmic", stops: [{ color: "#1A1A2E", pos: 0 }, { color: "#16213E", pos: 33 }, { color: "#0F3460", pos: 66 }, { color: "#533483", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Sunset Glow", stops: [{ color: "#FF512F", pos: 0 }, { color: "#F09819", pos: 50 }, { color: "#FF6B6B", pos: 100 }], angle: 90, type: "linear", premium: true },
    { name: "Mystic", stops: [{ color: "#757F9A", pos: 0 }, { color: "#D7DDE8", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Tropical", stops: [{ color: "#00D2FF", pos: 0 }, { color: "#3A7BD5", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Lavender", stops: [{ color: "#E056FD", pos: 0 }, { color: "#F093FB", pos: 50 }, { color: "#F5576C", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Emerald", stops: [{ color: "#11998e", pos: 0 }, { color: "#38ef7d", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Rose Gold", stops: [{ color: "#F093FB", pos: 0 }, { color: "#F5576C", pos: 50 }, { color: "#F09819", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Deep Space", stops: [{ color: "#0F0C29", pos: 0 }, { color: "#302B63", pos: 50 }, { color: "#24243e", pos: 100 }], angle: 180, type: "radial", premium: true },
    { name: "Neon Nights", stops: [{ color: "#1A1A2E", pos: 0 }, { color: "#16213E", pos: 33 }, { color: "#0F3460", pos: 66 }, { color: "#533483", pos: 100 }], angle: 45, type: "linear", premium: true },
    { name: "Crystal", stops: [{ color: "#00D2FF", pos: 0 }, { color: "#3A7BD5", pos: 50 }, { color: "#00D2FF", pos: 100 }], angle: 90, type: "linear", premium: true },
    { name: "Volcano", stops: [{ color: "#FF512F", pos: 0 }, { color: "#DD2476", pos: 100 }], angle: 135, type: "linear", premium: true },
    { name: "Ocean Depth", stops: [{ color: "#0F0C29", pos: 0 }, { color: "#302B63", pos: 50 }, { color: "#24243e", pos: 100 }], angle: 180, type: "radial", premium: true },
    { name: "Stardust", stops: [{ color: "#1A1A2E", pos: 0 }, { color: "#16213E", pos: 50 }, { color: "#0F3460", pos: 100 }], angle: 45, type: "linear", premium: true },
  ]

  const applyGradientPreset = useCallback((preset) => {
    setGradientType(preset.type)
    setGradientAngle(preset.angle)
    setGradStops(preset.stops)
    setSelectedStopIdx(0)
    const css = buildGradientCss(preset.type, preset.angle, preset.stops)
    if (onChangeLayer) {
      // Применяем градиент ТОЛЬКО к самому тексту
      // и одновременно выключаем маску / контейнер, чтобы не рисовались прямоугольники
      const patch = { fill: css }
      if (currentLayer?.mask && (currentLayer.mask.enabled || currentLayer.mask.source !== 'none')) {
        patch.mask = { ...currentLayer.mask, enabled: false, source: 'none' }
      }
      if (currentLayer?.container && currentLayer.container.type && currentLayer.container.type !== 'none') {
        patch.container = { ...currentLayer.container, type: 'none' }
      }
      onChangeLayer(patch)
    }
    setActiveTab('gradient')
  }, [onChangeLayer, currentLayer])

  const updateGradient = useCallback((patch = {}) => {
    const nextType = patch.type ?? gradientType
    const nextAngle = patch.angle ?? gradientAngle
    const nextStops = patch.stops ?? gradStops
    setGradientType(nextType)
    setGradientAngle(nextAngle)
    setGradStops(nextStops)
    const css = buildGradientCss(nextType, nextAngle, nextStops)
    if (onChangeLayer) {
      const layerPatch = { fill: css }
      // тоже отключаем маску/контейнер, если они включены
      if (currentLayer?.mask && (currentLayer.mask.enabled || currentLayer.mask.source !== 'none')) {
        layerPatch.mask = { ...currentLayer.mask, enabled: false, source: 'none' }
      }
      if (currentLayer?.container && currentLayer.container.type && currentLayer.container.type !== 'none') {
        layerPatch.container = { ...currentLayer.container, type: 'none' }
      }
      onChangeLayer(layerPatch)
    }
  }, [gradientType, gradientAngle, gradStops, onChangeLayer, currentLayer])

  // Синхронизация с currentLayer (только при изменении fill извне)
  const prevFillRef = useRef(currentLayer?.fill)
  useEffect(() => {
    if (!currentLayer) return
    const currentFill = currentLayer.fill || '#ffffff'
    
    // Пропускаем обновление, если это наше собственное изменение
    if (prevFillRef.current === currentFill) return
    prevFillRef.current = currentFill

    if (typeof currentFill === 'string' && (currentFill.includes('linear-gradient') || currentFill.includes('radial-gradient'))) {
      if (activeTab !== 'gradient') {
        setActiveTab('gradient')
      }
    } else {
      if (activeTab !== 'color') {
        setActiveTab('color')
      }
      if (typeof currentFill === 'string' && /^#([0-9a-fA-F]{6})$/.test(currentFill)) {
        try {
          const rgb = hexToRgb(currentFill)
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
          setHex(currentFill)
          setHue(hsv.h)
          setSat(hsv.s)
          setVal(hsv.v)
        } catch (e) {
          console.warn('Error parsing color:', e)
        }
      }
    }
  }, [currentLayer?.fill, activeTab])

  // Sync HSV для выбранного стопа градиента
  useEffect(() => {
    if (!selectedStop) return
    const rgb = hexToRgb(selectedStop.color)
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    setGHue(hsv.h)
    setGSat(hsv.s)
    setGVal(hsv.v)
  }, [selectedStopIdx, selectedStop])

  // Flash при смене цвета стопа градиента
  useEffect(() => {
    if (!selectedStop) return
    setGradFlash(true)
    const t = setTimeout(() => setGradFlash(false), 180)
    return () => clearTimeout(t)
  }, [selectedStop?.color])

  // Flash при смене hex
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 180)
    return () => clearTimeout(t)
  }, [hex])

  const applyFromHsv = useCallback((h, s, v, keepAlpha = alpha) => {
    try {
      const rgb = hsvToRgb(h, s, v)
      const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b)

      setHue(h)
      setSat(s)
      setVal(v)
      setHex(nextHex)
      setAlpha(keepAlpha)

      // Всегда применяем изменения, даже если currentLayer еще не загружен
      if (onChangeLayer) {
        onChangeLayer({ fill: nextHex })
      }
    } catch (e) {
      console.warn('Error applying color from HSV:', e)
    }
  }, [alpha, onChangeLayer])

  const applyAlpha = useCallback((a) => {
    const clamped = clamp(a, 0, 1)
    setAlpha(clamped)
    // Для текста alpha обычно не используется, но сохраняем для совместимости
  }, [])

  const applyHex = useCallback((value) => {
    if (!value || !/^#([0-9a-fA-F]{6})$/.test(value)) return
    try {
      const rgb = hexToRgb(value)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      setHex(value)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)
      // Всегда применяем изменения, даже если currentLayer еще не загружен
      if (onChangeLayer) {
        onChangeLayer({ fill: value })
      }
    } catch (e) {
      console.warn('Error applying hex color:', e)
    }
  }, [onChangeLayer])

  const handleSquareChange = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
    const s = x
    const v = 1 - y
    applyFromHsv(hue, s, v)
  }, [hue, applyFromHsv])

  const handleSquareMouseDown = (e) => {
    setDragging(true)
    handleSquareChange(e)
  }

  const handleSquareMouseMove = (e) => {
    if (!dragging) return
    handleSquareChange(e)
  }

  const handleSquareMouseUp = () => setDragging(false)
  const handleSquareMouseLeave = () => setDragging(false)

  const handleHueChange = useCallback((e) => {
    const h = Number(e.target.value)
    applyFromHsv(h, sat, val)
  }, [sat, val, applyFromHsv])

  const handleHexChange = (e) => {
    const value = e.target.value.trim()
    setHex(value)
    let v = value
    if (/^[0-9a-fA-F]{6}$/.test(value)) v = '#' + value
    if (/^#([0-9a-fA-F]{6})$/.test(v)) {
      applyHex(v)
    } else if (value.length === 0) {
      // Разрешаем пустое значение для редактирования
    }
  }

  const handleAlphaChange = (e) => {
    const v = Number(e.target.value) / 100
    applyAlpha(v)
  }

  const handleSwatch = useCallback(
    hex => {
      applyHex(hex)
    },
    [applyHex]
  )

  const handleNativeColor = useCallback(
    event => {
      const value = event.target.value
      applyHex(value)
    },
    [applyHex]
  )

  // Общая функция для определения цвета сброса
  const getResetColor = useCallback(() => {
    if (!project) return '#ffffff'
    
    const bgType = project.backgroundType
    
    if (bgType === 'white') {
      return '#000000' // на белом фоне → черный текст
    } else if (bgType === 'black') {
      return '#ffffff' // на черном фоне → белый текст
    } else if (bgType === 'transparent') {
      return '#ffffff' // на прозрачном фоне → белый текст
    } else if (typeof bgType === 'string' && bgType.startsWith('#')) {
      // Определяем яркость цвета
      const hex = bgType.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 180 ? '#000000' : '#ffffff' // светлый → черный, темный → белый
    }
    
    return '#ffffff' // по умолчанию белый
  }, [project])

  const handleReset = useCallback(() => {
    if (!project || !onChangeLayer || !currentLayer) return
    
    const resetColor = getResetColor()
    
    // Если был градиент, переключаемся на вкладку "Цвет"
    const currentFill = currentLayer.fill || ''
    if (currentFill.includes('gradient')) {
      setActiveTab('color')
    }
    
    // Применяем обычный цвет (это заменит градиент)
    applyHex(resetColor)
  }, [applyHex, project, onChangeLayer, currentLayer, getResetColor])

  const handlePickEyedropper = useCallback(async () => {
    try {
      // @ts-ignore - EyeDropper API
      if (!window.EyeDropper) {
        alert("Пипетка поддерживается только в современных Chromium-браузерах.")
        return
      }
      // @ts-ignore
      const dropper = new window.EyeDropper()
      const result = await dropper.open()
      if (result.sRGBHex) {
        applyHex(result.sRGBHex)
      }
    } catch (err) {
      // Пользователь отменил выбор
    }
  }, [applyHex])

  // ======== GRADIENT HANDLERS ========
  const handleStopPosChange = useCallback((idx, pos) => {
    const nextStops = gradStops.map((s, i) =>
      i === idx ? { ...s, pos: clamp(pos, 0, 100) } : s
    )
    updateGradient({ stops: nextStops })
  }, [gradStops, updateGradient])

  const handleAddStop = useCallback(() => {
    const newPos = gradStops.length > 0 
      ? Math.round((gradStops[0].pos + gradStops[gradStops.length - 1].pos) / 2)
      : 50
    const newColor = selectedStop ? selectedStop.color : "#7b5cff"
    const newStops = [...gradStops, { color: newColor, pos: newPos }].sort((a, b) => a.pos - b.pos)
    const newIdx = newStops.findIndex(s => s.pos === newPos)
    setSelectedStopIdx(newIdx >= 0 ? newIdx : newStops.length - 1)
    updateGradient({ stops: newStops })
  }, [gradStops, selectedStop, updateGradient])

  const handleRemoveStop = useCallback((idx) => {
    if (gradStops.length <= 1) return
    const newStops = gradStops.filter((_, i) => i !== idx)
    const newIdx = idx >= newStops.length ? newStops.length - 1 : idx
    setSelectedStopIdx(newIdx)
    updateGradient({ stops: newStops })
  }, [gradStops, updateGradient])

  const applyGradientColor = useCallback((h, s, v) => {
    const rgb = hsvToRgb(h, s, v)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    const nextStops = gradStops.map((stop, i) =>
      i === selectedStopIdx ? { ...stop, color: hex } : stop
    )
    setGradStops(nextStops)
    setGHue(h)
    setGSat(s)
    setGVal(v)
    updateGradient({ stops: nextStops })
  }, [gradStops, selectedStopIdx, updateGradient])

  const handleGradSquareChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
    const s = x
    const v = 1 - y
    applyGradientColor(gHue, s, v)
  }

  const handleGradSquareMouseDown = (e) => {
    setGradDragging(true)
    handleGradSquareChange(e)
  }

  const handleGradSquareMouseMove = (e) => {
    if (!gradDragging) return
    handleGradSquareChange(e)
  }

  const handleGradSquareMouseUp = () => setGradDragging(false)
  const handleGradSquareMouseLeave = () => setGradDragging(false)

  const handleGradHueChange = (e) => {
    const h = Number(e.target.value)
    applyGradientColor(h, gSat, gVal)
  }

  const handleGradHexChange = (e) => {
    const value = e.target.value.trim()
    let v = value
    if (/^[0-9a-fA-F]{6}$/.test(value)) v = "#" + value
    if (/^#([0-9a-fA-F]{6})$/.test(v)) {
      const rgb = hexToRgb(v)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      applyGradientColor(hsv.h, hsv.s, hsv.v)
    }
  }

  const handleGradReset = useCallback(() => {
    if (!project || !onChangeLayer || !currentLayer) return
    
    const resetColor = getResetColor()
    
    // Переключаемся на вкладку "Цвет" и применяем обычный цвет (заменяет градиент)
    setActiveTab('color')
    applyHex(resetColor)
  }, [applyHex, project, onChangeLayer, currentLayer, getResetColor])

  const handleGradPickEyedropper = useCallback(async () => {
    try {
      if (window.EyeDropper) {
        const eye = new window.EyeDropper()
        const result = await eye.open()
        const pickedHex = result.sRGBHex
        if (/^#([0-9a-fA-F]{6})$/.test(pickedHex)) {
          const rgb = hexToRgb(pickedHex)
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
          applyGradientColor(hsv.h, hsv.s, hsv.v)
        }
      } else {
        alert("Пипетка поддерживается только в современных Chromium-браузерах.")
      }
    } catch (e) {
      console.warn("EyeDropper cancelled or failed", e)
    }
  }, [applyGradientColor])

  const hueHex = rgbToHex(...Object.values(hsvToRgb(hue, 1, 1)))
  const thumbX = sat * 100
  const thumbY = (1 - val) * 100
  const alphaPercent = Math.round(alpha * 100)
  const rgb = hsvToRgb(hue, sat, val)

  const gThumbX = gSat * 100
  const gThumbY = (1 - gVal) * 100
  const gHueRgb = hsvToRgb(gHue, 1, 1)
  const gHueHex = rgbToHex(gHueRgb.r, gHueRgb.g, gHueRgb.b)
  const selectedStopHex = selectedStop ? selectedStop.color : "#ffffff"

  const handleResetColor = useCallback(() => {
    if (onChangeLayer) {
      onChangeLayer({ fill: TEXT_DEFAULTS.fill, color: TEXT_DEFAULTS.color })
      setActiveTab('color')
      const rgb = hexToRgb(TEXT_DEFAULTS.fill)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      setHex(TEXT_DEFAULTS.fill)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)
    }
  }, [onChangeLayer])

  const isColorChanged = isFieldChanged(currentLayer, 'fill') || isFieldChanged(currentLayer, 'color')

  return (
    <div className="dm-text-section dm-text-color-section">
      <label className="dm-field-label">
        <span className="dm-field-label-text">Цвет текста</span>
        <ResetButton
          isChanged={isColorChanged}
          onReset={handleResetColor}
        />
      </label>

      {/* Вкладки */}
      <div className="dm-bg-tabs">
        <button
          className={`dm-bg-tab ${activeTab === 'color' ? 'dm-bg-tab-active' : ''}`}
          onClick={() => setActiveTab('color')}
          type="button"
        >
          Цвет
        </button>
        <button
          className={`dm-bg-tab ${activeTab === 'gradient' ? 'dm-bg-tab-active' : ''}`}
          onClick={() => setActiveTab('gradient')}
          type="button"
        >
          Градиент
        </button>
      </div>

      {/* ======== COLOR TAB ======== */}
      {activeTab === 'color' && (
        <>

      {/* Быстрый выбор */}
      <div className="dm-color-swatch-row">
        {TEXT_COLOR_SWATCHES.map(s => (
          <button
            key={s}
            type="button"
            className={
              'dm-color-swatch' + (s.toLowerCase() === hex.toLowerCase() ? ' dm-color-swatch-active' : '')
            }
            style={{ backgroundColor: s }}
            onClick={() => handleSwatch(s)}
          />
        ))}
      </div>

      {/* Полноценный цветовой пикер */}
      <div className={`dm-bg-picker--custom ${flash ? 'dm-bg-picker-flash' : ''}`}>
        {/* Квадрат H/S/V */}
        <div
          className="dm-color-square"
          style={{ backgroundColor: hueHex }}
          onMouseDown={handleSquareMouseDown}
          onMouseMove={handleSquareMouseMove}
          onMouseUp={handleSquareMouseUp}
          onMouseLeave={handleSquareMouseLeave}
        >
          <div className="dm-color-square-overlay-white" />
          <div className="dm-color-square-overlay-black" />
          <div
            className="dm-color-square-thumb"
            style={{
              left: `${thumbX}%`,
              top: `${thumbY}%`,
            }}
          />
        </div>

        {/* Hue */}
        <div className="dm-color-row dm-color-row--hue">
          <label>HUE</label>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={handleHueChange}
            className="dm-color-hue-slider"
          />
        </div>

        {/* Alpha */}
        <div className="dm-color-row dm-color-row--alpha">
          <label>ALPHA</label>
          <div className="dm-color-alpha-wrapper">
            <div className="dm-color-alpha-track">
              <div
                className="dm-color-alpha-fill"
                style={{
                  background: `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))`,
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={alphaPercent}
                onChange={handleAlphaChange}
                className="dm-color-alpha-slider"
              />
            </div>
            <span className="dm-color-alpha-label">{alphaPercent}%</span>
          </div>
        </div>

        {/* RGB */}
        <div className="dm-color-row">
          <label>RGB</label>
          <div className="dm-color-rgb-inputs">
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.r}
              onChange={(e) => {
                const r = clamp(Number(e.target.value) || 0, 0, 255)
                const hsv = rgbToHsv(r, rgb.g, rgb.b)
                applyFromHsv(hsv.h, hsv.s, hsv.v)
              }}
              className="dm-color-input"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.g}
              onChange={(e) => {
                const g = clamp(Number(e.target.value) || 0, 0, 255)
                const hsv = rgbToHsv(rgb.r, g, rgb.b)
                applyFromHsv(hsv.h, hsv.s, hsv.v)
              }}
              className="dm-color-input"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.b}
              onChange={(e) => {
                const b = clamp(Number(e.target.value) || 0, 0, 255)
                const hsv = rgbToHsv(rgb.r, rgb.g, b)
                applyFromHsv(hsv.h, hsv.s, hsv.v)
              }}
              className="dm-color-input"
            />
          </div>
        </div>

        {/* HEX */}
        <div className="dm-color-row">
          <label>HEX</label>
          <input
            type="text"
            value={hex}
            onChange={handleHexChange}
            className="dm-color-input"
            placeholder="#ffffff"
          />
        </div>

        {/* Toolbar: Сброс + Пипетка */}
        <div className="dm-color-toolbar">
          <button
            className="dm-color-tool-btn"
            type="button"
            onClick={handleReset}
          >
            <span className="dm-color-tool-icon">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M3 6V2l2 2a5 5 0 1 1-1.2 3.3h1.8A3.3 3.3 0 1 0 8 3.7a3.2 3.2 0 0 0-2.3.9L3 6z" fill="currentColor" />
              </svg>
            </span>
            <span className="dm-color-tool-label">Сброс</span>
          </button>

          <button
            className="dm-color-tool-btn"
            type="button"
            onClick={handlePickEyedropper}
          >
            <span className="dm-color-tool-icon">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M11.2 2.2a1.6 1.6 0 0 1 2.3 2.3l-1.2 1.2-.8-.8.8-.8-.7-.7-.8.8-.8-.8z" fill="currentColor" />
                <path d="M10.1 5.1 4.7 10.5 4 12l1.5-.7 5.4-5.4z" fill="currentColor" />
                <path d="M3.3 11.9 2 14l2.1-1.3z" fill="currentColor" />
              </svg>
            </span>
            <span className="dm-color-tool-label">Пипетка</span>
          </button>
        </div>
      </div>

        </>
      )}

      {/* ======== GRADIENT TAB ======== */}
      {activeTab === 'gradient' && (
        <div className="dm-bg-picker--gradient">
          {/* Пресеты градиентов */}
          <div className="dm-gradient-presets">
            {/* Бесплатные пресеты */}
            <div className="dm-gradient-presets-section">
              <label className="dm-field-label">Бесплатные</label>
              <div className="dm-gradient-presets-grid">
                {GRADIENT_PRESETS.filter(p => !p.premium).map((preset, idx) => {
                  const presetCss = buildGradientCss(preset.type, preset.angle, preset.stops)
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="dm-gradient-preset-btn"
                      onClick={() => applyGradientPreset(preset)}
                      title={preset.name}
                    >
                      <div
                        className="dm-gradient-preset-preview"
                        style={{ background: presetCss }}
                      />
                      <span className="dm-gradient-preset-name">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Премиум пресеты */}
            <div className="dm-gradient-presets-section dm-gradient-presets-premium">
              <button
                type="button"
                className="dm-gradient-presets-premium-header"
                onClick={() => setPremiumExpanded(!premiumExpanded)}
              >
                <label className="dm-field-label">Премиум</label>
                <span className={`dm-premium-arrow ${premiumExpanded ? 'dm-premium-arrow-expanded' : ''}`}>▼</span>
              </button>
              {premiumExpanded && (
                <div className="dm-gradient-presets-grid">
                  {GRADIENT_PRESETS.filter(p => p.premium).map((preset, idx) => {
                    const presetCss = buildGradientCss(preset.type, preset.angle, preset.stops)
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="dm-gradient-preset-btn dm-gradient-preset-premium"
                        onClick={() => applyGradientPreset(preset)}
                        title={preset.name}
                      >
                        <div
                          className="dm-gradient-preset-preview"
                          style={{ background: presetCss }}
                        />
                        <span className="dm-gradient-preset-name">{preset.name}</span>
                        <span className="dm-gradient-preset-badge">в…</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="dm-gradient-row">
            <label>Тип</label>
            <div className="dm-gradient-type">
              <button
                type="button"
                className={`dm-gradient-type-btn ${gradientType === "linear" ? " dm-g-active" : ""}`}
                onClick={() => updateGradient({ type: "linear" })}
              >
                Линейный
              </button>
              <button
                type="button"
                className={`dm-gradient-type-btn ${gradientType === "radial" ? " dm-g-active" : ""}`}
                onClick={() => updateGradient({ type: "radial" })}
              >
                Радиальный
              </button>
            </div>
          </div>

          <div className="dm-gradient-row">
            <div className="dm-gradient-angle-header">
              <label>Угол</label>
              <span className="dm-gradient-angle-value">{gradientAngle}В°</span>
            </div>
            <div className="dm-gradient-angle-wrapper">
              <div className="dm-gradient-angle-visual" style={{ transform: `translate(-50%, -50%) rotate(${gradientAngle}deg)` }}>
                <div className="dm-gradient-angle-line" />
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => updateGradient({ angle: Number(e.target.value) || 0 })}
                className="dm-gradient-angle"
              />
            </div>
          </div>

          {/* Разделитель */}
          <div className="dm-gradient-divider"></div>

          {/* Стопы */}
          <div className="dm-gradient-stops-header">
            <label>Стопы (кликните на цвет для выбора)</label>
            <div className="dm-tooltip-wrapper">
              <button
                type="button"
                className="dm-btn dm-btn-ghost dm-btn-small"
                onClick={handleAddStop}
              >
                +
              </button>
              <div className="dm-tooltip">Добавить стоп</div>
            </div>
          </div>
          <div className="dm-gradient-stops">
            {gradStops.map((stop, idx) => (
              <div
                key={idx}
                className={`dm-stop ${selectedStopIdx === idx ? " dm-stop--selected" : ""}`}
              >
                <div
                  className="dm-stop-color-wrapper"
                  onClick={() => setSelectedStopIdx(idx)}
                  title={`Кликните для выбора стопа #${idx + 1}`}
                >
                  <div
                    className="dm-stop-color"
                    style={{ background: stop.color }}
                  />
                  {selectedStopIdx === idx && (
                    <div className="dm-stop-selected-indicator">✓</div>
                  )}
                  {gradStops.length > 1 && (
                    <button
                      type="button"
                      className="dm-stop-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveStop(idx)
                      }}
                      title="Удалить стоп"
                    >
                      Г-
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.pos}
                  onChange={(e) => handleStopPosChange(idx, Number(e.target.value) || 0)}
                  className="dm-stop-slider"
                />
                <span className="dm-stop-pos">{Math.round(stop.pos)}%</span>
              </div>
            ))}
          </div>

          {/* Редактор цвета выбранного стопа */}
          {selectedStop && (
            <div className="dm-gradient-color-editor">
              <div className={`dm-bg-picker--custom ${gradFlash ? " dm-bg-picker-flash" : ""}`}>
                {/* Квадрат H/S/V */}
                <div
                  className="dm-color-square"
                  style={{ backgroundColor: gHueHex }}
                  onMouseDown={handleGradSquareMouseDown}
                  onMouseMove={handleGradSquareMouseMove}
                  onMouseUp={handleGradSquareMouseUp}
                  onMouseLeave={handleGradSquareMouseLeave}
                >
                  <div className="dm-color-square-overlay-white" />
                  <div className="dm-color-square-overlay-black" />
                  <div
                    className="dm-color-square-thumb"
                    style={{
                      left: `${gThumbX}%`,
                      top: `${gThumbY}%`,
                    }}
                  />
                </div>

                {/* Hue */}
                <div className="dm-color-row dm-color-row--hue">
                  <label>HUE</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gHue}
                    onChange={handleGradHueChange}
                    className="dm-color-hue-slider"
                  />
                </div>

                {/* HEX */}
                <div className="dm-color-row">
                  <label>HEX</label>
                  <input
                    type="text"
                    value={selectedStopHex}
                    onChange={handleGradHexChange}
                    className="dm-color-input"
                    placeholder="#5865f2"
                  />
                </div>

                {/* Toolbar: Сброс + Пипетка */}
                <div className="dm-color-toolbar">
                  <button
                    className="dm-color-tool-btn"
                    type="button"
                    onClick={handleGradReset}
                  >
                    <span className="dm-color-tool-icon">
                      <svg viewBox="0 0 16 16" width="12" height="12">
                        <path d="M3 6V2l2 2a5 5 0 1 1-1.2 3.3h1.8A3.3 3.3 0 1 0 8 3.7a3.2 3.2 0 0 0-2.3.9L3 6z" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="dm-color-tool-label">Сброс</span>
                  </button>

                  <button
                    className="dm-color-tool-btn"
                    type="button"
                    onClick={handleGradPickEyedropper}
                  >
                    <span className="dm-color-tool-icon">
                      <svg viewBox="0 0 16 16" width="12" height="12">
                        <path d="M11.2 2.2a1.6 1.6 0 0 1 2.3 2.3l-1.2 1.2-.8-.8.8-.8-.7-.7-.8.8-.8-.8z" fill="currentColor" />
                        <path d="M10.1 5.1 4.7 10.5 4 12l1.5-.7 5.4-5.4z" fill="currentColor" />
                        <path d="M3.3 11.9 2 14l2.1-1.3z" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="dm-color-tool-label">Пипетка</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
