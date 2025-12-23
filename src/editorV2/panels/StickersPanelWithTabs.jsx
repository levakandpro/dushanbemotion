// src/editorV2/panels/StickersPanelWithTabs.jsx
import React, { useState, useMemo } from 'react'
import StickersPanel from './StickersPanel'
import StickerSettingsPanel from './StickerSettingsPanel'

export default function StickersPanelWithTabs({ project, onChangeProject }) {
  const [activeTab, setActiveTab] = useState('library')
  const [gridColumns, setGridColumns] = useState(1) // 1, 2, 4, 8

  const selectedSticker = useMemo(() => {
    if (!project?.selectedStickerId || !project?.stickerLayers) return null
    return project.stickerLayers.find(s => s && s.id === project.selectedStickerId) || null
  }, [project?.selectedStickerId, project?.stickerLayers])

  return (
    <div className="dm-stickers-panel-with-tabs">
      <div className="dm-right-panel-header">
        {/* Вкладки */}
        <div className="dm-sticker-tabs">
          <button
            className={`dm-sticker-tab ${activeTab === 'library' ? 'dm-sticker-tab-active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Библиотека
          </button>
          <button
            className={`dm-sticker-tab ${activeTab === 'settings' ? 'dm-sticker-tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </button>
        </div>

        {/* Переключатель сетки - под вкладками */}
        {activeTab === 'library' && (
          <div className="dm-stickers-grid-switcher" style={{ marginTop: '6px' }}>
            <button
              type="button"
              className={`dm-stickers-grid-switcher-btn ${gridColumns === 1 ? 'dm-stickers-grid-switcher-btn-active' : ''}`}
              onClick={() => setGridColumns(1)}
            >
              1x
            </button>
            <button
              type="button"
              className={`dm-stickers-grid-switcher-btn ${gridColumns === 2 ? 'dm-stickers-grid-switcher-btn-active' : ''}`}
              onClick={() => setGridColumns(2)}
            >
              2x
            </button>
            <button
              type="button"
              className={`dm-stickers-grid-switcher-btn ${gridColumns === 4 ? 'dm-stickers-grid-switcher-btn-active' : ''}`}
              onClick={() => setGridColumns(4)}
            >
              4x
            </button>
            <button
              type="button"
              className={`dm-stickers-grid-switcher-btn ${gridColumns === 8 ? 'dm-stickers-grid-switcher-btn-active' : ''}`}
              onClick={() => setGridColumns(8)}
            >
              8x
            </button>
          </div>
        )}
      </div>

      {/* Контент вкладок */}
      <div className="dm-sticker-tab-content">
        {activeTab === 'library' && (
          <StickersPanel 
            project={project}
            onChangeProject={onChangeProject}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
          />
        )}

        {activeTab === 'settings' && (
          <StickerSettingsPanel
            sticker={selectedSticker}
            project={project}
            stickerLayers={project?.stickerLayers || []}
            onUpdate={(updates) => {
              if (!selectedSticker) return
              const updatedLayers = (project.stickerLayers || []).map(s =>
                s.id === selectedSticker.id ? { ...s, ...updates } : s
              )
              onChangeProject({ ...project, stickerLayers: updatedLayers })
            }}
            onGroup={(stickerIds) => {
              if (!stickerIds || stickerIds.length < 2) return
              const groupId = `group_${Date.now()}`
              const updatedLayers = (project.stickerLayers || []).map(s =>
                stickerIds.includes(s.id) ? { ...s, groupId } : s
              )
              onChangeProject({ ...project, stickerLayers: updatedLayers })
            }}
            onUngroup={(stickerIds) => {
              if (!stickerIds) return
              const updatedLayers = (project.stickerLayers || []).map(s =>
                stickerIds.includes(s.id) ? { ...s, groupId: null } : s
              )
              onChangeProject({ ...project, stickerLayers: updatedLayers })
            }}
            onDelete={() => {
              if (!selectedSticker) return
              const updatedLayers = (project.stickerLayers || []).filter(s => s.id !== selectedSticker.id)
              const updatedStickerClips = (project.stickerClips || []).filter(
                clip => clip.elementId !== selectedSticker.id
              )
              onChangeProject({ 
                ...project, 
                stickerLayers: updatedLayers,
                stickerClips: updatedStickerClips,
                selectedStickerId: null
              })
              setActiveTab('library')
            }}
            onDuplicate={() => {
              if (!selectedSticker) return
              const newSticker = {
                ...selectedSticker,
                id: `sticker_${Date.now()}`,
                x: selectedSticker.x + 10,
                y: selectedSticker.y + 10,
                zIndex: Math.max(...(project.stickerLayers || []).map(s => s.zIndex || 0), 0) + 1
              }
              onChangeProject({ 
                ...project, 
                stickerLayers: [...(project.stickerLayers || []), newSticker],
                selectedStickerId: newSticker.id
              })
            }}
            onReset={() => {
              if (!selectedSticker) return
              const defaultValues = {
                width: 200,
                height: 200,
                x: 50,
                y: 50,
                rotation: 0,
                opacity: 1,
                flipX: false,
                flipY: false,
                filters: {
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                  hue: 0,
                  blur: 0
                },
                shadow: {
                  enabled: false,
                  offsetX: 0,
                  offsetY: 0,
                  blur: 0,
                  color: '#000000',
                  opacity: 1
                },
                stroke: {
                  enabled: false,
                  width: 0,
                  color: '#000000'
                },
                glowColor: '#ffffff',
                glowRadius: 0,
                filter: 'none'
              }
              const updatedLayers = (project.stickerLayers || []).map(s =>
                s.id === selectedSticker.id ? { ...s, ...defaultValues } : s
              )
              onChangeProject({ ...project, stickerLayers: updatedLayers })
            }}
          />
        )}

      </div>
    </div>
  )
}

