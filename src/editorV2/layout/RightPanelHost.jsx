// src/editorV2/layout/RightPanelHost.jsx
import React from 'react'

// Панели
import BackgroundPanel from '../panels/BackgroundPanel'
import StickersPanelWithTabs from '../panels/StickersPanelWithTabs'
import IconsPanel from '../panels/IconsPanel'
import TextPanel from '../panels/TextPanel'
import FootagePanel from '../panels/FootagePanel'
import MusicPanel from '../panels/MusicPanel'
import RhymesPanel from '../panels/RhymesPanel'

export default function RightPanelHost({ activeTool, project, onChangeProject, activeBackgroundCategory, editorState, onPreviewVideoAspectChange, onClose }) {
  let content = null

  switch (activeTool) {
    case 'background':
      content = (
        <BackgroundPanel
          key="background"
          project={project}
          onChangeProject={onChangeProject}
          editorState={editorState}
          activeCategory={activeBackgroundCategory}
          onPrefetchCategory={(category) => {
            // Prefetch логика будет в BackgroundPanel
            console.log('🚀 Prefetch from RightPanelHost:', category);
          }}
        />
      )
      break

    case 'text':
      content = (
        <TextPanel
          key="text"
          project={project}
          onChangeProject={onChangeProject}
          onClose={onClose}
        />
      )
      break

    case 'stickers':
      content = (
        <StickersPanelWithTabs 
          key="stickers"
          project={project}
          onChangeProject={onChangeProject}
        />
      )
      break

    case 'audio':
    case 'music':
      content = (
        <MusicPanel key="audio" />
      )
      break

    case 'beats':
      content = (
        <FootagePanel 
          key="beats"
          project={project}
          onChangeProject={onChangeProject}
          onPreviewVideoAspectChange={onPreviewVideoAspectChange}
        />
      )
      break

    case 'icons':
      content = (
        <IconsPanel 
          key="icons"
          project={project}
          onChangeProject={onChangeProject}
        />
      )
      break

    case 'rhymes':
      content = (
        <RhymesPanel key="rhymes" />
      )
      break

    default:
      content = null
  }

  return (
    <div className="editor-v2-panel-host">
      {content}
    </div>
  )
}
