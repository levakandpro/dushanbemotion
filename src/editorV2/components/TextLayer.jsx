// TextLayer.jsx — ПОЛНАЯ ВЕРСИЯ (2-слойный текст: stroke + fill)
// ВАЖНО: этот файл заменяешь целиком тем, что ниже.

import React, { useCallback, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTextTransform } from '../utils/useTextTransform'
import { ensureFontFaceLoaded, getFontById, DM_FONTS } from '../fonts/fontRegistry'
import { getTextStyleForRender } from '../../textStyles'
import { useTextStyleStore } from '../store/useTextStyleStore'
import TextLayerHandles from './TextLayerHandles'

/**
 * Компонент текстового слоя с поддержкой выделения и трансформации
 */
export default function TextLayer({
  layer,
  isSelected,
  onSelect,
  onChangeLayer,
  canvasRef,
  project,
  onChangeProject,
  isSpacePressed = false,
  zoom = 1,
  offset = { x: 0, y: 0 },
  showSelectionBox = true
}) {
  // Ранний выход до любых хуков, если слоя нет
  if (!layer || !layer.id) {
    return null
  }

  // Миграция: добавляем дефолтные значения для старых слоёв
  if (layer.textStyleId === undefined) {
    layer.textStyleId = null
  }
  if (layer.textStyleEnabled === undefined) {
    layer.textStyleEnabled = false
  }
  if (layer.overrideColor === undefined) {
    layer.overrideColor = false
  }

  const textRef = React.useRef(null)
  const [textBounds, setTextBounds] = React.useState(null)

  // Загружаем шрифт по fontId если он указан
  React.useEffect(() => {
    if (layer?.fontId) {
      ensureFontFaceLoaded(layer.fontId).catch(() => {})
    }
  }, [layer?.fontId])

  // Определяем fontFamily для отображения
  const displayFontFamily = React.useMemo(() => {
    let fontFamily = 'system-ui'

    if (layer?.fontId) {
      const font = getFontById(layer.fontId)
      if (font) {
        fontFamily = font.family
        ensureFontFaceLoaded(layer.fontId).catch(() => {
          console.warn('Failed to load font:', layer.fontId)
        })
      } else {
        console.warn('Font not found by fontId:', layer.fontId)
      }
    } else if (layer?.fontFamily) {
      fontFamily = layer.fontFamily
    }

    if (
      fontFamily.includes(' ') ||
      fontFamily.includes('-') ||
      fontFamily.includes('+') ||
      fontFamily.includes('(') ||
      fontFamily.includes(')')
    ) {
      return `"${fontFamily}"`
    }
    return fontFamily
  }, [layer?.fontId, layer?.fontFamily])

  // Загружаем шрифт при изменении (без лишних логов)
  React.useEffect(() => {
    if (layer?.fontId) {
      ensureFontFaceLoaded(layer.fontId).catch((error) => {
        console.warn('Failed to load font in TextLayer:', layer.fontId, error)
      })
    }
  }, [layer?.id, layer?.fontId])

  // Хук для трансформации (только если есть onChangeLayer)
  const transform = useTextTransform(
    layer,
    onChangeLayer || (() => {}),
    canvasRef,
    isSpacePressed
  )

  // Получаем активный стиль из пресетов (глобальный, для fallback)
  const activeTextStyleId = useTextStyleStore((s) => s.activeTextStyleId)

  // Определяем, какой id стиля применять к КОНКРЕТНОМУ слою
  const layerTextStyleId = layer.textStyleEnabled
    ? (layer.textStyleId || activeTextStyleId)
    : null

  // Если layerTextStyleId = null → не использовать пресет вообще
  const hasTextPreset = !!layerTextStyleId

  // Мемоизируем стиль пресета для синхронного обновления
  const { style: presetStyle = {} } = React.useMemo(() => {
    return hasTextPreset
      ? (getTextStyleForRender(layerTextStyleId) || { style: {} })
      : { style: {} }
  }, [hasTextPreset, layerTextStyleId])

  // Предзагружаем шрифт из пресета при изменении стиля
  React.useEffect(() => {
    if (hasTextPreset && presetStyle.fontFamily) {
      const cleanFontFamily = presetStyle.fontFamily.replace(/^["']|["']$/g, '')
      const font = DM_FONTS.find(f => f.family === cleanFontFamily)

      if (font && font.id) {
        ensureFontFaceLoaded(font.id).catch(() => {})
      }
    }
  }, [hasTextPreset, presetStyle.fontFamily])

  // Получаем реальные размеры текстового элемента по глифам в координатах canvas
  // КРИТИЧЕСКИ ВАЖНО: НЕ пересчитываем bounds во время drag
  React.useEffect(() => {
    if (isSelected && textRef.current && canvasRef?.current) {
      const updateBounds = () => {
        if (transform.isDragging) return
        if (!textRef.current || !canvasRef?.current) return

        const canvasRect = canvasRef.current.getBoundingClientRect()

        // ✅ ВАЖНО: мерим FILL слой, не STROKE (2-слойный рендер)
        const textSpan =
          textRef.current.querySelector('span[data-text-fill="1"]') ||
          textRef.current.querySelector('span')

        if (!textSpan) {
          const glyphRect = textRef.current.getBoundingClientRect()
          const padding = 8

          setTextBounds({
            width: glyphRect.width + padding * 2,
            height: glyphRect.height + padding * 2,
            left: glyphRect.left - canvasRect.left - padding,
            top: glyphRect.top - canvasRect.top - padding
          })
          return
        }

        const computed = window.getComputedStyle(textSpan)
        const fontSize = parseFloat(computed.fontSize) || 48
        const textContent = textSpan.textContent || ''
        const textLines = textContent.split('\n').filter(l => l.trim().length > 0)
        const linesCount = textLines.length || 1

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const textRect = textSpan.getBoundingClientRect()
          const padding = 8
          setTextBounds({
            width: textRect.width + padding * 2,
            height: textRect.height + padding * 2,
            left: textRect.left - canvasRect.left - padding,
            top: textRect.top - canvasRect.top - padding
          })
          return
        }

        ctx.font = `${computed.fontStyle} ${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`
        ctx.textBaseline = 'alphabetic'

        const range = document.createRange()
        range.selectNodeContents(textSpan)
        const rangeRect = range.getBoundingClientRect()
        const textRect = rangeRect.width > 0 && rangeRect.height > 0
          ? rangeRect
          : textSpan.getBoundingClientRect()

        let totalWidth = 0
        let firstLineAscent = 0
        let lastLineDescent = 0

        textLines.forEach((line, index) => {
          if (!line.trim()) return
          const metrics = ctx.measureText(line.trim())
          const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
          const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2

          totalWidth = Math.max(totalWidth, metrics.width)
          if (index === 0) firstLineAscent = ascent
          if (index === textLines.length - 1) lastLineDescent = descent
        })

        let realTextHeight = 0

        if (linesCount === 1) {
          realTextHeight = firstLineAscent + lastLineDescent
        } else {
          const walker = document.createTreeWalker(
            textSpan,
            NodeFilter.SHOW_TEXT,
            null
          )

          let firstTextNode = null
          let lastTextNode = null
          let node = walker.nextNode()

          while (node) {
            if (node.textContent.trim()) {
              if (!firstTextNode) firstTextNode = node
              lastTextNode = node
            }
            node = walker.nextNode()
          }

          if (firstTextNode && lastTextNode && firstTextNode !== lastTextNode) {
            const firstRange = document.createRange()
            firstRange.setStart(firstTextNode, 0)
            const firstLineEnd = firstTextNode.textContent.indexOf('\n') >= 0
              ? firstTextNode.textContent.indexOf('\n')
              : firstTextNode.textContent.length
            firstRange.setEnd(firstTextNode, firstLineEnd)
            const firstLineRect = firstRange.getBoundingClientRect()

            const lastRange = document.createRange()
            const lastLineStart = lastTextNode.textContent.lastIndexOf('\n') + 1
            lastRange.setStart(lastTextNode, lastLineStart)
            lastRange.setEnd(lastTextNode, lastTextNode.textContent.length)
            const lastLineRect = lastRange.getBoundingClientRect()

            realTextHeight = lastLineRect.bottom - firstLineRect.top
          } else {
            const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.2
            const lineHeightValue = typeof lineHeight === 'number' && lineHeight > 1
              ? lineHeight * fontSize
              : fontSize * 1.2

            realTextHeight =
              firstLineAscent +
              (linesCount - 1) * lineHeightValue +
              lastLineDescent
          }
        }

        const padding = 8

        let adjustedTop = 0
        let adjustedLeft = 0

        const walker = document.createTreeWalker(
          textSpan,
          NodeFilter.SHOW_TEXT,
          null
        )
        const textNode = walker.nextNode()

        if (!textNode) {
          const glyphTopCanvas = (textRect.top - canvasRect.top - offset.y) / zoom
          const glyphLeftCanvas = (textRect.left - canvasRect.left - offset.x) / zoom
          const glyphWidthCanvas = totalWidth / zoom

          adjustedTop = glyphTopCanvas
          adjustedLeft = glyphLeftCanvas + (textRect.width / zoom - glyphWidthCanvas) / 2

          setTextBounds({
            width: (totalWidth + padding * 2) / zoom,
            height: (realTextHeight + padding * 2) / zoom,
            left: adjustedLeft - padding / zoom,
            top: adjustedTop - padding / zoom
          })
          return
        }

        if (linesCount === 1) {
          const textRange = document.createRange()
          textRange.selectNodeContents(textNode)
          const textRangeRect = textRange.getBoundingClientRect()

          const firstLine = textLines[0].trim()
          const metrics = ctx.measureText(firstLine)
          const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
          const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2

          const baseline = textRangeRect.bottom - descent
          const glyphTopScreen = baseline - ascent

          const glyphTopCanvas = (glyphTopScreen - canvasRect.top - offset.y) / zoom
          const glyphLeftCanvas = (textRangeRect.left - canvasRect.left - offset.x) / zoom
          const glyphWidthCanvas = totalWidth / zoom

          adjustedTop = glyphTopCanvas
          adjustedLeft = glyphLeftCanvas + (textRangeRect.width / zoom - glyphWidthCanvas) / 2
        } else {
          const firstRange = document.createRange()
          firstRange.setStart(textNode, 0)
          const firstLineEnd = textNode.textContent.indexOf('\n') >= 0
            ? textNode.textContent.indexOf('\n')
            : textNode.textContent.length
          firstRange.setEnd(textNode, firstLineEnd)
          const firstLineRect = firstRange.getBoundingClientRect()

          const firstLine = textLines[0].trim()
          const metrics = ctx.measureText(firstLine)
          const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
          const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2

          const baseline = firstLineRect.bottom - descent
          const glyphTopScreen = baseline - ascent

          const glyphTopCanvas = (glyphTopScreen - canvasRect.top - offset.y) / zoom
          const glyphLeftCanvas = (textRect.left - canvasRect.left - offset.x) / zoom
          const glyphWidthCanvas = totalWidth / zoom

          adjustedTop = glyphTopCanvas
          adjustedLeft = glyphLeftCanvas + (textRect.width / zoom - glyphWidthCanvas) / 2
        }

        setTextBounds({
          width: (totalWidth + padding * 2) / zoom,
          height: (realTextHeight + padding * 2) / zoom,
          left: adjustedLeft - padding / zoom,
          top: adjustedTop - padding / zoom
        })
      }

      const timeoutId = setTimeout(updateBounds, 0)
      updateBounds()

      const resizeObserver = new ResizeObserver(() => {
        if (transform.isDragging) return
        setTimeout(updateBounds, 0)
      })
      if (textRef.current) resizeObserver.observe(textRef.current)

      const spanElement =
        textRef.current?.querySelector('span[data-text-fill="1"]') ||
        textRef.current?.querySelector('span')

      if (spanElement) resizeObserver.observe(spanElement)

      return () => {
        clearTimeout(timeoutId)
        resizeObserver.disconnect()
      }
    } else {
      setTextBounds(null)
    }
  }, [
    isSelected,
    layer,
    canvasRef,
    layer.text,
    layer.fontSize,
    layer.fontFamily,
    layer.fontWeight,
    layer.fontStyle,
    layer.lineHeight,
    zoom,
    offset.x,
    offset.y,
    transform.isDragging
  ])

  // Обработчик клика по тексту для выделения
  const handleTextClick = useCallback((e) => {
    e.stopPropagation()
    if (onSelect && layer?.id) {
      onSelect(layer.id)
    }
  }, [layer?.id, onSelect])

  // Обработчик контекстного меню (правый клик)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onSelect && layer?.id) {
      onSelect(layer.id)
    }
    
    // Удаляем все предыдущие контекстные меню
    const existingMenus = document.querySelectorAll('.dm-context-menu')
    existingMenus.forEach(menu => {
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu)
      }
    })
    
    // Создаем простое контекстное меню
    const contextMenu = document.createElement('div')
    contextMenu.className = 'dm-context-menu'
    contextMenu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: rgba(15, 23, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 0;
      z-index: 10000;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      min-width: 150px;
    `
    
    const menuItems = [
      { label: 'Дублировать', action: 'duplicate' },
      { label: 'Удалить', action: 'delete' },
      { label: 'На передний план', action: 'bring-forward' },
      { label: 'На задний план', action: 'send-backward' },
      { label: layer.locked ? 'Разблокировать' : 'Заблокировать', action: 'toggle-lock' }
    ]
    
    menuItems.forEach(item => {
      const menuItem = document.createElement('div')
      menuItem.textContent = item.label
      menuItem.style.cssText = `
        padding: 8px 16px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      `
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(100, 150, 255, 0.15)'
        menuItem.style.color = 'rgba(255, 255, 255, 0.95)'
      })
      
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent'
        menuItem.style.color = 'rgba(255, 255, 255, 0.8)'
      })
      
      menuItem.addEventListener('click', () => {
        handleMenuAction(item.action)
        if (contextMenu && contextMenu.parentNode) {
          contextMenu.parentNode.removeChild(contextMenu)
        }
      })
      
      contextMenu.appendChild(menuItem)
    })
    
    document.body.appendChild(contextMenu)
    
    // Удаляем меню при клике вне его
    const removeMenu = (e) => {
      if (contextMenu && !contextMenu.contains(e.target)) {
        if (contextMenu.parentNode) {
          contextMenu.parentNode.removeChild(contextMenu)
        }
        document.removeEventListener('click', removeMenu)
      }
    }
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu)
    }, 100)
  }, [layer?.id, layer?.locked, onSelect])

  // Обработчик действий контекстного меню
  const handleMenuAction = useCallback((action) => {
    if (!onChangeLayer || !layer) return
    
    switch (action) {
      case 'duplicate':
        // Создаем копию слоя
        const duplicatedLayer = {
          ...layer,
          id: `text_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          x: (layer.x || 50) + 5,
          y: (layer.y || 50) + 5,
          zIndex: (layer.zIndex || 50) + 1
        }
        // Добавляем через onChangeProject если доступно
        if (project && onChangeProject) {
          const updatedProject = {
            ...project,
            textLayers: [...(project.textLayers || []), duplicatedLayer],
            selectedTextId: duplicatedLayer.id
          }
          onChangeProject(updatedProject)
        }
        break
        
      case 'delete':
        // Удаляем слой через onChangeProject если доступно
        if (project && onChangeProject) {
          const updatedProject = {
            ...project,
            textLayers: (project.textLayers || []).filter(t => t.id !== layer.id),
            selectedTextId: null
          }
          onChangeProject(updatedProject)
        }
        break
        
      case 'bring-forward':
        onChangeLayer({ zIndex: (layer.zIndex || 50) + 1 })
        break
        
      case 'send-backward':
        onChangeLayer({ zIndex: Math.max((layer.zIndex || 50) - 1, 1) })
        break
        
      case 'toggle-lock':
        onChangeLayer({ locked: !layer.locked })
        break
    }
  }, [layer, onChangeLayer, project, onChangeProject])

  // Используем transform.x/y если есть, иначе layer.x/y
  const transformData = layer.transform || {}
  const posX = transformData.x !== undefined ? transformData.x : (layer.x !== undefined ? layer.x : 50)
  const posY = transformData.y !== undefined ? transformData.y : (layer.y !== undefined ? layer.y : 50)

  // Получаем FX эффекты
  const fx = layer.fx || {}

  // Контур (outline)
  const outline = fx.outline?.[0]
  const outlineActive =
    Array.isArray(fx.outline) &&
    fx.outline.length > 0 &&
    outline &&
    outline.enabled === true
  const outlineWidth = outlineActive ? (outline.width || 4) : 0
  const outlineColor = outlineActive ? (outline.color || '#000000') : 'transparent'
  const outlineOpacity = outlineActive ? (outline.opacity !== undefined ? outline.opacity : 1) : 0

  // Свечение (glow)
  const glow = fx.glow || {}
  const glowEnabled = glow.enabled === true
  const glowStrength = glowEnabled ? (glow.strength || 0.8) : 0
  const glowColor = glowEnabled ? (glow.color || '#ffffff') : 'transparent'

  // Тень (shadow)
  const shadow = fx.shadow || {}
  const shadowEnabled = shadow && shadow.enabled === true
  const textShadow = shadowEnabled
    ? `${shadow.offsetX || 0}px ${shadow.offsetY || 0}px ${shadow.blur || 0}px ${(() => {
        const color = shadow.color || '#000000'
        const opacity = shadow.opacity !== undefined ? shadow.opacity : 1
        if (color.startsWith('#')) {
          const hex = color.replace('#', '')
          const r = parseInt(hex.substring(0, 2), 16)
          const g = parseInt(hex.substring(2, 4), 16)
          const b = parseInt(hex.substring(4, 6), 16)
          return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }
        return color
      })()}`
    : 'none'

  // Получаем новые эффекты
  const longShadow = layer.longShadow || { enabled: false }
  const stack = layer.stack || { enabled: false }
  const emboss = layer.emboss || { enabled: false }
  const fake3d = layer.fake3d || { enabled: false }
  const doubleStroke = layer.doubleStroke || { enabled: false }
  const skewEffect = layer.skew || { enabled: false }
  const stickerShadow = layer.stickerShadow || { enabled: false }

  // Комбинируем тени: свечение + тень + новые эффекты
  const combinedTextShadow = useMemo(() => {
    const shadows = []

    // Свечение
    if (glowEnabled) {
      let glowRgba = 'transparent'
      if (glowColor.startsWith('#')) {
        const hex = glowColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        glowRgba = `rgba(${r}, ${g}, ${b}, ${glowStrength})`
      } else {
        glowRgba = glowColor
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180
        const x = Math.cos(angle) * (glowStrength * 20)
        const y = Math.sin(angle) * (glowStrength * 20)
        shadows.push(`${x}px ${y}px ${glowStrength * 30}px ${glowRgba}`)
      }
    }

    // Обычная тень
    if (shadowEnabled && textShadow !== 'none') {
      shadows.push(textShadow)
    }

    // Long Shadow
    if (longShadow.enabled && longShadow.length > 0) {
      const angle = (longShadow.angle || 45) * Math.PI / 180
      const length = longShadow.length || 50
      const softness = longShadow.softness || 0
      const opacity = longShadow.opacity || 0.5
      const color = longShadow.color || '#000000'

      let colorRgba = color
      if (color.startsWith('#')) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        colorRgba = `rgba(${r}, ${g}, ${b}, ${opacity})`
      }

      for (let i = 1; i <= length; i++) {
        const x = Math.cos(angle) * i
        const y = Math.sin(angle) * i
        shadows.push(`${x}px ${y}px ${softness}px ${colorRgba}`)
      }
    }

    // Stack (слои со смещением)
    if (stack.enabled && stack.layers > 0) {
      const layers = stack.layers || 3
      const xStep = stack.xStep || 2
      const yStep = stack.yStep || 2
      const opacity = stack.opacity || 0.3
      const color = stack.color || '#000000'

      let colorRgba = color
      if (color.startsWith('#')) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        colorRgba = `rgba(${r}, ${g}, ${b}, ${opacity})`
      }

      for (let i = 1; i <= layers; i++) {
        shadows.push(`${xStep * i}px ${yStep * i}px 0 ${colorRgba}`)
      }
    }

    // Emboss / Deboss
    if (emboss.enabled) {
      const strength = emboss.strength || 0.5
      const angle = (emboss.angle || 135) * Math.PI / 180
      const contrast = emboss.contrast || 0.5
      const mode = emboss.mode || 'emboss'

      const distance = strength * 3
      const x1 = Math.cos(angle) * distance
      const y1 = Math.sin(angle) * distance
      const x2 = -x1
      const y2 = -y1

      if (mode === 'emboss') {
        shadows.push(`${x1}px ${y1}px 2px rgba(255, 255, 255, ${contrast * 0.6})`)
        shadows.push(`${x2}px ${y2}px 2px rgba(0, 0, 0, ${contrast * 0.6})`)
      } else {
        shadows.push(`${x1}px ${y1}px 2px rgba(0, 0, 0, ${contrast * 0.6})`)
        shadows.push(`${x2}px ${y2}px 2px rgba(255, 255, 255, ${contrast * 0.6})`)
      }
    }

    // Fake 3D (экструзия)
    if (fake3d.enabled && fake3d.depthLayers > 0) {
      const depthLayers = fake3d.depthLayers || 10
      const xOffset = fake3d.xOffset || 2
      const yOffset = fake3d.yOffset || 2
      const opacity = fake3d.opacity || 0.5
      const color = fake3d.color || '#000000'

      let colorRgba = color
      if (color.startsWith('#')) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        const fadeOpacity = opacity / depthLayers
        colorRgba = `rgba(${r}, ${g}, ${b}, ${fadeOpacity})`
      }

      for (let i = 1; i <= depthLayers; i++) {
        shadows.push(`${xOffset * i}px ${yOffset * i}px 0 ${colorRgba}`)
      }
    }

    // Double Stroke (внутренняя обводка через text-shadow)
    if (doubleStroke.enabled) {
      const stroke1Width = doubleStroke.stroke1Width || 4
      const stroke1Color = doubleStroke.stroke1Color || '#000000'

      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180
        const x = Math.cos(angle) * stroke1Width
        const y = Math.sin(angle) * stroke1Width
        shadows.push(`${x}px ${y}px 0 ${stroke1Color}`)
      }
    }

    return shadows.length > 0 ? shadows.join(', ') : 'none'
  }, [
    glowEnabled, glowStrength, glowColor,
    shadowEnabled, textShadow,
    longShadow.enabled, longShadow.angle, longShadow.length, longShadow.softness, longShadow.opacity, longShadow.color,
    stack.enabled, stack.layers, stack.xStep, stack.yStep, stack.opacity, stack.color,
    emboss.enabled, emboss.strength, emboss.angle, emboss.contrast, emboss.mode,
    fake3d.enabled, fake3d.depthLayers, fake3d.xOffset, fake3d.yOffset, fake3d.opacity, fake3d.color,
    doubleStroke.enabled, doubleStroke.stroke1Width, doubleStroke.stroke1Color
  ])

  // text-shadow из пресета
  const presetTextShadow = presetStyle?.textShadow
  // есть ли градиент в самом пресете
  const hasPresetGradient = !!presetStyle?.backgroundImage
  // итоговая тень: либо FX, либо пресет
  const effectiveTextShadow =
    combinedTextShadow && combinedTextShadow !== 'none'
      ? combinedTextShadow
      : (presetTextShadow || 'none')

  const fill = layer.fill || layer.color || '#000000'

  // Логика цвета: использовать цвет/градиент из пресета или цвет слоя
  const usePresetColor = hasTextPreset && !layer.overrideColor

  const effectiveFill = usePresetColor
    ? (presetStyle?.backgroundImage ? presetStyle.backgroundImage : (presetStyle?.color || presetStyle?.fill || fill))
    : fill

  // Мемоизируем цвет контура
  const outlineRgba = useMemo(() => {
    if (!outlineActive || !outline || outlineWidth === 0) return 'transparent'
    if (outlineColor.startsWith('#')) {
      const hex = outlineColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${outlineOpacity})`
    }
    return outlineColor
  }, [outlineActive, outline, outlineColor, outlineOpacity, outlineWidth])

  // Стиль обводки
  const presetStroke =
    hasTextPreset && presetStyle?.WebkitTextStrokeWidth && presetStyle?.WebkitTextStrokeColor
      ? `${presetStyle.WebkitTextStrokeWidth} ${presetStyle.WebkitTextStrokeColor}`
      : null

  const strokeStyle = doubleStroke.enabled
    ? `${doubleStroke.stroke2Width || 8}px ${doubleStroke.stroke2Color || '#ffffff'}`
    : (outlineActive && outlineWidth > 0
      ? `${outlineWidth}px ${outlineRgba}`
      : (presetStroke || '0px transparent'))
  const isGradient = typeof fill === 'string' && fill && (
    fill.includes('linear-gradient') ||
    fill.includes('radial-gradient')
  )

  // Маска
  const mask = layer.mask || {}
  const maskImageSrc = mask.src || mask.imageUrl || null
  const maskEnabled = !isGradient && mask.enabled === true
  const maskScale = mask.scale || 1

  const [maskBackground, setMaskBackground] = React.useState(() => {
    return maskImageSrc || null
  })

  React.useEffect(() => {
    if (maskImageSrc !== maskBackground) {
      setMaskBackground(maskImageSrc || null)
    }
  }, [maskImageSrc, maskBackground])

  const hasMask = maskEnabled && !!maskBackground

  const maskBackgroundImage = useMemo(() => {
    if (!maskBackground) return undefined
    return maskBackground.startsWith('url(')
      ? maskBackground
      : `url(${maskBackground})`
  }, [maskBackground])

  // Контейнер
  const container = layer.container || {}
  const containerType = container.type || 'none'
  const hasContainer = !isGradient && containerType !== 'none'

  const getContainerColor = () => {
    if (!hasContainer || isGradient) return 'transparent'
    const color = container.color || '#000000'
    const alpha = container.alpha !== undefined ? container.alpha : 0.5

    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return color
  }

  const containerColor = getContainerColor()
  const containerPadding = container.padding !== undefined ? container.padding : 16
  const containerAutoWidth = container.autoWidth !== undefined ? container.autoWidth : true
  const containerBorderRadius = containerType === 'rounded' ? '8px' : '0px'

  // Анимации
  const animation = layer.animation || {}
  const animLoop = animation.loop || { type: 'none', intensity: 0.5 }

  // Полный текст слоя
  const fullText = layer.text || layer.content || 'ТЕКСТ'
  let renderedText = fullText

  const getAnimationStyle = () => {
    const style = {}
    if (animLoop.type && animLoop.type !== 'none') {
      const intensity = animLoop.intensity || 0.5
      const animNameMap = {
        pulse: 'dmAnimLooppulse',
        wobble: 'dmAnimLoopwobble',
        vibration: 'dmAnimLoopvibration'
      }
      const animName = animNameMap[animLoop.type] || 'dmAnimLooppulse'
      style.animation = `${animName} ${1 + intensity}s ease-in-out infinite`
    }
    return style
  }

  const animationStyle = getAnimationStyle()

  // FX filters
  const [fxFilterString, setFxFilterString] = React.useState('none')

  React.useEffect(() => {
    Promise.all([
      layer.fxStack && Array.isArray(layer.fxStack) && layer.fxStack.length > 0
        ? import('../fx/fxToCss').then(m => m.fxStackToCssFilter(layer.fxStack)).catch(() => 'none')
        : Promise.resolve('none'),
      layer.lutStack && Array.isArray(layer.lutStack) && layer.lutStack.length > 0
        ? import('../luts/lutToCss').then(m => m.lutStackToCssFilter(layer.lutStack)).catch(() => '')
        : Promise.resolve('')
    ]).then(([fxFilter, lutFilter]) => {
      const filters = [fxFilter !== 'none' ? fxFilter : '', lutFilter].filter(Boolean)
      setFxFilterString(filters.length > 0 ? filters.join(' ') : 'none')
    }).catch(e => {
      console.warn('Failed to load filters:', e)
      setFxFilterString('none')
    })
  }, [layer.fxStack, layer.lutStack])

  // Базовый стиль текста: мерж пресета + переопределения из слоя
  const baseTextStyle = useMemo(() => {
    const baseFromPreset = hasTextPreset ? presetStyle : {}

    const preferLayerFont = !!layer.fontId || !!layer.fontFamily

    return {
      ...baseFromPreset,
      fontSize: layer.fontSize ? `${layer.fontSize}px` : undefined,
      fontFamily: hasTextPreset
        ? (preferLayerFont ? displayFontFamily : (baseFromPreset.fontFamily || displayFontFamily))
        : displayFontFamily,
      fontWeight: hasTextPreset
        ? (preferLayerFont ? (layer.fontWeight ?? baseFromPreset.fontWeight ?? 700) : (baseFromPreset.fontWeight ?? 700))
        : (layer.fontWeight ?? 700),
      fontStyle: hasTextPreset
        ? (preferLayerFont ? (layer.fontStyle || baseFromPreset.fontStyle || 'normal') : (baseFromPreset.fontStyle || layer.fontStyle || 'normal'))
        : (layer.fontStyle || 'normal'),
      textAlign: layer.textAlign || 'center',
      lineHeight: layer.lineHeight || 1.1,
      letterSpacing: hasTextPreset
        ? (baseFromPreset.letterSpacing ?? (layer.letterSpacing != null ? `${layer.letterSpacing}em` : undefined))
        : (layer.letterSpacing != null ? `${layer.letterSpacing}em` : undefined),
      textTransform: hasTextPreset
        ? (baseFromPreset.textTransform ?? (layer.allCaps != null ? (layer.allCaps ? 'uppercase' : 'none') : 'none'))
        : (layer.allCaps != null ? (layer.allCaps ? 'uppercase' : 'none') : 'none'),
      textDecoration: layer.underline ? 'underline' : 'none',
      opacity: layer.opacity ?? 1,
      whiteSpace: 'nowrap',
      ...(hasTextPreset && layer.overrideColor
        ? {
            color: layer.color || layer.fill || baseFromPreset.color,
            backgroundImage: 'none',
            WebkitBackgroundClip: 'initial',
            backgroundClip: 'initial',
          }
        : {}),
    }
  }, [
    hasTextPreset,
    presetStyle,
    displayFontFamily,
    layer.fontId,
    layer.fontFamily,
    layer.fontSize,
    layer.fontWeight,
    layer.fontStyle,
    layer.textAlign,
    layer.lineHeight,
    layer.letterSpacing,
    layer.allCaps,
    layer.underline,
    layer.opacity,
    layer.overrideColor,
    layer.color,
    layer.fill,
  ])

  // 3D перспектива
  const perspective3d = layer.perspective3d || {
    enabled: false,
    tiltX: 0,
    tiltY: 0,
    rotateZ: 0,
    perspective: 1000,
    origin: 'center'
  }

  // ==========================
  // ✅ 2-LAYER TEXT (stroke + fill)
  // ==========================
  const hasStrokeLayer = strokeStyle && strokeStyle !== '0px transparent'

  const wrap2LayerStyle = {
    position: 'relative',
    display: 'inline-block',
  }

  const strokeLayerSpanStyle = {
    ...baseTextStyle,
    position: 'absolute',
    inset: 0,
    display: 'inline-block',
    pointerEvents: 'none',

    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    background: 'none',
    backgroundImage: 'none',
    WebkitBackgroundClip: 'initial',
    backgroundClip: 'initial',

    WebkitTextStroke: strokeStyle,
    textStroke: strokeStyle,

    textShadow: 'none',
    paintOrder: 'stroke',
  }

  // Обычный DOM-рендер текста
  return (
    <div
      ref={textRef}
      className={`dm-layer-text ${isSelected ? 'dm-layer-text-selected' : ''}`}
      data-has-gradient={isGradient ? 'true' : 'false'}
      onClick={handleTextClick}
      onContextMenu={handleContextMenu}
      onMouseDown={isSelected ? transform.handleMoveStart : undefined}
      onTouchStart={isSelected ? transform.handleTouchMoveStart : undefined}
      style={{
        position: 'absolute',
        left: `${posX}%`,
        top: `${posY}%`,
        transform: (() => {
          const align = layer.textAlign || 'center'
          const transformData = layer.transform || {}
          const rotation = transformData.rotation !== undefined ? transformData.rotation : (layer.rotation || 0)
          if (align === 'center') return `translate(-50%, -50%) rotate(${rotation}deg)`
          if (align === 'left') return `translate(-100%, -50%) rotate(${rotation}deg)`
          if (align === 'right') return `translate(0, -50%) rotate(${rotation}deg)`
          return `translate(-50%, -50%) rotate(${rotation}deg)`
        })(),
        transformOrigin: 'center center',
        pointerEvents: layer.isLocked ? 'none' : 'auto',
        zIndex: layer.zIndex || 50,
        outline: 'none',
        cursor: isSelected ? 'move' : 'pointer',
        filter: (() => {
          const filters = []
          if (fxFilterString !== 'none') filters.push(fxFilterString)
          if (stickerShadow.enabled) {
            const lift = stickerShadow.lift || 20
            const blur = stickerShadow.blur || 30
            const opacity = stickerShadow.opacity || 0.3
            filters.push(`drop-shadow(0 ${lift}px ${blur}px rgba(0, 0, 0, ${opacity}))`)
          }
          return filters.length > 0 ? filters.join(' ') : undefined
        })(),
        perspective: perspective3d.enabled ? `${perspective3d.perspective}px` : undefined
      }}
    >
      <div
        style={{
          display: 'inline-block',
          transform: (() => {
            const transforms = []
            if (perspective3d.enabled) {
              transforms.push(`rotateX(${perspective3d.tiltX}deg) rotateY(${perspective3d.tiltY}deg) rotateZ(${perspective3d.rotateZ}deg)`)
            }
            if (skewEffect.enabled) {
              const skewX = skewEffect.skewX || 0
              const skewY = skewEffect.skewY || 0
              transforms.push(`skew(${skewX}deg, ${skewY}deg)`)
            }
            return transforms.length > 0 ? transforms.join(' ') : undefined
          })(),
          transformOrigin: perspective3d.enabled
            ? (perspective3d.origin === 'bottom' ? 'center bottom' : 'center center')
            : undefined,
          transformStyle: perspective3d.enabled ? 'preserve-3d' : undefined,
          backgroundColor: isGradient ? 'transparent' : (hasContainer ? containerColor : 'transparent'),
          padding: isGradient ? '0' : (hasContainer ? `${containerPadding}px` : '0'),
          borderRadius: isGradient ? '0' : (hasContainer ? containerBorderRadius : '0'),
          width: isGradient ? 'auto' : (hasContainer && !containerAutoWidth ? '100%' : 'auto'),
          minWidth: isGradient ? 'auto' : (hasContainer && containerAutoWidth ? 'fit-content' : 'auto'),
          ...animationStyle
        }}
      >
        {hasMask ? (
          <span
            key={`text-${layer.id}-${layerTextStyleId || 'none'}`}
            style={wrap2LayerStyle}
          >
            {hasStrokeLayer && (
              <span data-text-stroke="1" style={strokeLayerSpanStyle}>
                {renderedText}
              </span>
            )}

            <span
              data-text-fill="1"
              style={{
                ...baseTextStyle,
                ...(usePresetColor === false && layer.overrideColor
                  ? {
                      backgroundImage: 'none',
                      WebkitBackgroundClip: 'initial',
                      WebkitTextFillColor: 'initial',
                      backgroundClip: 'initial',
                      color: fill,
                    }
                  : {
                      backgroundImage: maskBackgroundImage,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: 'transparent',
                      backgroundSize: `${maskScale * 100}%`,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: 'transparent',
                    }),
                textShadow: effectiveTextShadow,
                display: 'inline-block',

                // ❗ stroke убран отсюда (только в stroke-слое)
                WebkitTextStroke: undefined,
                textStroke: undefined,
                paintOrder: 'fill',
              }}
            >
              {renderedText}
            </span>
          </span>
        ) : isGradient ? (
          <span
            key={`text-${layer.id}-${layerTextStyleId || 'none'}`}
            style={wrap2LayerStyle}
          >
            {hasStrokeLayer && (
              <span data-text-stroke="1" style={strokeLayerSpanStyle}>
                {renderedText}
              </span>
            )}

            <span
              data-text-fill="1"
              style={{
                ...baseTextStyle,
                ...(usePresetColor === false && layer.overrideColor
                  ? {
                      background: 'none',
                      backgroundImage: 'none',
                      WebkitBackgroundClip: 'initial',
                      WebkitTextFillColor: 'initial',
                      backgroundClip: 'initial',
                      color: effectiveFill,
                    }
                  : {
                      background: effectiveFill,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }),
                textShadow: effectiveTextShadow,
                display: 'inline-block',

                WebkitTextStroke: undefined,
                textStroke: undefined,
                paintOrder: 'fill',
              }}
            >
              {renderedText}
            </span>
          </span>
        ) : (
          <span
            key={`text-${layer.id}-${layerTextStyleId || 'none'}`}
            style={wrap2LayerStyle}
          >
            {hasStrokeLayer && (
              <span data-text-stroke="1" style={strokeLayerSpanStyle}>
                {renderedText}
              </span>
            )}

<span
  data-text-fill="1"
  style={{
    ...baseTextStyle,

    // если пресет даёт backgroundImage — делаем градиент внутри текста
    ...(presetStyle?.backgroundImage
      ? {
          backgroundImage: presetStyle.backgroundImage,
          backgroundRepeat: presetStyle.backgroundRepeat || 'no-repeat',
          backgroundSize: presetStyle.backgroundSize || 'cover',
          backgroundPosition: presetStyle.backgroundPosition || 'center',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }
      : {}),

    // если пресет НЕ даёт backgroundImage — обычный цвет
    ...(!presetStyle?.backgroundImage ? { color: effectiveFill } : {}),

    textShadow: effectiveTextShadow,
    display: 'inline-block',

    WebkitTextStroke: undefined,
    textStroke: undefined,
    paintOrder: 'fill',
  }}
>
  {renderedText}
</span>

          </span>
        )}
      </div>

      {/* Хэндлы resize/rotate для выделенного текста */}
      {isSelected && !layer.locked && (
        <TextLayerHandles
          layer={layer}
          onResizeStart={transform.handleResizeStart}
          onRotateStart={transform.handleRotateStart}
        />
      )}
    </div>
  )
}
