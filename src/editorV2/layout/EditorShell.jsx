import React from 'react'
import HeaderBar from './HeaderBar'
import { createHistoryStore } from '../utils/historyStore'
import RightToolbar from './RightToolbar'
import RightPanelHost from './RightPanelHost'
import BackgroundCategoriesRail from '../components/BackgroundCategoriesRail'
import StickerCategoriesRail from '../components/StickerCategoriesRail'
import { registerHotkeys } from '../utils/hotkeys'
import TextLayer from '../components/TextLayer'
import StickerLayer from '../components/StickerLayer'
import IconLayer from '../components/IconLayer'
import VideoLayer from '../components/VideoLayer'
import FrameLayer from '../components/FrameLayer'
import { useStickerPreview } from '../context/StickerPreviewContext'
import { useEditorState } from '../store/useEditorState'
import { FAQModal, PolicyModal, ProjectsModal, SoonModal, ContactsModal } from '../components/InfoModals'
import { PromoModal, usePromoModal } from '../../components/PromoModal'
import MobileToolbar from '../components/MobileToolbar'
import MobilePanel from '../components/MobilePanel'
import SwipeNavigator from '../components/SwipeNavigator'
import { useIsMobile } from '../../hooks/useMobileGestures'
import { TextPanelTabsProvider, useTextPanelTabs } from '../context/TextPanelTabsContext'

function getBaseFrameSize(isMobileDevice = false) {
  if (isMobileDevice) {
    // Мобильный: 9:16 вертикальный формат
    const height = Math.min(window.innerHeight - 200, 500)
    const width = Math.round(height * (9 / 16))
    return { width, height }
  }
  // Десктоп: 16:9 горизонтальный формат
  const max = 630
  return { width: max, height: Math.round((9 / 16) * max) }
}

