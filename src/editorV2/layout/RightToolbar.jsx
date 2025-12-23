// src/editorV2/layout/RightToolbar.jsx
import React from 'react'

// Прямые URL к файлам из public/ - гарантированно работает!
const stic2Icon = '/assets/stic2.svg'
const musicNoteIcon = '/assets/music-icon.svg'
const bgIcon = '/assets/bg-icon.svg'
const textIcon = '/assets/text-icon.svg'
const videoIcon = '/assets/video-icon.svg'
const iconsIcon = '/assets/icons-icon.svg'
const bazaIcon = '/assets/baza.png'

const TOOLS = [
  { id: 'background', label: 'Фон', icon: '●', imageSrc: bgIcon },
  { id: 'text', label: 'Текст', icon: 'T', imageSrc: textIcon },
  { id: 'stickers', label: 'Стикеры', icon: 'image', imageSrc: stic2Icon },
  { id: 'audio', label: 'Музыка', icon: '♪', imageSrc: musicNoteIcon },
  { id: 'beats', label: 'Видео', icon: '▣', imageSrc: videoIcon },
  { id: 'icons', label: 'Иконки', icon: '◇', imageSrc: iconsIcon },
  { id: 'rhymes', label: 'BAZA', icon: 'B', imageSrc: bazaIcon },
]

function ToolIcon({ src, label }) {
  if (!src) return <span className="editor-v2-tool-icon">•</span>
  return (
    <span
      className="editor-v2-tool-icon-mask"
      aria-label={label}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
      }}
    />
  )
}

export default function RightToolbar({ activeTool, onChangeTool }) {
  return (
    <nav className="editor-v2-toolbar">
      <div className="editor-v2-toolbar-scroll">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            type="button"
            className={
              'editor-v2-tool-btn' +
              (activeTool === tool.id ? ' editor-v2-tool-btn-active' : '') +
              (tool.id === 'background' ? ' editor-v2-tool-btn-background' : '') +
              (tool.id === 'stickers' ? ' editor-v2-tool-btn-stickers' : '')
            }
            onClick={() => onChangeTool(tool.id)}
          >
            <ToolIcon src={tool.imageSrc} label={tool.label} />
            <span className="editor-v2-tool-label">{tool.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

