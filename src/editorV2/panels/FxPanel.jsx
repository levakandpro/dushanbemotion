// src/editorV2/panels/FxPanel.jsx
import React, { useState, useMemo, useEffect } from 'react'
import { 
  FX_REGISTRY, 
  FX_CATEGORIES, 
  getAllCategories,
  getFxByCategory,
  getFxByLayerType 
} from '../fx/fxRegistry'
import { 
  createFxInstance, 
  addFxToStack, 
  removeFxFromStack,
  clearFxStack,
  hasFxInStack,
  getFxFromStack
} from '../fx/fxTypes'
import PremiumAssetOverlay from '../components/PremiumAssetOverlay'
import { useAuth } from '../../lib/useAuth'
import favoritesStore from '../store/favoritesStore'
import './FxPanel.css'

/**
 * Панель FX эффектов
 */
export default function FxPanel({ project, onChangeProject }) {
  const { profile } = useAuth();
  
  // Проверяем есть ли у пользователя активный PREMIUM
  const userHasPremium = useMemo(() => {
    if (!profile) return false;
    if (profile.is_lifetime) return true;
    if (!profile.current_plan || profile.current_plan === 'free') return false;
    if (!profile.plan_expires_at) return false;
    return new Date(profile.plan_expires_at) > new Date();
  }, [profile]);
  const [activeCategory, setActiveCategory] = useState('popular')
  const [activeTab, setActiveTab] = useState('effects') // 'effects' | 'speed' | 'favorites'
  const [favorites, setFavorites] = useState(favoritesStore.getFavorites())
  const [showFavorites, setShowFavorites] = useState(false)
  const [showAppliedHistory, setShowAppliedHistory] = useState(true)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })
  const [activeFxIndex, setActiveFxIndex] = useState(0)
  const effectsListRef = React.useRef(null)
  
  // Определяем тип выбранного слоя
  const selectedLayerType = useMemo(() => {
    if (!project) return null
    
    // Проверяем, какой слой выбран
    if (project.selectedStickerId) {
      const layer = project.stickerLayers?.find(l => l.id === project.selectedStickerId)
      return layer ? 'sticker' : null
    }
    if (project.selectedTextId) {
      return 'text'
    }
    if (project.selectedIconId) {
      return 'icon'
    }
    if (project.selectedVideoId) {
      return 'video'
    }
    if (project.selectedFrameId) {
      return 'image' // Рамки считаем изображениями
    }
    
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

  // Получаем fxStack текущего слоя
  const currentFxStack = selectedLayer?.fxStack || []

  // Получаем выбранный видео-клип (для скорости и времени)
  const selectedVideoClip = useMemo(() => {
    if (selectedLayerType !== 'video' || !project?.selectedVideoId) return null
    return project.videoClips?.find(clip => clip.elementId === project.selectedVideoId) || null
  }, [project, selectedLayerType])

  // Значения скорости и reverse из клипа
  const playbackRate = selectedVideoClip?.playbackRate ?? 1
  const reverse = selectedVideoClip?.reverse ?? false

  // Фильтруем эффекты по категории и поддержке типа слоя
  const availableFx = useMemo(() => {
    if (!selectedLayerType) return []
    
    const categoryFx = getFxByCategory(activeCategory)
    const supportedFx = getFxByLayerType(selectedLayerType)
    
    // Пересечение: эффекты из категории, которые поддерживают тип слоя
    return categoryFx.filter(fx => supportedFx.includes(fx))
  }, [activeCategory, selectedLayerType])

  // Обработчик применения эффекта
  const handleApplyFx = (fxDef) => {
    if (!selectedLayer || !onChangeProject || !project) {
      console.warn('⚠️ FxPanel: Cannot apply FX - missing dependencies')
      return
    }

    console.log('🎨 FxPanel: Applying FX', {
      fxId: fxDef.id,
      fxLabel: fxDef.label,
      layerId: selectedLayer.id,
      layerType: selectedLayerType,
      currentFxStackLength: currentFxStack.length
    })

    // Проверяем, есть ли уже этот эффект
    const existingFx = getFxFromStack(currentFxStack, fxDef.id)
    
    if (existingFx) {
      // Переключаем включение/выключение
      const updatedFx = {
        ...existingFx,
        enabled: !existingFx.enabled
      }
      const newFxStack = addFxToStack(currentFxStack, updatedFx)
      console.log('🔄 FxPanel: Toggling FX', {
        fxId: fxDef.id,
        wasEnabled: existingFx.enabled,
        nowEnabled: updatedFx.enabled
      })
      updateLayerFxStack(newFxStack)
    } else {
      // Добавляем новый эффект
      const newFxInstance = createFxInstance(fxDef)
      const newFxStack = addFxToStack(currentFxStack, newFxInstance)
      console.log('вћ• FxPanel: Adding new FX', {
        fxId: fxDef.id,
        fxInstance: newFxInstance,
        newFxStackLength: newFxStack.length
      })
      updateLayerFxStack(newFxStack)
    }
  }

  // Обновляет fxStack выбранного слоя
  const updateLayerFxStack = (newFxStack) => {
    if (!selectedLayer || !onChangeProject || !project) {
      console.warn('FxPanel: Cannot update fxStack - missing dependencies', {
        hasSelectedLayer: !!selectedLayer,
        hasOnChangeProject: !!onChangeProject,
        hasProject: !!project
      })
      return
    }

    const update = {
      ...selectedLayer,
      fxStack: newFxStack
    }

    console.log('FxPanel: Updating fxStack', {
      layerId: selectedLayer.id,
      layerType: selectedLayerType,
      fxStackLength: newFxStack.length,
      fxStack: newFxStack
    })

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
      default:
        console.warn('FxPanel: Unknown layer type', selectedLayerType)
    }
  }

  // Обработчик сброса всех FX
  const handleClearFx = () => {
    if (!selectedLayer || !onChangeProject) return
    updateLayerFxStack(clearFxStack())
  }

  // Обработчик изменения скорости
  const handleSpeedChange = (newRate) => {
    if (!selectedVideoClip || !onChangeProject) return

    const updatedClips = project.videoClips.map(clip => {
      if (clip.id === selectedVideoClip.id) {
        const originalDuration = clip.duration / (clip.playbackRate || 1)
        const newDuration = originalDuration / newRate
        
        return {
          ...clip,
          playbackRate: newRate,
          duration: newDuration,
          endTime: clip.startTime + newDuration
        }
      }
      return clip
    })

    onChangeProject({
      ...project,
      videoClips: updatedClips
    })
  }

  // Обработчик изменения reverse
  const handleReverseChange = (newReverse) => {
    if (!selectedVideoClip || !onChangeProject) return

    const updatedClips = project.videoClips.map(clip => {
      if (clip.id === selectedVideoClip.id) {
        return {
          ...clip,
          reverse: newReverse
        }
      }
      return clip
    })

    onChangeProject({
      ...project,
      videoClips: updatedClips
    })
  }

  // Обработчик сброса скорости
  const handleResetSpeed = () => {
    if (!selectedVideoClip || !onChangeProject) return

    const updatedClips = project.videoClips.map(clip => {
      if (clip.id === selectedVideoClip.id) {
        const originalDuration = clip.duration / (clip.playbackRate || 1)
        const newDuration = originalDuration / 1
        
        return {
          ...clip,
          playbackRate: 1,
          reverse: false,
          duration: newDuration,
          endTime: clip.startTime + newDuration
        }
      }
      return clip
    })

    onChangeProject({
      ...project,
      videoClips: updatedClips
    })
  }

  // Обработчик создания стоп-кадра
  const handleCreateFreezeFrame = async () => {
    if (!selectedLayer || !selectedVideoClip || !onChangeProject || !project) return

    try {
      // Создаем canvas для захвата кадра
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      // Используем srcHd или srcFull из videoLayer
      video.src = selectedLayer.srcHd || selectedLayer.srcFull || selectedLayer.videoUrl || selectedLayer.videoUrlHd || selectedLayer.videoUrlFull || selectedLayer.url
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Без таймлайна используем начало видео (0 секунд)
          video.currentTime = 0
          video.onseeked = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              const ctx = canvas.getContext('2d')
              ctx.drawImage(video, 0, 0)
              
              const imageDataUrl = canvas.toDataURL('image/png')
              
              // Создаем новый image layer
              const newImageLayer = {
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'image',
                imageUrl: imageDataUrl,
                fileName: `freeze_${Date.now()}.png`,
                x: selectedLayer.x || 50,
                y: selectedLayer.y || 50,
                width: selectedLayer.width || 200,
                height: selectedLayer.height || 200,
                rotation: selectedLayer.rotation || 0,
                opacity: 1,
                zIndex: (project.frameLayers?.length || 0) + 100,
                visible: true,
                locked: false
              }

              // Создаем клип для изображения
              const projectDuration = 30 // Дефолтная длительность проекта
              const newClip = {
                id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                elementId: newImageLayer.id,
                type: 'image',
                startTime: 0,
                duration: projectDuration,
                endTime: projectDuration
              }

              onChangeProject({
                ...project,
                frameLayers: [...(project.frameLayers || []), newImageLayer],
                frameClips: [...(project.frameClips || []), newClip],
                selectedFrameId: newImageLayer.id
              })

              resolve()
            } catch (err) {
              reject(err)
            }
          }
        }
        video.onerror = reject
      })
    } catch (error) {
      console.error('Ошибка создания стоп-кадра:', error)
      alert('Не удалось создать стоп-кадр. Убедитесь, что видео загружено.')
    }
  }

  // Обработчик клика на премиум эффект
  const handlePremiumClick = (fxDef) => {
    // TODO: Открыть модалку подписки
    console.log('Premium FX clicked:', fxDef.id)
    alert('Этот эффект доступен только для премиум-подписчиков')
  }

  // Подписка на изменения избранного
  useEffect(() => {
    const unsubscribe = favoritesStore.subscribe((newFavorites) => {
      setFavorites(newFavorites)
    })
    return unsubscribe
  }, [])

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

  // Обработчик добавления в избранное
  const handleToggleFavorite = (e, fxId) => {
    e.stopPropagation()
    favoritesStore.toggleFavorite(fxId)
  }

  // Получаем избранные эффекты
  const favoriteFx = useMemo(() => {
    return FX_REGISTRY.filter(fx => favorites.includes(fx.id))
  }, [favorites])

  // Переключаемся между категориями и избранным
  const displayFx = showFavorites ? favoriteFx : availableFx

  const categories = getAllCategories()

  // Клавиатурная навигация по списку FX
  const handleEffectsKeyDown = (e) => {
    if (!displayFx || displayFx.length === 0) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      setActiveFxIndex(prev => {
        let next = prev + dir
        if (next < 0) next = 0
        if (next >= displayFx.length) next = displayFx.length - 1

        const container = effectsListRef.current
        if (container) {
          const items = container.querySelectorAll('.fx-effect-btn')
          const el = items[next]
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ block: 'nearest' })
          }
        }

        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const fxDef = displayFx[activeFxIndex]
      if (fxDef && (!fxDef.isPremium || userHasPremium)) {
        handleApplyFx(fxDef)
      }
    }
  }

  // Если слой не выбран, показываем сообщение
  if (!selectedLayer) {
    return (
      <div className="editor-v2-panel">
        <div className="dm-panel-header-main">
          <div className="dm-panel-header-left">
            <span className="dm-panel-header-dot" />
            <span className="dm-panel-header-title">ЭФФЕКТЫ</span>
          </div>
        </div>
        <div className="fx-panel-empty">
          <p>Выберите слой для применения эффектов</p>
        </div>
      </div>
    )
  }

  const isVideoLayer = selectedLayerType === 'video'
  const showSpeedTab = isVideoLayer

  return (
    <div className="editor-v2-panel fx-panel">
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
          <span className="dm-panel-header-title">FX ЭФФЕКТЫ</span>
          {showSpeedTab && (
            <button
              className={`fx-panel-tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === 'speed') {
                  setActiveTab('effects')
                } else {
                  setActiveTab('speed')
                }
              }}
              data-tooltip={activeTab === 'speed' ? 'Эффекты' : 'Скорость'}
              onMouseEnter={(e) => handleTooltipShow(e, activeTab === 'speed' ? 'Эффекты' : 'Скорость')}
              onMouseLeave={handleTooltipHide}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {activeTab === 'speed' ? (
                  <>
                    <path d="M7 1L3 4L7 7L11 4L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 7L3 10L7 13L11 10L7 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                ) : (
                  <>
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 3.5V7L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </>
                )}
              </svg>
              {activeTab === 'speed' ? 'Эффекты' : 'Скорость'}
            </button>
          )}
        </div>
        <div className="fx-panel-header-right">
          {activeTab === 'effects' && (
            <button
              className={`fx-panel-favorites-btn ${showFavorites ? 'active' : ''}`}
              onClick={() => setShowFavorites(!showFavorites)}
              data-tooltip={showFavorites ? 'Все эффекты' : 'Избранное'}
              onMouseEnter={(e) => handleTooltipShow(e, showFavorites ? 'Все эффекты' : 'Избранное')}
              onMouseLeave={handleTooltipHide}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 11.5L3.5 7.5L2 9L7 14L12 9L10.5 7.5L7 11.5Z" fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M7 2.5L10.5 6.5L12 5L7 0L2 5L3.5 6.5L7 2.5Z" fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              {favorites.length > 0 && <span className="fx-favorites-count">{favorites.length}</span>}
            </button>
          )}
          {currentFxStack && currentFxStack.length > 0 && (
            <button
              className={`fx-panel-history-btn ${showAppliedHistory ? 'active' : ''}`}
              onClick={() => setShowAppliedHistory(!showAppliedHistory)}
              data-tooltip={showAppliedHistory ? 'Скрыть примененные эффекты' : 'Показать примененные эффекты'}
              onMouseEnter={(e) => handleTooltipShow(e, showAppliedHistory ? 'Скрыть примененные эффекты' : 'Показать примененные эффекты')}
              onMouseLeave={handleTooltipHide}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L2.5 4.5L7 7.5L11.5 4.5L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 4.5V9.5L7 12.5L11.5 9.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7.5V12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="fx-history-count">{currentFxStack.length}</span>
            </button>
          )}
          <button
            className="fx-panel-clear-btn"
            onClick={handleClearFx}
            disabled={!currentFxStack || currentFxStack.length === 0}
            data-tooltip={currentFxStack && currentFxStack.length > 0 ? "Сбросить все эффекты" : "Нет примененных эффектов"}
            onMouseEnter={(e) => handleTooltipShow(e, currentFxStack && currentFxStack.length > 0 ? "Сбросить все эффекты" : "Нет примененных эффектов")}
            onMouseLeave={handleTooltipHide}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Блок Скорость и время */}
      {activeTab === 'speed' && isVideoLayer && selectedVideoClip && (
        <div className="fx-panel-speed-section">
          <div className="fx-speed-header">
            <label className="fx-speed-label">Скорость и время</label>
            <button
              className="fx-speed-reset-btn"
              onClick={handleResetSpeed}
              disabled={playbackRate === 1 && !reverse}
              data-tooltip="Сбросить скорость"
              onMouseEnter={(e) => handleTooltipShow(e, "Сбросить скорость")}
              onMouseLeave={handleTooltipHide}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Скорость клипа */}
          <div className="fx-speed-control">
            <label className="fx-speed-control-label">Скорость клипа</label>
            <div className="fx-speed-buttons">
              {[0.25, 0.5, 1, 1.5, 2, 4].map(rate => (
                <button
                  key={rate}
                  className={`fx-speed-btn ${playbackRate === rate ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(rate)}
                >
                  {rate}Г-
                </button>
              ))}
            </div>
          </div>

          {/* Reverse */}
          <div className="fx-reverse-control">
            <label className="fx-reverse-label">
              <input
                type="checkbox"
                checked={reverse}
                onChange={(e) => handleReverseChange(e.target.checked)}
                className="fx-reverse-checkbox"
              />
              <span>Проигрывать назад</span>
            </label>
          </div>

          {/* Стоп-кадр */}
          <div className="fx-freeze-control">
            <button
              className="fx-freeze-btn"
              onClick={handleCreateFreezeFrame}
            >
              Создать стоп-кадр
            </button>
          </div>
        </div>
      )}

      {/* Блок Эффекты */}
      {activeTab === 'effects' && (
        <>

      {/* Категории */}
      <div 
        className="fx-panel-categories"
        onWheel={(e) => {
          // Горизонтальная прокрутка колесиком мыши
          e.preventDefault()
          const container = e.currentTarget
          container.scrollLeft += e.deltaY
        }}
        onMouseDown={(e) => {
          // Drag-to-scroll
          const container = e.currentTarget
          const startX = e.pageX - container.offsetLeft
          const scrollLeft = container.scrollLeft
          let isDown = true

          const handleMouseMove = (e) => {
            if (!isDown) return
            e.preventDefault()
            const x = e.pageX - container.offsetLeft
            const walk = (x - startX) * 2 // Скорость прокрутки
            container.scrollLeft = scrollLeft - walk
          }

          const handleMouseUp = () => {
            isDown = false
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            container.style.cursor = 'default'
            container.style.userSelect = 'auto'
          }

          // Проверяем, что клик не на кнопке категории
          if (e.target.classList.contains('fx-category-btn')) {
            return
          }

          container.style.cursor = 'grabbing'
          container.style.userSelect = 'none'
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
        {categories.map(category => (
          <button
            key={category}
            className={`fx-category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {FX_CATEGORIES[category]}
          </button>
        ))}
      </div>

      {/* Список эффектов */}
      <div
        className="fx-panel-effects"
        ref={effectsListRef}
        tabIndex={0}
        onKeyDown={handleEffectsKeyDown}
      >
        {displayFx.length === 0 ? (
          <div className="fx-panel-empty-category">
            <p>{showFavorites ? 'Нет избранных эффектов' : 'В этой категории нет эффектов для выбранного типа слоя'}</p>
          </div>
        ) : (
                    displayFx.map((fxDef, index) => {
                      const isApplied = hasFxInStack(currentFxStack, fxDef.id)
                      const fxInstance = isApplied ? getFxFromStack(currentFxStack, fxDef.id) : null
                      const isEnabled = fxInstance?.enabled || false
                      const isFavorite = favoritesStore.isFavorite(fxDef.id)

                      return (
                        <PremiumAssetOverlay
                          key={fxDef.id}
                          asset={{ isPremium: fxDef.isPremium && !userHasPremium }}
                          isPremium={fxDef.isPremium && !userHasPremium}
                          onPremiumClick={() => handlePremiumClick(fxDef)}
                        >
                          <button
                            className={`fx-effect-btn ${isApplied ? 'applied' : ''} ${isEnabled ? 'enabled' : 'disabled'} ${index === activeFxIndex ? 'fx-effect-btn-focused' : ''}`}
                            onClick={() => (!fxDef.isPremium || userHasPremium) && handleApplyFx(fxDef)}
                            disabled={fxDef.isPremium && !userHasPremium}
                            data-tooltip={fxDef.label}
                            onMouseEnter={(e) => (!fxDef.isPremium || userHasPremium) && handleTooltipShow(e, fxDef.label)}
                            onMouseLeave={handleTooltipHide}
                          >
                            {fxDef.previewImage ? (
                              <img 
                                src={fxDef.previewImage} 
                                alt={fxDef.label}
                                className="fx-effect-preview"
                              />
                            ) : (
                              <span className="fx-effect-label">{fxDef.label}</span>
                            )}
                            {isApplied && (
                              <span className="fx-effect-indicator">
                                {isEnabled ? '✓' : 'в-‹'}
                              </span>
                            )}
                            <button
                              className={`fx-effect-favorite ${isFavorite ? 'active' : ''}`}
                              onClick={(e) => handleToggleFavorite(e, fxDef.id)}
                              data-tooltip={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 9.5L2.5 6L1 7L6 12L11 7L9.5 6L6 9.5Z" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </button>
                        </PremiumAssetOverlay>
                      )
                    })
        )}
      </div>
        </>
      )}

      {/* Список примененных эффектов - компактный вид (всегда внизу панели) */}
      {currentFxStack.length > 0 && showAppliedHistory && (
        <div className="fx-panel-applied">
          <div className="fx-panel-applied-list">
            {currentFxStack.map(fxInstance => {
              const fxDef = FX_REGISTRY.find(fx => fx.id === fxInstance.id)
              if (!fxDef) return null

              return (
                <button
                  key={fxInstance.id}
                  className={`fx-applied-item ${fxInstance.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleApplyFx(fxDef)}
                  data-tooltip={`${fxDef.label} - ${fxInstance.enabled ? 'Выключить' : 'Включить'}`}
                  onMouseEnter={(e) => handleTooltipShow(e, `${fxDef.label} - ${fxInstance.enabled ? 'Выключить' : 'Включить'}`)}
                  onMouseLeave={handleTooltipHide}
                >
                  {fxDef.previewImage ? (
                    <img 
                      src={fxDef.previewImage} 
                      alt={fxDef.label}
                      className="fx-applied-preview"
                    />
                  ) : (
                    <span className="fx-applied-label">{fxDef.label}</span>
                  )}
                  <span className="fx-applied-indicator">
                    {fxInstance.enabled ? '✓' : 'в-‹'}
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

