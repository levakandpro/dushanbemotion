// src/editorV2/panels/TextPanel.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createTextLayer, DEFAULT_TEXT_COLOR } from '../utils/textLayers'
import { useTextPanelTabs } from '../context/TextPanelTabsContext'
import { useIsMobile } from '../../hooks/useMobileGestures'

import TextPanelContent from './text/TextPanelContent'
import TextPanelFont from './text/TextPanelFont'
import TextPanelColor from './text/TextPanelColor'
import TextPanelTypography from './text/TextPanelTypography'
import TextPanelFX from './text/TextPanelFX'
import TextPanelMask from './text/TextPanelMask'
import TextPanelContainer from './text/TextPanelContainer'
import TextPanelWeightStyle from './text/TextPanelWeightStyle'
import TextPanelTransform from './text/TextPanelTransform'
import TextPanelTextProps from './text/TextPanelTextProps'
import TextPanelPerspective from './text/TextPanelPerspective'
import TextPanelLongShadow from './text/TextPanelLongShadow'
import TextPanelStack from './text/TextPanelStack'
import TextPanelEmboss from './text/TextPanelEmboss'
import TextPanelDoubleStroke from './text/TextPanelDoubleStroke'
import TextPanelSkew from './text/TextPanelSkew'
import TextPanelStickerShadow from './text/TextPanelStickerShadow'
import TextPanelFake3D from './text/TextPanelFake3D'
import TextStylesGrid from '../components/textStyles/TextStylesGrid'

// Новая схема вкладок:
// ТЕКСТ / СТИЛЬ / ЭФФЕКТЫ / ШАБЛОНЫ
const TEXT_SECTIONS = [
  { id: 'text', label: 'ТЕКСТ' },
  { id: 'style', label: 'СТИЛЬ' },
  { id: 'effects', label: 'ЭФФЕКТЫ' },
  { id: 'templates', label: 'ШАБЛОНЫ' },
]