export default function EditorShell({
  project,
  activeTool,
  onChangeTool,
  onChangeProject,
  onAccount = () => {},
  onOpenBaza = () => {},
  isReadOnly = false,
  isCleanView = false,
  onToggleCleanView = () => {},
}) {
  const { previewSticker } = useStickerPreview();
  const isMobile = useIsMobile()
  const [isMobilePanelOpen, setIsMobilePanelOpen] = React.useState(false)
  const [isCanvasActive, setIsCanvasActive] = React.useState(false)
  const canvasIdleTimerRef = React.useRef(null)
  
  // Глобальный свайп для открытия/закрытия панели
  const swipeStartY = React.useRef(0)
  const swipeStartTime = React.useRef(0)
  
  const handleGlobalTouchStart = React.useCallback((e) => {
    swipeStartY.current = e.touches[0].clientY
    swipeStartTime.current = Date.now()
  }, [])
  
  const handleGlobalTouchEnd = React.useCallback((e) => {
    const deltaY = swipeStartY.current - e.changedTouches[0].clientY
    const deltaTime = Date.now() - swipeStartTime.current
    
    // Быстрый свайп (менее 300мс) или длинный свайп (более 50px)
    if (deltaTime < 300 || Math.abs(deltaY) > 50) {
      if (deltaY > 40) {
        // Свайп вверх - открыть панель
        setIsMobilePanelOpen(true)
      } else if (deltaY < -40) {
        // Свайп вниз - закрыть панель
        setIsMobilePanelOpen(false)
      }
    }
  }, [])
  
  // Промо-окно акции
  const { isOpen: isPromoOpen, showPromo, closePromo, showOnMount } = usePromoModal()
  
  // НЕ открываем панель автоматически при смене инструмента
  // Панель открывается только по повторному нажатию на инструмент
  
  // Единое состояние редактора
  const editorState = useEditorState(project, onChangeProject)

  // Автоматическое переключение на панель Стикеры при выборе стикера
  React.useEffect(() => {
    const selectedStickerId = project?.selectedStickerId
    // Отключено автопереключение на вкладку "Стикеры"
  }, [project?.selectedStickerId])

  // Показ промо при первом входе
  React.useEffect(() => {
    showOnMount()
  }, [showOnMount])

  // Показ промо при смене инструмента — с небольшой задержкой после закрытия
  const lastToolRef = React.useRef(null)
  React.useEffect(() => {
    if (activeTool && activeTool !== lastToolRef.current) {
      lastToolRef.current = activeTool
      // Задержка чтобы промо успело закрыться перед повторным показом
      setTimeout(() => {
        showPromo()
      }, 100)
    }
  }, [activeTool, showPromo])

  // Canvas scale фиксированный (без пользовательского zoom)
  // Увеличиваем отображение канваса, но логические размеры слоёв сохраняются.
  const zoom = 1.25

  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const hasUserInteracted = React.useRef(false)

  const [showGrid, setShowGrid] = React.useState(false)
  const canvasRef = React.useRef(null)
  const wrapperRef = React.useRef(null)

  const [previewVideoAspect, setPreviewVideoAspect] = React.useState(null)

  const selectedVideoLayer = React.useMemo(() => {
    const id = project?.selectedVideoId
    if (!id) return null
    const layers = project?.videoLayers || []
    return layers.find(v => v && v.id === id) || null
  }, [project?.selectedVideoId, project?.videoLayers])

  const lastPremiumVideoLayer = React.useMemo(() => {
    const layers = project?.videoLayers || []
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      const l = layers[i]
      if (l && l.type === 'video' && l.subType === 'premium') return l
    }
    return null
  }, [project?.videoLayers])

  const canvasFrameStyle = React.useMemo(() => {
    const base = getBaseFrameSize(isMobile)
    // Убеждаемся, что base всегда имеет валидные размеры
    if (!base || !base.width || !base.height || base.width <= 0 || base.height <= 0) {
      const fallback = { width: 630, height: 354 }
      return fallback // Fallback значения
    }

    // Для PREMIUM видео — подстраиваем канвас под размер видео
    const premiumLayer = lastPremiumVideoLayer || 
      (selectedVideoLayer && selectedVideoLayer.subType === 'premium' ? selectedVideoLayer : null)
    
    if (premiumLayer) {
      const w = Number(premiumLayer.width || 0)
      const h = Number(premiumLayer.height || 0)
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        const ratio = w / h
        if (Number.isFinite(ratio) && ratio > 0) {
          const maxWidth = 630
          const maxHeight = 590
          if (ratio >= 1) {
            // Горизонтальное видео
            const width = Math.min(maxWidth, maxHeight * ratio)
            return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(width / ratio)) }
          } else {
            // Вертикальное видео
            const height = Math.min(maxHeight, maxWidth / ratio)
            return { width: Math.max(1, Math.round(height * ratio)), height: Math.max(1, Math.round(height)) }
          }
        }
      }
    }

    // Для инструмента Видео с превью
    if (activeTool === 'beats') {
      const previewW = Number(previewVideoAspect?.width || 0)
      const previewH = Number(previewVideoAspect?.height || 0)
      if (previewW > 0 && previewH > 0) {
        const ratio = previewW / previewH
        if (Number.isFinite(ratio) && ratio > 0) {
          const baseW = Number(base?.width || 0)
          const baseH = Number(base?.height || 0)
          if (baseW > 0 && baseH > 0) {
            if (ratio >= 1) {
              const width = Math.min(baseW, baseH * ratio)
              return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(width / ratio)) }
            }
            const height = Math.min(baseH, baseW / ratio)
            return { width: Math.max(1, Math.round(height * ratio)), height: Math.max(1, Math.round(height)) }
          }
        }
      }
    }

    // Стандартный размер для остальных случаев
    return base
  }, [project?.aspectRatio, activeTool, selectedVideoLayer, lastPremiumVideoLayer, previewVideoAspect, isMobile])

  // ===== Undo/Redo (History) =====
  const historyRef = React.useRef(null)
  const applyingHistoryRef = React.useRef(false)
  const prevProjectRef = React.useRef(null)
  const pendingPushRef = React.useRef(null)
  const pushTimerRef = React.useRef(null)
  const lastCoreHashRef = React.useRef(null)
  const [historyUiTick, setHistoryUiTick] = React.useState(0)

  if (!historyRef.current) {
    historyRef.current = createHistoryStore(120)
  }

  const getCoreProjectForHistory = React.useCallback((p) => {
    if (!p) return null
    // Remove selection-only fields and timestamps to avoid polluting history
    const core = { ...p }
    delete core.selectedTextId
    delete core.selectedStickerId
    delete core.selectedIconId
    delete core.selectedVideoId
    delete core.selectedFrameId
    delete core.selectedStickerClipId
    delete core.updatedAt
    return core
  }, [])

  const getCoreHash = React.useCallback((p) => {
    try {
      return JSON.stringify(getCoreProjectForHistory(p))
    } catch {
      return String(Date.now())
    }
  }, [getCoreProjectForHistory])

  const hasCanvasLayers = React.useMemo(() => {
    if (!project) return false
    const hasText = Array.isArray(project.textLayers) && project.textLayers.length > 0
    const hasStickers = Array.isArray(project.stickerLayers) && project.stickerLayers.length > 0
    const hasIcons = Array.isArray(project.iconLayers) && project.iconLayers.length > 0
    const hasVideos = Array.isArray(project.videoLayers) && project.videoLayers.length > 0
    const hasFrames = Array.isArray(project.frameLayers) && project.frameLayers.length > 0
    return hasText || hasStickers || hasIcons || hasVideos || hasFrames
  }, [project])

  // Debounced history push: batch rapid changes (drag/resize) into one undo step.
  React.useEffect(() => {
    if (!project) return
    const prev = prevProjectRef.current
    const nextHash = getCoreHash(project)
    const prevHash = lastCoreHashRef.current

    prevProjectRef.current = project
    lastCoreHashRef.current = nextHash

    if (!prev) return
    if (applyingHistoryRef.current) return

    // If only selection changed (hash same), don't push history
    if (prevHash && prevHash === nextHash) return

    // First change in a burst -> remember the "before" snapshot
    if (!pendingPushRef.current) {
      pendingPushRef.current = prev
    }

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
    }
    pushTimerRef.current = setTimeout(() => {
      if (pendingPushRef.current && !applyingHistoryRef.current) {
        historyRef.current.push(pendingPushRef.current)
        pendingPushRef.current = null
        setHistoryUiTick((x) => x + 1)
      }
    }, 350)

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    }
  }, [project, getCoreHash])

  const canUndo = !!historyRef.current?.canUndo()
  const canRedo = !!historyRef.current?.canRedo()

  const handleUndo = React.useCallback(() => {
    if (!project) return
    const next = historyRef.current.undo(project)
    if (!next) return
    applyingHistoryRef.current = true
    onChangeProject(next)
    setHistoryUiTick((x) => x + 1)
    setTimeout(() => { applyingHistoryRef.current = false }, 0)
  }, [project, onChangeProject])

  const handleRedo = React.useCallback(() => {
    if (!project) return
    const next = historyRef.current.redo(project)
    if (!next) return
    applyingHistoryRef.current = true
    onChangeProject(next)
    setHistoryUiTick((x) => x + 1)
    setTimeout(() => { applyingHistoryRef.current = false }, 0)
  }, [project, onChangeProject])

  // Hotkeys: Ctrl/Cmd+Z / Ctrl+Y / Ctrl+Shift+Z
  React.useEffect(() => {
    const isTypingTarget = (el) => {
      const tag = el?.tagName?.toLowerCase?.()
      if (!tag) return false
      return tag === 'input' || tag === 'textarea' || el.isContentEditable
    }

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      const key = (e.key || '').toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((key === 'y') || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo, handleRedo])
  
  // Состояние для меню v1.0 и модалок
  const [showBrandMenu, setShowBrandMenu] = React.useState(false)
  const [activeModal, setActiveModal] = React.useState(null)
  const brandMenuRef = React.useRef(null)
  
  // Состояние для dropdown скачивания
  const [showDownloadDropdown, setShowDownloadDropdown] = React.useState(false)
  const downloadDropdownRef = React.useRef(null)

  // Состояние для активной категории фонов
  const [activeBackgroundCategory, setActiveBackgroundCategory] = React.useState('people')
  // Состояние для свернутого/развернутого rail категорий
  const [isCategoriesRailCollapsed, setIsCategoriesRailCollapsed] = React.useState(false)
  
  // Состояние для категорий стикеров
  const [activeStickerCategory, setActiveStickerCategory] = React.useState(null)
  const [stickerCategories, setStickerCategories] = React.useState([])
  const [isStickerCategoriesRailCollapsed, setIsStickerCategoriesRailCollapsed] = React.useState(false)
  const [isStickersFemaleMode, setIsStickersFemaleMode] = React.useState(false)

  const handleToolbarToolChange = React.useCallback((toolId) => {
    if (toolId === 'rhymes') {
      if (typeof onOpenBaza === 'function') onOpenBaza()
      return
    }
    onChangeTool(toolId)
  }, [onChangeTool, onOpenBaza])

  // Глобальные функции для StickersPanel
  React.useEffect(() => {
    window.__setStickerCategories = (categories) => {
      setStickerCategories(categories || []);
    };
    
    window.__setActiveStickerCategory = (categoryId) => {
      setActiveStickerCategory(categoryId);
    };
    
    window.__setStickersFemaleMode = (isFemale) => {
      setIsStickersFemaleMode(isFemale);
    };
    
    return () => {
      delete window.__setStickerCategories;
      delete window.__setActiveStickerCategory;
      delete window.__setStickersFemaleMode;
    };
  }, []);

  // PREMIUM actions use the shared editorState store via RightPanelHost props

  // (filters removed) no global background category setter needed

  // Отправляем изменения категории в StickersPanel
  const handleStickerCategoryChange = React.useCallback((categoryId) => {
    setActiveStickerCategory(categoryId);
    // Отправляем событие в StickersPanel
    if (window.dispatchEvent && categoryId) {
      window.dispatchEvent(new CustomEvent('stickerCategoryChange', { 
        detail: { categoryId } 
      }));
    }
  }, []);
  
  // ======== SITE STATS (реальные счётчики) ========
  // Начальные значения НЕ 0 для предотвращения "пустого" UI
  const [siteStats, setSiteStats] = React.useState({
    backgrounds: 15000,
    videos: 3500,
    users: 500,
    online: 1
  })
  
  // Загружаем реальную статистику и запускаем heartbeat
  React.useEffect(() => {
    let unsubscribe = null
    
    import('../../services/statsService').then(async ({ 
      subscribeToStats, 
      startPresenceHeartbeat, 
      stopPresenceHeartbeat 
    }) => {
      // Подписываемся на обновления статистики
      unsubscribe = subscribeToStats((stats) => {
        // НИКОГДА не устанавливаем 0 при ошибке
        if (stats && typeof stats.users === 'number' && stats.users >= 0) {
          setSiteStats(stats)
        }
      })
      
      // Запускаем автоматический heartbeat присутствия
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.id) {
        startPresenceHeartbeat(user.id)
      }
      
      // Cleanup функция
      return () => {
        stopPresenceHeartbeat()
      }
    }).catch(e => console.error('[EditorShell] Stats error:', e))
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // (zoom отключен) оставляем только сброс панорамирования
  const handleResetCanvas = React.useCallback(() => {
    hasUserInteracted.current = false
    setOffset({ x: 0, y: 0 })
  }, [])

  // Глобальный обработчик клавиши Delete для единого удаления слоя
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем, что нажата клавиша Delete или Backspace
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      
      // Игнорируем, если фокус в поле ввода
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return
      }

      // Предотвращаем дефолтное поведение браузера (например, переход назад)
      e.preventDefault()

      // Единое удаление через editorState
      if (editorState.selectedLayerId && editorState.selectedLayerId !== 'bg') {
        editorState.deleteLayer(editorState.selectedLayerId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorState])

  // Регистрация горячих клавиш (без zoom/fit)
  React.useEffect(() => {
    const unregister = registerHotkeys({
      toggleGrid: () => setShowGrid(v => !v),
      togglePanel: onToggleCleanView,
    })

    return unregister
  }, [onToggleCleanView])

  // Pan функции
  const [isPanning, setIsPanning] = React.useState(false)
  const [isSpacePressed, setIsSpacePressed] = React.useState(false)


  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true)
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  const panStartRef = React.useRef(null)
  
  const handleCanvasPanStart = React.useCallback((e) => {
    if (!isSpacePressed) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    }
  }, [isSpacePressed, offset])
  
  const handleMouseMove = React.useCallback((e) => {
    if (isPanning && panStartRef.current) {
      hasUserInteracted.current = true
    setOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
    })
    }
  }, [isPanning])
  
  const handleMouseUp = () => {
    setIsPanning(false)
    panStartRef.current = null
  }
  const handleDoubleClick = () => {
    hasUserInteracted.current = true
    // zoom/fit отключен
    setOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = React.useCallback((e) => {
    if (e.button !== 0) return
    if (isSpacePressed) {
      handleCanvasPanStart(e)
    }
  }, [isSpacePressed, handleCanvasPanStart])

  const handleSelectLayer = React.useCallback((layerId) => {
    editorState.selectLayer(layerId)
  }, [editorState])

  // Закрытие меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target)) {
        setShowBrandMenu(false)
      }
    }

    if (showBrandMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBrandMenu])

  const handleBrandClick = () => {
    setShowBrandMenu(!showBrandMenu)
  }

  const handleModalOpen = (modalType) => {
    setActiveModal(modalType)
    setShowBrandMenu(false)
  }

  const handleModalClose = () => {
    setActiveModal(null)
  }

  // Закрытие dropdown при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setShowDownloadDropdown(false)
      }
    }

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadDropdown])

