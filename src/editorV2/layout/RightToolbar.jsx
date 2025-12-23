// src/editorV2/layout/RightToolbar.jsx
import React from 'react'

// Импорты иконок из локальной директории assets
import stic2Icon from '../../assets/stic2.svg'
import musicNoteIcon from '../../assets/iconmusic/music-note-svgrepo-com.svg'
import bgIcon from '../../assets/fon.svg'
import textIcon from '../../assets/text.svg'
import videoIcon from '../../assets/video.svg'
import iconsIcon from '../../assets/icon.svg'
import bazaIcon from '../../assets/baza.png'

const TOOLS = [
  { id: 'background', label: 'Фон', icon: 'в§‰', imageSrc: bgIcon },
  { id: 'text', label: 'Текст', icon: 'T', imageSrc: textIcon },
  { id: 'stickers', label: 'Стикеры', icon: 'image', imageSrc: stic2Icon },
  { id: 'audio', label: 'Музыка', icon: 'в™Є', imageSrc: musicNoteIcon },
  { id: 'beats', label: 'Видео', icon: 'в–Ј', imageSrc: videoIcon },
  { id: 'icons', label: 'Иконки', icon: 'в-Ћ', imageSrc: iconsIcon },
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