export default function TextPanel(props) {
  const { project, onChangeProject, onClose } = props

  const [showSymbolsModal, setShowSymbolsModal] = useState(false)
  const [copiedToastVisible, setCopiedToastVisible] = useState(false)
  const copiedToastTimerRef = React.useRef(null)

  const SYMBOL_SECTIONS = useMemo(
    () => [
      {
        title: 'ИСЛАМ',
        items: `☪ 🕌 🕋 🌙 ⭐ ✨ 🟢 ⚜ ۞ ۩ ۝ ٭ ٰ ۜ ۛ ۚ ۙ ۘ ۗ ۖ ۝ ۞ ﷽ ﷲ ﷺ ﷻ ؏ ؋ ؍`,
      },
      {
        title: 'ПЕРСИДСКИЕ',
        items: `۞ ۩ ۝ ۜ ۛ ۚ ۙ ۘ ۗ ۖ ە ۔ ۓ ۑ ې ۏ ێ ۍ ی ۋ ۊ ۉ ۈ ۇ ۆ ۅ ۄ ۃ ۂ ہ ۀ ٭ ٮ ٯ ٰ ﷲ ﷺ ﷽ ٱ ۺ ۻ ۼ ۿ ٱٰ ۞٭ ۩٭ ۝٭ ✦ ✧ ★ ☆ ⚜ ✺ ✶ ❀ ❁ ❂ ❃ ❊ ❋ ❈ ❉ ❇`,
      },
      {
        title: 'МУЗЫКА',
        items: `♩ ♪ ♫ ♬ ♭ ♮ ♯ 𝄞 𝄢 𝄡 𝄪 𝄫 𝄲 𝄳 𝄴 𝄵 𝄶 𝄷 𝄸 𝄹 𝄺 𝄻 𝄼 𝄽 𝄾 𝄿 🎵 🎶 🎼 🎧 🎤 🎷 🎸 🎹 🥁 🪕 🪗 🪘`,
      },
      {
        title: 'ПОГОДА',
        items: `☀ ☼ ☁ ☂ ☔ ☃ ☄ ☾ ☽ 🌙 🌛 🌜 🌚 🌝 ⚡ ☇ 🌩 🌧 🌦 🌨 ❄ ❅ ❆ 🌪 🌫 🌬 ☉ ☊ ☋ ☌ ☍`,
      },
      {
        title: 'КРЕСТЫ, КРЕСТИКИ, СНЕЖИНКИ, ЦВЕТОЧКИ',
        items: `✚ ✛ ✜ ✝ ✞ ✟ ✠ ✡ ☩ ☨ ☦ ☥ × ✕ ✖ ✗ ✘ ✙ ❄ ❅ ❆ ❇ ❈ ❉ ❊ ✿ ❀ ❁ ❂ ❃ ✾ ✽ ✼ ✻ ✺ ✹ ✸ ✷ ✶ ⚘ ⚜`,
      },
      {
        title: 'СИМВОЛЫ — СЕРДЕЧКИ / ЛЮБОВЬ',
        items: `♥ ♡ ❤ ❥ ❣ ღ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💔 ❤️‍🔥 ❤️‍🩹 🤍 🖤 🤎 💙 💚 💛 💜 🩷 🩵 💟 💑 💏 💋 ❦ ❧ ❥ ❣ 💒 💐 🌹 🌸 🌺 🌷 🌼 🌻 💮`,
      },
      {
        title: 'ЗВЁЗДЫ / ИСКРЫ',
        items: `★ ☆ ✡ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❇ ❈ ❉ ❊`,
      },
      {
        title: 'СТРЕЛКИ',
        items: `← ↑ → ↓ ↔ ↕ ↖ ↗ ↘ ↙ ⇐ ⇑ ⇒ ⇓ ⇔ ⇕ ⟵ ⟶ ⟷ ⟸ ⟹ ⟺ ↩ ↪ ↶ ↷ ↺ ↻ ➔ ➜ ➝ ➞ ➟ ➠ ➢ ➣ ➤ ➥ ➦ ➧ ➨ ➩ ➪ ➫ ➬ ➭ ➮ ➯ ⬅ ⬆ ➡ ⬇ ↯`,
      },
      {
        title: 'ГЕОМЕТРИЯ / ФИГУРЫ / РАМКИ',
        items: `○ ● ◯ ◉ ◎ ◌ ◍ ◐ ◑ ◒ ◓ □ ■ ▢ ▣ ▤ ▥ ▦ ▧ ▨ ▩ △ ▲ ▽ ▼ ◁ ◀ ▷ ▶ ◆ ◇ ◈ ◊ ⬜ ⬛ 🔲 🔳 ⧈ ⧅ ⧆ ⧇ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ │ ─ ╱ ╲ ╳ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ ║ ═ ⎯ ⎻ ⎼ ⎽ ⎾ ⎿`,
      },
      {
        title: 'СПЕЦ СИМВОЛЫ — МАТЕМАТИКА / ЛОГИКА',
        items: `∞ ∅ ∈ ∉ ∋ ∌ ⊂ ⊃ ⊆ ⊇ ⊄ ⊅ ⊊ ⊋ ∧ ∨ ¬ ⊕ ⊗ ⊙ ⊘ ⊞ ⊟ ⊠ ⊡ ± × ÷ √ ∑ ∏ ∫ ∬ ∭ ∮ ∯ ∰ ≈ ≅ ≃ ≡ ≠ ≤ ≥ < > ∝ ∴ ∵ ∠ ∟ ⟂ ∥ ∂ ∆ ∇ ℵ ℶ ℷ ℸ`,
      },
      {
        title: 'ЗНАКИ / ПРЕДУПРЕЖДЕНИЯ / ВАЖНО',
        items: `⚠ ⛔ 🚫 ❗ ❕ ❓ ❔ ‼ ⁉ ☢ ☣ ☠`,
      },
      {
        title: '✔ ГАЛОЧКИ / СТАТУС / МАРКЕРЫ',
        items: `✓ ✔ ✗ ✘ ☑ ☒ ☓ ◉ ◎ ● ○`,
      },
      {
        title: '⏱ ВРЕМЯ / СКОРОСТЬ / ПРОЦЕСС',
        items: `⏳ ⌛ ⏰ ⏱ ⏲ ⏯ ▶ ⏸ ⏹ ⏺`,
      },
      {
        title: 'UI / ИНТЕРФЕЙС',
        items: `≡ ☰ ⋮ ⋯ ⌂ ⌘ ⌥ ⌫ ⌦ ⏎ ␣`,
      },
      {
        title: 'СПЕЦ СИМВОЛЫ — ЗНАКИ / ПУНКТУАЦИЯ / ДЕКОР',
        items: `© ® ™ ℠ № § ¶ † ‡ • ‣ ⁃ ⁄ ⁂ ⁎ ⁑ ⁕ … ‥ ‧ ‰ ‱ “ ” „ ‟ ‘ ’ ‚ ‛ « » ‹ › ¡ ¿ ‽ ° ℃ ℉ ′ ″ ‴`,
      },
      {
        title: 'СПЕЦ СИМВОЛЫ — ВАЛЮТЫ',
        items: `$ € £ ¥ ₩ ₽ ₺ ₴ ₸ ₹ ₼ ₾ ₿ ¢`,
      },
      {
        title: 'СПЕЦ СИМВОЛЫ — ЦИФРЫ',
        items: `① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ⑪ ⑫ ⑬ ⑭ ⑮ ⑯ ⑰ ⑱ ⑲ ⑳ ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ ⓪ ⓵ ⓶ ⓷ ⓸ ⓹ ⓺ ⓻ ⓼ ⓽ ⓾`,
      },
      {
        title: 'АЛФАВИТ (обведённый латиница)',
        items: `ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ ⓖ ⓗ ⓘ ⓙ ⓚ ⓛ ⓜ ⓝ ⓞ ⓟ ⓠ ⓡ ⓢ ⓣ ⓤ ⓥ ⓦ ⓧ ⓨ ⓩ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ`,
      },
      {
        title: 'СЛАВЯНСКИЕ БУКВЫ (расширение кириллицы)',
        items: `Ѣ ѣ Ѳ ѳ Ѵ ѵ Ѧ ѧ Ѫ ѫ Ѭ ѭ Ѯ ѯ Ѱ ѱ Ҁ ҁ Ѡ ѡ Ѥ ѥ Ѩ ѩ Ѯ ѯ Ѱ ѱ`,
      },
      {
        title: 'РУНЫ — СКАНДИНАВСКИЙ ФУТАРК',
        items: `ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ`,
      },
      {
        title: 'СМАЙЛЫ / ЛИЦА',
        items: `☺ ☻ ☹ 🙂 🙃 😉 😊 😇 😌 😍 😘 😗 😙 😚 😋 😛 😜 😝 😏 😒 😞 😔 😟 😕 🙁 ☹ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🫢 🫣 😵 😵‍💫 🤐 😷 🤒 🤕 🤢 🤮 🤧 🥴 😴 😪 🤤 😈 👿 👹 👺 💀 ☠ 👻 👽 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾`,
      },
      {
        title: '👑 КОРОНЫ',
        items: `👑 ♔ ♕ ♚ ♛ 🤴 👸 🫅 ⚜ ⚚ ⚝ ⚞ ⚟ ✠ ☩ ☦ ⚔ 🏰 ★ ☆ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ♖ ♜ ♝ ♞ ♟ ⚖ 🏯`,
      },
      {
        title: 'ИЕРОГЛИФЫ (примерные блоки)',
        items: `日 月 火 水 木 金 土 山 川 田 口 人 女 子 王 玉 目 手 心 上 下 中 大 小 本 学 校 生 先 私 何 年 時 国 家 愛`,
      },
    ],
    []
  )

  const textAreaRef = React.useRef(null)
  const cursorRef = React.useRef({ start: null, end: null })

  const handleCursorChange = useCallback((start, end) => {
    cursorRef.current = {
      start: typeof start === 'number' ? start : null,
      end: typeof end === 'number' ? end : null,
    }
  }, [])

  const showCopiedToast = useCallback(() => {
    setCopiedToastVisible(true)
    if (copiedToastTimerRef.current) clearTimeout(copiedToastTimerRef.current)
    copiedToastTimerRef.current = setTimeout(() => {
      setCopiedToastVisible(false)
    }, 900)
  }, [])

  const copyToClipboard = useCallback(async (value) => {
    const text = String(value || '')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        // ignore
      }
    }
  }, [])

  const textLayers = useMemo(() => {
    if (!project || !Array.isArray(project.textLayers)) return []
    return project.textLayers
  }, [project])

  const [localSelectedId, setLocalSelectedId] = useState(null)

  const effectiveSelectedId = useMemo(() => {
    if (props.selectedTextId) return props.selectedTextId
    if (localSelectedId) return localSelectedId
    if (project && project.selectedTextId) return project.selectedTextId
    return textLayers[0]?.id || null
  }, [props.selectedTextId, localSelectedId, project, textLayers])

  const currentLayer = useMemo(() => {
    if (!effectiveSelectedId) return null
    return textLayers.find(l => l && l.id === effectiveSelectedId) || null
  }, [effectiveSelectedId, textLayers])

  const updateProject = useCallback(
    patch => {
      if (!project || !onChangeProject) return
      onChangeProject({
        ...project,
        ...patch
      })
    },
    [project, onChangeProject]
  )

  const handleSelectTextId = useCallback(
    nextId => {
      setLocalSelectedId(nextId || null)
      updateProject({ selectedTextId: nextId || null })
    },
    [updateProject]
  )

  const handleChangeCurrentLayer = useCallback(
    changes => {
      if (!currentLayer || !Array.isArray(textLayers)) {
        console.warn('⚠️ handleChangeCurrentLayer: currentLayer or textLayers missing', { currentLayer: !!currentLayer, textLayers: Array.isArray(textLayers) })
        return
      }

      console.log('📝 Updating layer:', { layerId: currentLayer.id, changes })
      console.log('📝 Current layer before update:', currentLayer)

      const updatedLayers = textLayers.map(layer => {
        if (!layer || layer.id !== currentLayer.id) return layer
        
        // КРИТИЧЕСКИ ВАЖНО: При обновлении transform нужно правильно merge
        // Если changes содержит только transform, то merge его с существующим transform
        let updated = { ...layer }
        
        if (changes.transform && typeof changes.transform === 'object') {
          // Merge transform правильно, сохраняя все существующие свойства
          updated = {
            ...layer,
            ...changes,
            transform: {
              ...(layer.transform || {}), // Сохраняем все существующие свойства transform
              ...changes.transform // Обновляем только переданные свойства (x, y)
            }
          }
        } else {
          // Для всех остальных изменений - обычный merge
          updated = {
            ...layer,
            ...changes
          }
        }
        
        console.log('✅ Layer updated:', { 
          layerId: layer.id, 
          fontSize: updated.fontSize,
          opacity: updated.opacity,
          allCaps: updated.allCaps,
          underline: updated.underline 
        })
        return updated
      })

      // Обновляем проект с новыми слоями
      const updatedProject = {
        ...project,
        textLayers: updatedLayers
      }
      
      // Если обновленный слой был выбранным, обновляем его в проекте
      if (currentLayer.id === effectiveSelectedId) {
        updatedProject.selectedTextId = effectiveSelectedId
      }
      
      onChangeProject(updatedProject)
    },
    [currentLayer, textLayers, updateProject]
  )

  const insertSymbol = useCallback(
    (symbol) => {
      const s = String(symbol || '')
      if (!s) return

      const currentText = String(currentLayer?.text || 'D MOTION')
      let nextText = currentText

      const el = textAreaRef.current
      const selStart = typeof el?.selectionStart === 'number' ? el.selectionStart : cursorRef.current.start
      const selEnd = typeof el?.selectionEnd === 'number' ? el.selectionEnd : cursorRef.current.end

      if (typeof selStart === 'number' && typeof selEnd === 'number') {
        const a = Math.max(0, Math.min(selStart, currentText.length))
        const b = Math.max(0, Math.min(selEnd, currentText.length))
        nextText = currentText.slice(0, a) + s + currentText.slice(b)
      } else {
        nextText = currentText + s
      }

      handleChangeCurrentLayer({ text: nextText })

      requestAnimationFrame(() => {
        const node = textAreaRef.current
        if (!node) return
        const basePos = typeof selStart === 'number' ? selStart : nextText.length
        const pos = Math.min(basePos + s.length, nextText.length)
        try {
          node.focus()
          node.setSelectionRange(pos, pos)
          cursorRef.current = { start: pos, end: pos }
        } catch {
          // ignore
        }
      })
    },
    [currentLayer, handleChangeCurrentLayer]
  )

  const longPressTimerRef = React.useRef(null)
  const longPressFiredRef = React.useRef(false)
  const LONG_PRESS_MS = 450

  const onSymbolPointerDown = useCallback(
    (symbol) => {
      longPressFiredRef.current = false
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true
      }, LONG_PRESS_MS)
    },
    []
  )

  const onSymbolPointerUp = useCallback(
    (symbol) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (longPressFiredRef.current) {
        copyToClipboard(symbol)
        showCopiedToast()
      }
      else insertSymbol(symbol)
    },
    [copyToClipboard, insertSymbol, showCopiedToast]
  )

  const onSymbolPointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // добавить слой
  const handleAddTextLayer = useCallback(() => {
    const backgroundType = project?.backgroundType || null
    const base = createTextLayer('D MOTION', backgroundType)
    // Преобразуем структуру для совместимости
    const layer = {
      ...base,
      text: base.content || 'D MOTION',
      // Жёстко применяем наш дефолтный цвет
      color: DEFAULT_TEXT_COLOR,
      fill: DEFAULT_TEXT_COLOR,
      fontFamily: 'Roboto', // будет заменено при выборе шрифта
      fontSize: base.fontSize || 72, // Большой размер по умолчанию
      fontWeight: base.fontWeight || 600,
      fontStyle: base.fontStyle || 'normal',
      textAlign: base.textAlign || 'center',
      lineHeight: base.lineHeight || 1.1,
      letterSpacing: base.letterSpacing || 0,
      opacity: 1,
      capsMode: 'none',
      mono: false,
      smallCaps: false,
      underline: false,
      fx: {
        outline: [],
        shadow: {
          enabled: false,
          offsetX: 4,
          offsetY: 6,
          blur: 16,
          color: '#000000',
          opacity: 0.7
        },
        glow: null,
        bevel: null,
        longShadow: null,
        marker: null
      },
      mask: {
        enabled: false,
        source: 'none',
        gradientId: null
      },
      container: {
        type: 'none',
        color: '#000000',
        alpha: 0.5,
        padding: 16,
        autoWidth: true
      },
      transform: {
        rotation: base.rotation || 0,
        flipX: base.flipX || false,
        flipY: base.flipY || false,
        x: base.x || 50,
        y: base.y || 50
      },
      deform: {
        type: 'none',
        intensity: 0.5,
        frequency: 1
      },
      textStyleId: null,
      textStyleEnabled: false,
      overrideColor: false
    }
    const nextLayers = [...textLayers, layer]
    const newClip = {
      id: `tclip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      elementId: layer.id,
      startTime: 0,
      endTime: 10 // 10 секунд по умолчанию
    }
    const nextClips = [...(project?.textClips || []), newClip]

    updateProject({
      textLayers: nextLayers,
      textClips: nextClips,
      selectedTextId: layer.id,
      selectedTextClipId: newClip.id,
      selectedTextClipIds: [newClip.id]
    })
    setLocalSelectedId(layer.id)
  }, [textLayers, updateProject, project])

  // удалить слой
  const handleDeleteCurrentLayer = useCallback(() => {
    if (!currentLayer) return
    const remaining = textLayers.filter(l => l.id !== currentLayer.id)
    const nextSelected = remaining[0]?.id || null
    const remainingClips = (project?.textClips || []).filter(
      clip => clip.elementId !== currentLayer.id
    )
    updateProject({
      textLayers: remaining,
      textClips: remainingClips,
      selectedTextId: nextSelected
    })
    setLocalSelectedId(nextSelected)
  }, [currentLayer, textLayers, updateProject, project])

  const isMobile = useIsMobile()
  const contextTabs = useTextPanelTabs()
  // Всегда используем локальное состояние для веб версии
  const [activeSection, setActiveSection] = useState('text')
  
  // Синхронизируем с контекстом на мобильных (двусторонняя синхронизация)
  React.useEffect(() => {
    if (isMobile) {
      // Обновляем локальное состояние из контекста
      if (contextTabs.activeSection !== activeSection) {
        setActiveSection(contextTabs.activeSection)
      }
    }
  }, [isMobile, contextTabs.activeSection])
  
  // Обновляем контекст при изменении локального состояния на мобильных
  const handleSetActiveSection = React.useCallback((section) => {
    setActiveSection(section)
    if (isMobile && contextTabs.setActiveSection) {
      contextTabs.setActiveSection(section)
    }
  }, [isMobile, contextTabs])

  // Автоматически создаём слой с "D MOTION", если его нет
  useEffect(() => {
    const hasLayers = Array.isArray(textLayers) && textLayers.length > 0
    if (!hasLayers && project && onChangeProject) {
      const backgroundType = project?.backgroundType || null
      const base = createTextLayer('D MOTION', backgroundType)
      // Преобразуем структуру для совместимости
      const layer = {
        ...base,
        text: base.content || 'D MOTION',
        // Жёстко применяем наш дефолтный цвет
        color: DEFAULT_TEXT_COLOR,
        fill: DEFAULT_TEXT_COLOR,
      fontFamily: 'Roboto',
      fontSize: base.fontSize || 72, // Большой размер по умолчанию
        fontWeight: base.fontWeight || 600,
        fontStyle: base.fontStyle || 'normal',
        textAlign: base.textAlign || 'center',
        lineHeight: base.lineHeight || 1.1,
        letterSpacing: base.letterSpacing || 0,
        opacity: 1,
        capsMode: 'none',
        mono: false,
        smallCaps: false,
        underline: false,
        fx: {
          outline: [],
          shadow: {
            enabled: false,
            offsetX: 4,
            offsetY: 6,
            blur: 16,
            color: '#000000',
            opacity: 0.7
          },
          glow: null,
          bevel: null,
          longShadow: null,
          marker: null
        },
        mask: {
          enabled: false,
          source: 'none',
          gradientId: null
        },
        container: {
          type: 'none',
          color: '#000000',
          alpha: 0.5,
          padding: 16,
          autoWidth: true
        },
        transform: {
          rotation: base.rotation || 0,
          flipX: base.flipX || false,
          flipY: base.flipY || false,
          x: base.x || 50,
          y: base.y || 50
        },
        deform: {
          type: 'none',
          intensity: 0.5,
          frequency: 1
        },
        textStyleId: null,
        textStyleEnabled: false,
        overrideColor: false
      }
      const newClip = {
        id: `tclip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        elementId: layer.id,
        startTime: 0,
        endTime: 10 // 10 секунд по умолчанию
      }
      updateProject({
        ...project,
        textLayers: [layer],
        textClips: [...(project.textClips || []), newClip],
        selectedTextId: layer.id,
        selectedTextClipId: newClip.id,
        selectedTextClipIds: [newClip.id]
      })
      setLocalSelectedId(layer.id)
    }
  }, [textLayers, project, onChangeProject])

  const commonSectionProps = {
    project,
    textLayers,
    currentLayer,
    selectedTextId: effectiveSelectedId,
    onChangeProject: updateProject,
    onChangeLayer: handleChangeCurrentLayer,
    onSelectTextId: handleSelectTextId
  }

  const hasLayer = !!currentLayer
  const layers = Array.isArray(textLayers) ? textLayers : []

  const layerOptions = useMemo(
    () =>
      layers.map(layer => ({
        id: layer.id,
        label: layer.name || layer.text || 'Текст'
      })),
    [layers]
  )

  const handleSelectChange = (e) => {
    const nextId = e.target.value || ''
    handleSelectTextId(nextId || null)
  }

  return (
    <div className="editor-v2-panel dm-text-panel">
      <div className="dm-text-panel-surface">
        {/* Табы секций - на мобильных перемещаются в header через CSS */}
        <div className="dm-text-panel-tabs-row">
          <div className="dm-text-panel-tabs">
            {TEXT_SECTIONS.map(section => {
              const isActive = section.id === activeSection
              return (
                <button
                  key={section.id}
                  type="button"
                  className={
                    'dm-text-panel-tab-btn' +
                    (isActive ? ' dm-text-panel-tab-btn-active' : '')
                  }
                  onClick={() => handleSetActiveSection(section.id)}
                >
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="dm-text-panel-body">
          {activeSection === 'text' && (
            <>
              {/* Поле ввода текста */}
              <TextPanelContent
                {...commonSectionProps}
                onOpenSymbols={() => setShowSymbolsModal(true)}
                textAreaRef={textAreaRef}
                onCursorChange={handleCursorChange}
              />

              {/* Шрифт */}
              <TextPanelFont {...commonSectionProps} />
            </>
          )}

          {hasLayer ? (
            <>
              {activeSection === 'style' && (
                <>
                  {/* Толщина и Стиль */}
                  <TextPanelWeightStyle {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Свойства текста: размер, прозрачность, заглавные, подчеркивание */}
                  <TextPanelTextProps {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Базовая типографика: межстрочный / межбуквенный */}
                  <TextPanelTypography {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Контейнер текста */}
                  <TextPanelContainer {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Цвет и градиент */}
                  <TextPanelColor {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Базовые FX: контур / тень / свечение */}
                  <TextPanelFX {...commonSectionProps} />
                </>
              )}

              {activeSection === 'effects' && (
                <>
                  {/* Маска (изображение) */}
                  <TextPanelMask {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Трансформация (поворот, позиция) */}
                  <TextPanelTransform {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Плоскость (3D перспектива) */}
                  <TextPanelPerspective {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Длинная тень */}
                  <TextPanelLongShadow {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Слои / Смещение */}
                  <TextPanelStack {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Тиснение */}
                  <TextPanelEmboss {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Двойная обводка */}
                  <TextPanelDoubleStroke {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Перекос */}
                  <TextPanelSkew {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Тень наклейки */}
                  <TextPanelStickerShadow {...commonSectionProps} />
                  
                  <div className="dm-effects-separator" />
                  
                  {/* Экструзия (Fake 3D) */}
                  <TextPanelFake3D {...commonSectionProps} />
                </>
              )}

              {activeSection === 'templates' && (
                <div className="dm-templates-container">
                  <TextStylesGrid
                  currentLayer={currentLayer}
                  onChangeLayer={handleChangeCurrentLayer}
                  selectedTextId={effectiveSelectedId}
                />
                </div>
              )}
            </>
          ) : activeSection !== 'text' && (
            <div className="dm-text-panel-empty">
              Создайте текстовый слой для настройки
            </div>
          )}
        </div>
      </div>

      {showSymbolsModal &&
        createPortal(
          <div className="dm-text-symbols-backdrop" onClick={() => setShowSymbolsModal(false)}>
            <div className="dm-text-symbols-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="dm-text-symbols-close"
                onClick={() => setShowSymbolsModal(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
              <div className="dm-text-symbols-title">ЗНАЧКИ И СИМВОЛЫ</div>
              {copiedToastVisible && (
                <div className="dm-text-symbols-copied">СКОПИРОВАН В БУФЕР</div>
              )}
              <div className="dm-text-symbols-body">
                {SYMBOL_SECTIONS.map((sec) => {
                  const tokens = String(sec.items || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')
                    .filter(Boolean)
                  return (
                    <div key={sec.title} className="dm-text-symbols-section">
                      <div className="dm-text-symbols-section-title">{sec.title}</div>
                      <div className="dm-text-symbols-grid">
                        {tokens.map((t, i) => (
                          <button
                            key={`${sec.title}_${i}`}
                            type="button"
                            className="dm-text-symbols-token"
                            onPointerDown={() => onSymbolPointerDown(t)}
                            onPointerUp={() => onSymbolPointerUp(t)}
                            onPointerLeave={onSymbolPointerCancel}
                            onPointerCancel={onSymbolPointerCancel}
                            title="Клик — вставить в текст. Удержание — копировать"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