// Снять выделение, если кликнули вне канваса (чтобы скрывалась обводка/ручки)
  React.useEffect(() => {
    const handlePointerDownOutsideCanvas = (event) => {
      const canvasEl = canvasRef?.current
      if (!canvasEl) return

      const target = event.target
      // Клик внутри канваса - не трогаем выделение
      if (canvasEl.contains(target)) return
      // Клик по правой панели/панелям - не трогаем выделение (иначе нельзя настраивать активный слой)
      if (target?.closest?.('.dm-editor-right')) return
      if (target?.closest?.('.editor-v2-panel-host')) return
      // Клик по контекстному меню (оно в portal) - не трогаем выделение
      if (target?.closest?.('.dm-sticker-context-menu')) return

      editorState.selectLayer(null)
    }

    document.addEventListener('mousedown', handlePointerDownOutsideCanvas)
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutsideCanvas)
    }
  }, [editorState])

  // Глобальное удаление слоя (Delete/Backspace)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }

      e.preventDefault();

      if (editorState.selectedLayerId && editorState.selectedLayerId !== 'bg') {
        editorState.deleteLayer(editorState.selectedLayerId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorState]);

  const getBgLabel = () => {
    if (project?.backgroundType === 'transparent') return 'Transparent'
    if (project?.backgroundType === 'green') return 'Green Screen'
    return 'Default'
  }

  const handleChangeLayer = React.useCallback((layerId, changes) => {
    editorState.updateLayer(layerId, changes)
  }, [editorState])

 // ===== Sticker layer helpers (контекстное меню: дублировать / порядок слоёв) =====
  const updateStickerLayers = React.useCallback((updater) => {
    if (!project?.stickerLayers || !onChangeProject) return
    const next = updater(Array.isArray(project.stickerLayers) ? project.stickerLayers : [])
    onChangeProject({ ...project, stickerLayers: next })
  }, [project, onChangeProject])

  const getNextZIndex = React.useCallback((layers) => 
    (layers || []).reduce((max, l) => Math.max(max, l?.zIndex || 0), 0) + 1, [])

  // НОВАЯ ЧИСТАЯ ФУНКЦИЯ: Конвертация фона в слой (Устранено дублирование)
  const handleConvertBackgroundToLayer = React.useCallback((bgType) => {
    const urlMatch = bgType.match(/url\(["']?([^"')]+)["']?\)/)
    if (urlMatch?.[1]) {
      const imageUrl = urlMatch[1]
      const img = new Image()
      
      const currentProject = project;
      const currentOnChangeProject = onChangeProject;
      const currentEditorState = editorState;
      
      img.onload = () => {
        const newId = `bg-img-${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        // getBaseFrameSize должен быть доступен в этом скоупе
        const { width, height } = getBaseFrameSize(window.innerWidth <= 768) 
        const newLayer = { id: newId, imageUrl, x: 50, y: 50, width, height, fit: 'cover', rotation: 0, locked: false, visible: true, type: 'background-image' }
        const otherLayers = (currentProject?.stickerLayers || []).filter(l => l.type !== 'background-image')
        
        currentOnChangeProject({ 
          ...currentProject, 
          stickerLayers: [...otherLayers, newLayer], 
          backgroundType: 'transparent', 
          backgroundAlpha: 1, 
          selectedStickerId: newId 
        })
        setTimeout(() => currentEditorState.selectLayer(newId), 0)
      }
      img.src = imageUrl
    }
  }, [project, onChangeProject, editorState])


  const moveStickerLayer = React.useCallback((layerId, mode) => {
    updateStickerLayers((layers) => {
      const sortable = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      const idx = sortable.findIndex(l => l.id === layerId)
      if (idx < 0) return layers

      const arr = [...sortable]
      if (mode === 'forward' && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      else if (mode === 'backward' && idx > 0) [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]]
      else if (mode === 'toBack') arr.unshift(arr.splice(idx, 1)[0])
      else return layers

      return layers.map(l => {
        const newIdx = arr.findIndex(item => item.id === l.id)
        return newIdx !== -1 ? { ...l, zIndex: newIdx + 1 } : l
      })
    })
  }, [updateStickerLayers])

  const handleDuplicateStickerLayer = React.useCallback((layerId) => {
    updateStickerLayers((layers) => {
      const src = layers.find(l => l?.id === layerId)
      if (!src) return layers
      const nextId = `dup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      return [...layers, { ...src, id: nextId, x: (src.x || 50) + 2, y: (src.y || 50) + 2, zIndex: getNextZIndex(layers), locked: false }]
    })
  }, [updateStickerLayers, getNextZIndex])

  // Очищенный handleCanvasClick, использующий новую функцию
  const handleCanvasClick = React.useCallback((e) => {
    if (e.target === canvasRef.current || e.target.closest('.editor-v2-canvas-bg')) {
      editorState.selectLayer(null)
    }
    
    const bgElement = e.target.closest('.editor-v2-canvas-bg-image-clickable')
    const bgType = project?.backgroundType
    
    // Используем вынесенную функцию, если фон - это URL
    if (bgElement && typeof bgType === 'string' && bgType.startsWith('url(')) {
      e.stopPropagation()
      handleConvertBackgroundToLayer(bgType)
    }
  }, [editorState, project, handleConvertBackgroundToLayer])

  // Проверка контента и экспорта
  const hasContent = React.useMemo(() => {
    if (!project) return false
    const { textLayers, stickerLayers, iconLayers, videoLayers, frameLayers, backgroundType } = project
    return [textLayers, stickerLayers, iconLayers, videoLayers, frameLayers].some(l => l?.length > 0) || (backgroundType && backgroundType !== 'transparent')
  }, [project])

  const canExportSVG = React.useMemo(() => {
    if (!project) return false
    const hasRaster = project.videoLayers?.length > 0 || project.stickerLayers?.length > 0 || (typeof project.backgroundType === 'string' && project.backgroundType.startsWith('url('))
    return !hasRaster
  }, [project])

  // Отладочные логи
  React.useEffect(() => {
    console.log('EditorShell render:', { 
      hasProject: !!project, 
      activeTool, 
      isCleanView,
      canvasFrameStyle 
    })
  }, [project, activeTool, isCleanView, canvasFrameStyle])

  return (
    <div 
      className={`dm-editor-shell ${isCleanView ? 'dm-editor-shell--clean' : ''}`}
      onTouchStart={isMobile ? handleGlobalTouchStart : undefined}
      onTouchEnd={isMobile ? handleGlobalTouchEnd : undefined}
    >
      {!isCleanView && (
        <div className="dm-editor-header">
          <HeaderBar 
            onAccount={onAccount}
            hasContent={hasContent}
            showHistoryControls={hasCanvasLayers}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canExportSVG={canExportSVG}
            showDownloadDropdown={showDownloadDropdown}
            setShowDownloadDropdown={setShowDownloadDropdown}
            downloadDropdownRef={downloadDropdownRef}
            projectName={project?.name}
          />
        </div>
      )}

{/* Main area */}
      <div className={`dm-editor-main ${
        isCleanView 
          ? 'dm-editor-main--clean' 
          : activeTool === 'background' 
            ? (isCategoriesRailCollapsed ? 'dm-editor-main--with-rail-collapsed' : 'dm-editor-main--with-rail')
            : activeTool === 'stickers' && stickerCategories.length > 0
            ? (isStickerCategoriesRailCollapsed ? 'dm-editor-main--with-sticker-rail-collapsed' : 'dm-editor-main--with-sticker-rail')
            : ''
      } ${activeTool === 'audio' ? 'dm-editor-main--right-wide' : ''}`}>
        
        {/* Left Sidebar - скрыта на мобильных */}
        {!isCleanView && !isMobile && (
          <div className="dm-editor-sidebar">
            <div className="dm-editor-sidebar-tools">
              <RightToolbar activeTool={activeTool} onChangeTool={handleToolbarToolChange} />
              
              <div className="dm-editor-sidebar-brand-wrapper" ref={brandMenuRef}>
                <div 
                  className="dm-editor-sidebar-brand"
                  onClick={handleBrandClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dm-editor-sidebar-brand-main">v1.0</div>
                  <div className="dm-editor-sidebar-brand-sub">
                    <span className="dm-editor-brand-prefix">DUSHANBE</span>{' '}
                    <span className="dm-editor-brand-motion">MOTION</span>
                  </div>
                </div>

                {showBrandMenu && (
                  <div className="dm-editor-sidebar-brand-menu">
                    {[
                      { id: 'faq', label: 'FAQ', icon: <><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></> },
                      { id: 'policy', label: 'Policy', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></> },
                      { id: 'projects', label: 'Projects', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path> },
                      { id: 'soon', label: 'Soon', icon: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></> },
                      { id: 'contacts', label: 'Contacts', icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></> }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`dm-editor-sidebar-brand-menu-item ${activeModal === item.id ? 'dm-editor-sidebar-brand-menu-item-active' : ''}`}
                        onClick={() => handleModalOpen(item.id)}
                      >
                        <span className="dm-editor-sidebar-brand-menu-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {item.icon}
                          </svg>
                        </span>
                        <span className="dm-editor-sidebar-brand-menu-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
{/* Canvas Area */}
        <div className="dm-editor-canvas-area">
          <div
            className="editor-v2-canvas-wrapper"
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={() => {
              setIsCanvasActive(true)
              if (canvasIdleTimerRef.current) clearTimeout(canvasIdleTimerRef.current)
            }}
            onTouchEnd={() => {
              canvasIdleTimerRef.current = setTimeout(() => setIsCanvasActive(false), 100)
            }}
            onMouseDown={(e) => {
              if (isSpacePressed && e.button === 0) {
                const target = e.target
                const isInteractive = target.closest(
                  '.dm-layer-text, .sticker-layer, .icon-layer, .video-layer, .frame-layer, button, input, select, textarea, .dm-text-handle, .editor-v2-canvas-controls, .editor-v2-canvas-controls *, .layer-selection-box'
                )
                if (!isInteractive) {
                  handleCanvasPanStart(e)
                  return
                }
              }
            }}
            style={{ cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : undefined }}
          >
            <div
              className="editor-v2-canvas-column"
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            >
              <div className="editor-v2-canvas-stage" style={{ transform: `scale(${zoom})` }}>
                <div className="editor-v2-canvas-backdrop">
                  <div 
                    className="editor-v2-canvas-frame" 
                    ref={(el) => {
                      canvasRef.current = el
                      if (el) {
                        // Отладочная информация
                        const rect = el.getBoundingClientRect()
                        console.log('Canvas frame dimensions:', {
                          width: rect.width,
                          height: rect.height,
                          style: canvasFrameStyle,
                          visible: rect.width > 0 && rect.height > 0
                        })
                      }
                    }}
                    onClick={handleCanvasClick}
                    onMouseDown={(e) => {
                      const isBgImage = typeof project?.backgroundType === 'string' && project.backgroundType.startsWith('url(')
                      if (e.target.closest('.editor-v2-canvas-bg-image-clickable') && isBgImage) {
                        e.stopPropagation()
                      }
                    }}
                    style={{
                      ...canvasFrameStyle,
                      minWidth: canvasFrameStyle?.width || 630,
                      minHeight: canvasFrameStyle?.height || 354,
                      width: canvasFrameStyle?.width || 630,
                      height: canvasFrameStyle?.height || 354,
                    }}
                  >
                      {/* Фон */}
                      <div 
                        key={project?.backgroundType || 'default-bg'}
                        className={`editor-v2-canvas-bg ${
                          project?.backgroundType === 'transparent' 
                            ? `editor-v2-bg-checker editor-v2-bg-checker-${project?.checkerboardIntensity || 'light'}` 
                            : ''
                        } ${
                          typeof project?.backgroundType === 'string' && project.backgroundType.startsWith('url(')
                            ? 'editor-v2-canvas-bg-image-clickable'
                            : ''
                        }`}
                        onClick={(e) => {
                          if (typeof project?.backgroundType === 'string' && project.backgroundType.startsWith('url(')) {
                            e.stopPropagation()
                            const urlMatch = project.backgroundType.match(/url\(["']?([^"')]+)["']?\)/)
                            if (urlMatch?.[1]) {
                              const imageUrl = urlMatch[1]
                              const img = new Image()
                              img.onload = () => {
                                const newId = `bg-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                                const { width, height } = getBaseFrameSize(window.innerWidth <= 768)
                                const newLayer = { id: newId, imageUrl, x: 50, y: 50, width, height, fit: 'cover', rotation: 0, locked: false, visible: true, type: 'background-image' }
                                
                                const otherLayers = (project?.stickerLayers || []).filter(l => l.type !== 'background-image')
                                onChangeProject({
                                  ...project,
                                  stickerLayers: [...otherLayers, newLayer],
                                  backgroundType: 'transparent',
                                  backgroundAlpha: 1,
                                  selectedStickerId: newId
                                })
                                setTimeout(() => editorState.selectLayer(newId), 0)
                              }
                              img.src = imageUrl
                            }
                          }
                        }}
                        style={{
                          background: project?.backgroundType === 'transparent' ? undefined : (
                            project?.backgroundType === 'white' ? '#fafafa' :
                            project?.backgroundType === 'black' ? '#000000' :
                            project?.backgroundType === 'green' ? '#00ff00' : 
                            (project?.backgroundType || '#fafafa') // Fallback на белый фон
                          ),
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          opacity: project?.backgroundAlpha ?? 1,
                          width: '100%', 
                          height: '100%', 
                          position: 'absolute', 
                          inset: 0, 
                          borderRadius: '10px',
                          minWidth: '100%',
                          minHeight: '100%'
                        }}
                      />
                    
{/* Сетка */}
                    {showGrid && (
                      <div className={`editor-v2-canvas-grid ${
                        project?.backgroundType === 'white' || 
                        (typeof project?.backgroundType === 'string' && 
                        project.backgroundType.startsWith('#') && 
                        !['#000000', '#000'].includes(project.backgroundType))
                          ? 'editor-v2-canvas-grid-light-bg' : ''
                      }`}>
                        <div className="grid-line grid-v1" /><div className="grid-line grid-v2" />
                        <div className="grid-line grid-h1" /><div className="grid-line grid-h2" />
                      </div>
                    )}
                  
                  {/* Текстовые слои */}
                  {project?.textLayers?.map(layer => {
                    if (!layer?.id || layer.visible === false) return null
                    const isSelected = editorState.selectedLayerId === layer.id

                    return (
                      <TextLayer
                        key={layer.id}
                        layer={layer}
                        isSelected={isSelected}
                        onSelect={handleSelectLayer}
                        onChangeLayer={(changes) => handleChangeLayer(layer.id, changes)}
                        canvasRef={canvasRef}
                        project={project}
                        onChangeProject={onChangeProject}
                        isSpacePressed={isSpacePressed}
                        zoom={zoom}
                        offset={offset}
                      />
                    )
                  })}
                  
{/* Стикеры */}
                  {project?.stickerLayers && Array.isArray(project.stickerLayers) && project.stickerLayers.map(layer => {
                    if (!layer || !layer.id || layer.visible === false) return null
                    const isSelected = editorState.selectedLayerId === layer.id

                    return (
                      <StickerLayer
                        key={layer.id}
                        layer={layer}
                        isFemale={isStickersFemaleMode} // Добавили передачу режима
                        isSelected={isSelected}
                        onSelect={(id) => editorState.selectLayer(id)}
                        onChangeLayer={(changes) => {
                          const updatedLayers = project.stickerLayers.map(l =>
                            l.id === layer.id ? { ...l, ...changes } : l
                          )
                          onChangeProject({ ...project, stickerLayers: updatedLayers })
                        }}
                        onDelete={(id) => {
                          const updatedLayers = project.stickerLayers.filter(l => l.id !== id)
                          onChangeProject({
                            ...project,
                            stickerLayers: updatedLayers,
                            selectedStickerId: null,
                          })
                        }}
                        onDuplicate={handleDuplicateStickerLayer}
                        onBringForward={(id) => moveStickerLayer(id, 'forward')}
                        onSendBackward={(id) => moveStickerLayer(id, 'backward')}
                        onSendToBack={(id) => moveStickerLayer(id, 'toBack')}
                        canvasRef={canvasRef}
                        isSpacePressed={isSpacePressed}
                        zoom={zoom}
                      />
                    )
                  })}

                  {/* Видео/Футажи */}
                  {project?.videoLayers && Array.isArray(project.videoLayers) && project.videoLayers.map(layer => {
                    if (!layer || !layer.id || layer.visible === false) return null
                    const isSelected = editorState.selectedLayerId === layer.id

                    return (
                      <VideoLayer
                        key={layer.id}
                        layer={layer}
                        isSelected={isSelected}
                        onSelect={(id) => editorState.selectLayer(id)}
                        onChangeLayer={(changes) => {
                          const updatedLayers = project.videoLayers.map(l =>
                            l.id === layer.id ? { ...l, ...changes } : l
                          )
                          onChangeProject({ ...project, videoLayers: updatedLayers })
                        }}
                        canvasRef={canvasRef}
                        isSpacePressed={isSpacePressed}
                      />
                    )
                  })}
{/* Рамки */}
                  {project?.frameLayers?.map(layer => {
                    if (!layer?.id || layer.visible === false) return null;
                    const isSelected = editorState.selectedLayerId === layer.id;

                    return (
                      <FrameLayer
                        key={layer.id}
                        layer={layer}
                        isSelected={isSelected}
                        onSelect={(id) => editorState.selectLayer(id)}
                        onChangeLayer={(changes) => {
                          const updatedLayers = project.frameLayers.map(l =>
                            l.id === layer.id ? { ...l, ...changes } : l
                          );
                          onChangeProject({ ...project, frameLayers: updatedLayers });
                        }}
                        canvasRef={canvasRef}
                        isSpacePressed={isSpacePressed}
                      />
                    );
                  })}

                  {/* Иконки */}
                  {project?.iconLayers?.map(layer => {
                    if (!layer?.id || layer.visible === false) return null;
                    const isSelected = editorState.selectedLayerId === layer.id;

                    return (
                      <IconLayer
                        key={layer.id}
                        layer={layer}
                        isSelected={isSelected}
                        onSelect={(id) => editorState.selectLayer(id)}
                        onChangeLayer={(changes) => {
                          const updatedLayers = project.iconLayers.map(l =>
                            l.id === layer.id ? { ...l, ...changes } : l
                          );
                          onChangeProject({ ...project, iconLayers: updatedLayers });
                        }}
                        canvasRef={canvasRef}
                        isSpacePressed={isSpacePressed}
                      />
                    );
                  })}
                  
                  {/* Превью стикера при удержании */}
                  {previewSticker && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '300px',
                      height: '300px',
                      zIndex: 99999,
                      pointerEvents: 'none',
                      animation: 'stickerPreviewAppear 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                      <img 
                        src={previewSticker.url} 
                        alt={previewSticker.fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Background Categories Rail */}
        {!isCleanView && (
          <BackgroundCategoriesRail
            activeCategory={activeBackgroundCategory}
            onCategoryChange={setActiveBackgroundCategory}
            isVisible={activeTool === 'background'}
            isCollapsed={isCategoriesRailCollapsed}
            onToggleCollapse={() => setIsCategoriesRailCollapsed(!isCategoriesRailCollapsed)}
            onPrefetchCategory={(category) => {
              // Prefetch через глобальную функцию из BackgroundPanel
              if (window.__backgroundPrefetch) {
                window.__backgroundPrefetch(category);
              }
            }}
          />
        )}

        {/* Sticker Categories Rail */}
        {!isCleanView && (
          <StickerCategoriesRail
            activeCategory={activeStickerCategory}
            onCategoryChange={handleStickerCategoryChange}
            categories={stickerCategories}
            isVisible={activeTool === 'stickers' && stickerCategories.length > 0}
            isCollapsed={isStickerCategoriesRailCollapsed}
            onToggleCollapse={() => setIsStickerCategoriesRailCollapsed(!isStickerCategoriesRailCollapsed)}
            isFemale={isStickersFemaleMode}
          />
        )}

        {/* Right Panel - скрыта на мобильных */}
        {!isCleanView && !isMobile && (
          <div className="dm-editor-right">
            <div className="dm-editor-right-inner">
              <RightPanelHost
                activeTool={activeTool}
                project={project}
                onChangeProject={onChangeProject}
                editorState={editorState}
                activeBackgroundCategory={activeTool === 'background' ? activeBackgroundCategory : null}
                onPreviewVideoAspectChange={activeTool === 'beats' ? setPreviewVideoAspect : undefined}
              />
              

              {/* Элементы управления канвасом */}
              <div className="editor-v2-canvas-controls-overlay">
                {/* Zoom controls отключены */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <FAQModal isOpen={activeModal === 'faq'} onClose={handleModalClose} />
      <PolicyModal isOpen={activeModal === 'policy'} onClose={handleModalClose} />
      <ProjectsModal isOpen={activeModal === 'projects'} onClose={handleModalClose} />
      <SoonModal isOpen={activeModal === 'soon'} onClose={handleModalClose} />
      <ContactsModal isOpen={activeModal === 'contacts'} onClose={handleModalClose} />
      
      {/* Промо-окно акции PREMIUM */}
      <PromoModal isOpen={isPromoOpen} onClose={closePromo} />

      {/* Мобильная панель инструментов (внизу экрана) */}
      <MobileToolbar 
        activeTool={activeTool}
        isCanvasActive={isCanvasActive}
        isPanelOpen={isMobilePanelOpen && isMobile}
        onToolChange={(toolId) => {
          // При нажатии на текст - открываем панель на весь экран
          if (toolId === 'text') {
            onChangeTool(toolId)
            // Добавляем новый текст если это первое нажатие
            if (activeTool !== 'text' && editorState?.addTextLayer) {
              editorState.addTextLayer()
            }
            // ОТКРЫВАЕМ панель текста на весь экран
            setIsMobilePanelOpen(true)
            return
          }
          
          // Для других инструментов - переключаем и открываем панель
          onChangeTool(toolId)
          setIsMobilePanelOpen(true)
        }}
        onBazarClick={onOpenBaza}
        onOpenPanel={() => setIsMobilePanelOpen(true)}
      />

      {/* Мобильная выдвижная панель свойств */}
      <TextPanelTabsProvider>
        <MobilePanelWithTabs
          isOpen={isMobilePanelOpen && isMobile}
          onClose={() => setIsMobilePanelOpen(false)}
          activeTool={activeTool}
          project={project}
          onChangeProject={onChangeProject}
          editorState={editorState}
          activeBackgroundCategory={activeBackgroundCategory}
          setPreviewVideoAspect={setPreviewVideoAspect}
          stickerCategories={stickerCategories}
          activeStickerCategory={activeStickerCategory}
          onStickerCategoryChange={handleStickerCategoryChange}
        />
      </TextPanelTabsProvider>
    </div>
  )
}

// Компонент MobilePanel с табами для текста и категориями для стикеров
function MobilePanelWithTabs({ isOpen, onClose, activeTool, project, onChangeProject, editorState, activeBackgroundCategory, setPreviewVideoAspect, stickerCategories = [], activeStickerCategory, onStickerCategoryChange }) {
  const isMobile = useIsMobile()
  const { activeSection, setActiveSection } = useTextPanelTabs()
  
  const TEXT_SECTIONS = [
    { id: 'text', label: 'ТЕКСТ' },
    { id: 'style', label: 'СТИЛЬ' },
    { id: 'effects', label: 'ЭФФЕКТЫ' },
    { id: 'templates', label: 'ШАБЛОНЫ' },
  ]

  const headerContent = activeTool === 'text' ? (
    <div style={{ 
      width: '100%',
      display: 'flex', 
      gap: 6, 
      overflowX: 'auto', 
      overflowY: 'hidden',
      paddingLeft: 8, 
      paddingRight: 8,
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      minWidth: 0,
    }}>
      {TEXT_SECTIONS.map(section => {
        const isActive = section.id === activeSection
        return (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 8,
              background: isActive ? 'rgba(0, 255, 162, 0.15)' : 'rgba(255,255,255,0.06)',
              border: isActive ? '1px solid rgba(0, 255, 162, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: isActive ? '#00ffa2' : 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            {section.label}
          </button>
        )
      })}
    </div>
  ) : activeTool === 'stickers' && stickerCategories.length > 0 ? (
    <div style={{ 
      display: 'flex', 
      gap: 6, 
      overflowX: 'auto', 
      overflowY: 'hidden',
      paddingLeft: 8, 
      paddingRight: 8,
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      width: '100%',
      minWidth: 0,
      touchAction: 'pan-x', // Разрешаем горизонтальную прокрутку касанием
      alignItems: 'center',
    }}>
      {stickerCategories.map(category => {
        const isActive = category.id === activeStickerCategory
        return (
          <button
            key={category.id}
            onClick={() => onStickerCategoryChange?.(category.id)}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 8,
              background: isActive ? 'rgba(0, 255, 162, 0.15)' : 'rgba(255,255,255,0.06)',
              border: isActive ? '1px solid rgba(0, 255, 162, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: isActive ? '#00ffa2' : 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              flexGrow: 0,
              cursor: 'pointer',
              minWidth: 'auto',
            }}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  ) : null

  return (
    <MobilePanel
      isOpen={isOpen && isMobile}
      onClose={onClose}
      title={
        activeTool === 'background' ? 'Фон' :
        activeTool === 'text' ? null :
        activeTool === 'stickers' && stickerCategories.length > 0 ? null : // Убираем заголовок, если есть категории
        activeTool === 'stickers' ? 'Стикеры' :
        activeTool === 'music' ? 'Музыка' :
        activeTool === 'beats' ? 'Видео' :
        activeTool === 'icons' ? 'Иконки' : null
      }
      headerContent={headerContent}
    >
      {({ onClose: closePanel }) => (
        <RightPanelHost
          activeTool={activeTool}
          project={project}
          onChangeProject={onChangeProject}
          editorState={editorState}
          activeBackgroundCategory={activeTool === 'background' ? activeBackgroundCategory : null}
          onPreviewVideoAspectChange={activeTool === 'beats' ? setPreviewVideoAspect : undefined}
          onClose={closePanel}
        />
      )}
    </MobilePanel>
  )
}