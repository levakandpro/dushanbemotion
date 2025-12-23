// src/editorV2/panels/LutsPanel.jsx
import React, { useState, useMemo } from 'react'
import { 
  LUT_REGISTRY, 
  LUT_CATEGORIES, 
  getAllLutCategories,
  getLutsByCategory
} from '../luts/lutRegistry'
import { LutCategory } from '../luts/lutTypes'
import './LutsPanel.css'

/**
 * Панель LUT (Look-Up Tables)
 */
export default function LutsPanel({ project, onChangeProject }) {
  const [activeCategory, setActiveCategory] = useState(LutCategory.DMOTION_CINEMATIC)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })
  
  
  // Определяем тип выбранного слоя
  const selectedLayerType = useMemo(() => {
    if (!project) return null
    
    if (project.selectedStickerId) {
      const layer = project.stickerLayers?.find(l => l.id === project.selectedStickerId)
      return layer ? 'sticker' : null
    }
    if (project.selectedTextId) return 'text'
    if (project.selectedIconId) return 'icon'
    if (project.selectedVideoId) return 'video'
    if (project.selectedFrameId) return 'image'
    
    return null
  }, [project])

  // Получаем текущий выбранный слой
  const selectedLayer = useMemo(() => {
    if (!project || !selectedLayerType) return null
    
    switch (selectedLayerType) {
      case 'sticker':
        return project.stickerLayers?.find(l => l.id === project.selectedStickerId)
      case 'text':
        return project.textLayers?.find(l => l.id === project.selectedTextId)
      case 'icon':
        return project.iconLayers?.find(l => l.id === project.selectedIconId)
      case 'video':
        return project.videoLayers?.find(l => l.id === project.selectedVideoId)
      case 'image':
        return project.frameLayers?.find(l => l.id === project.selectedFrameId)
      default:
        return null
    }
  }, [project, selectedLayerType])

  // Получаем lutStack текущего слоя
  const currentLutStack = selectedLayer?.lutStack || []

  // Получаем LUT из активной категории
  const availableLuts = useMemo(() => {
    try {
      if (!getLutsByCategory || !LUT_REGISTRY || !Array.isArray(LUT_REGISTRY)) {
        return []
      }
      
      const luts = getLutsByCategory(activeCategory)
      return luts || []
    } catch (error) {
      return []
    }
  }, [activeCategory])

  const categories = getAllLutCategories()

  // Обработчик применения LUT
  const handleApplyLut = (lutDef) => {
    if (!selectedLayer || !onChangeProject || !project) {
      return
    }

    // Проверяем, есть ли уже этот LUT
    const existingLut = currentLutStack.find(lut => lut.id === lutDef.id)
    
    if (existingLut) {
      // Переключаем включение/выключение
      const updatedLut = {
        ...existingLut,
        enabled: !existingLut.enabled
      }
      const newLutStack = currentLutStack.map(lut => 
        lut.id === lutDef.id ? updatedLut : lut
      )
      updateLayerLutStack(newLutStack)
    } else {
      // Добавляем новый LUT
      const newLutInstance = {
        id: lutDef.id,
        enabled: true,
        intensity: 1
      }
      const newLutStack = [...currentLutStack, newLutInstance]
      updateLayerLutStack(newLutStack)
    }
  }

  // Обновляет lutStack выбранного слоя
  const updateLayerLutStack = (newLutStack) => {
    if (!selectedLayer || !onChangeProject || !project) return

    const update = {
      ...selectedLayer,
      lutStack: newLutStack
    }

    // Обновляем соответствующий массив слоев
    switch (selectedLayerType) {
      case 'sticker': {
        const updatedLayers = (project.stickerLayers || []).map(l => 
          l.id === selectedLayer.id ? update : l
        )
        onChangeProject({
          ...project,
          stickerLayers: updatedLayers
        })
        break
      }
      case 'text': {
        const updatedLayers = (project.textLayers || []).map(l => 
          l.id === selectedLayer.id ? update : l
        )
        onChangeProject({
          ...project,
          textLayers: updatedLayers
        })
        break
      }
      case 'icon': {
        const updatedLayers = (project.iconLayers || []).map(l => 
          l.id === selectedLayer.id ? update : l
        )
        onChangeProject({
          ...project,
          iconLayers: updatedLayers
        })
        break
      }
      case 'video': {
        const updatedLayers = (project.videoLayers || []).map(l => 
          l.id === selectedLayer.id ? update : l
        )
        onChangeProject({
          ...project,
          videoLayers: updatedLayers
        })
        break
      }
      case 'image': {
        const updatedLayers = (project.frameLayers || []).map(l => 
          l.id === selectedLayer.id ? update : l
        )
        onChangeProject({
          ...project,
          frameLayers: updatedLayers
        })
        break
      }
    }
  }

  // Обработчик сброса всех LUT
  const handleClearLuts = () => {
    if (!selectedLayer || !onChangeProject) return
    updateLayerLutStack([])
  }

  // Обработчики для подсказок
  const handleTooltipShow = (e, text) => {
    if (!text) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  const handleTooltipHide = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 })
  }

  // Если слой не выбран, показываем сообщение с возможностью выбора
  if (!selectedLayer) {
    // Собираем все доступные слои
    const allLayers = useMemo(() => {
      if (!project) return []
      const layers = []
      
      if (project.textLayers?.length > 0) {
        project.textLayers.forEach(layer => {
          layers.push({ id: layer.id, type: 'text', name: layer.content?.substring(0, 30) || 'Текст', layer })
        })
      }
      if (project.stickerLayers?.length > 0) {
        project.stickerLayers.forEach(layer => {
          layers.push({ id: layer.id, type: 'sticker', name: layer.fileName || 'Стикер', layer })
        })
      }
      if (project.videoLayers?.length > 0) {
        project.videoLayers.forEach(layer => {
          layers.push({ id: layer.id, type: 'video', name: 'Видео', layer })
        })
      }
      if (project.frameLayers?.length > 0) {
        project.frameLayers.forEach(layer => {
          layers.push({ id: layer.id, type: 'image', name: 'Изображение', layer })
        })
      }
      if (project.iconLayers?.length > 0) {
        project.iconLayers.forEach(layer => {
          layers.push({ id: layer.id, type: 'icon', name: layer.iconName || 'Иконка', layer })
        })
      }
      
      return layers
    }, [project])

    const handleSelectLayer = (layer) => {
      if (!onChangeProject || !project) return
      
      // Очищаем все выбранные слои
      const updates = {
        ...project,
        selectedTextId: null,
        selectedStickerId: null,
        selectedVideoId: null,
        selectedFrameId: null,
        selectedIconId: null
      }
      
      // Устанавливаем выбранный слой
      switch (layer.type) {
        case 'text':
          updates.selectedTextId = layer.id
          break
        case 'sticker':
          updates.selectedStickerId = layer.id
          break
        case 'video':
          updates.selectedVideoId = layer.id
          break
        case 'image':
          updates.selectedFrameId = layer.id
          break
        case 'icon':
          updates.selectedIconId = layer.id
          break
      }
      
      onChangeProject(updates)
    }

    return (
      <div className="editor-v2-panel luts-panel">
        <div className="dm-panel-header-main">
          <div className="dm-panel-header-left">
            <span className="dm-panel-header-dot" />
            <span className="dm-panel-header-title">ЛУТЫ</span>
          </div>
        </div>
        <div className="luts-panel-empty">
          <p className="luts-panel-empty-text">Выберите слой для применения LUT</p>
          {allLayers.length > 0 ? (
            <div className="luts-panel-layers-list">
              <p className="luts-panel-layers-title">Доступные слои:</p>
              {allLayers.map(layer => (
                <button
                  key={layer.id}
                  className="luts-panel-layer-btn"
                  onClick={() => handleSelectLayer(layer)}
                >
                  <span className="luts-panel-layer-icon">
                    {layer.type === 'text' && 'T'}
                    {layer.type === 'sticker' && '📎'}
                    {layer.type === 'video' && '▶'}
                    {layer.type === 'image' && '🖼'}
                    {layer.type === 'icon' && 'в-Ћ'}
                  </span>
                  <span className="luts-panel-layer-name">{layer.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="luts-panel-layers-list">
              <p className="luts-panel-layers-title" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', marginTop: '20px' }}>
                В проекте нет слоев. Добавьте текст, стикер, видео или изображение, чтобы применить LUT.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="editor-v2-panel luts-panel">
      {tooltip.show && (
        <div
          className="fx-tooltip-fixed"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.text}
        </div>
      )}
      <div className="dm-panel-header-main">
        <div className="dm-panel-header-left">
          <span className="dm-panel-header-dot" />
          <span className="dm-panel-header-title">ЛУТЫ</span>
        </div>
        <div className="luts-panel-header-right">
          {currentLutStack.length > 0 && (
            <button
              className="luts-panel-clear-btn"
              onClick={handleClearLuts}
              data-tooltip="Сбросить все LUT"
              onMouseEnter={(e) => handleTooltipShow(e, "Сбросить все LUT")}
              onMouseLeave={handleTooltipHide}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Категории */}
      <div 
        className="luts-panel-categories"
        onWheel={(e) => {
          e.preventDefault()
          const container = e.currentTarget
          container.scrollLeft += e.deltaY
        }}
      >
        {categories.map(category => (
          <button
            key={category}
            className={`luts-category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {LUT_CATEGORIES[category]}
          </button>
        ))}
      </div>

      {/* Список LUT */}
      <div className="luts-panel-list">
        {!availableLuts || availableLuts.length === 0 ? (
          <div className="luts-panel-empty-category">
            <p>В этой категории нет LUT</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              Всего LUT в реестре: {LUT_REGISTRY?.length || 0}, Категория: {activeCategory}
            </p>
          </div>
        ) : (
          availableLuts.map(lutDef => {
            const isApplied = currentLutStack.some(lut => lut.id === lutDef.id)
            const lutInstance = isApplied ? currentLutStack.find(lut => lut.id === lutDef.id) : null
            const isEnabled = lutInstance?.enabled || false

            return (
              <button
                key={lutDef.id}
                className={`luts-item-btn ${isApplied ? 'applied' : ''} ${isEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => handleApplyLut(lutDef)}
                data-tooltip={lutDef.label}
                onMouseEnter={(e) => handleTooltipShow(e, lutDef.label)}
                onMouseLeave={handleTooltipHide}
              >
                <span className="luts-item-label">{lutDef.label}</span>
                {isApplied && (
                  <span className="luts-item-indicator">
                    {isEnabled ? '✓' : 'в-‹'}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Список примененных LUT */}
      {currentLutStack.length > 0 && (
        <div className="luts-panel-applied">
          <div className="luts-panel-applied-list">
            {currentLutStack.map(lutInstance => {
              const lutDef = LUT_REGISTRY.find(lut => lut.id === lutInstance.id)
              if (!lutDef) return null

              return (
                <button
                  key={lutInstance.id}
                  className={`luts-applied-item ${lutInstance.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleApplyLut(lutDef)}
                  data-tooltip={`${lutDef.label} - ${lutInstance.enabled ? 'Выключить' : 'Включить'}`}
                  onMouseEnter={(e) => handleTooltipShow(e, `${lutDef.label} - ${lutInstance.enabled ? 'Выключить' : 'Включить'}`)}
                  onMouseLeave={handleTooltipHide}
                >
                  <span className="luts-applied-label">{lutDef.label}</span>
                  <span className="luts-applied-indicator">
                    {lutInstance.enabled ? '✓' : 'в-‹'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

