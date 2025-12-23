// src/editorV2/panels/text/TextPanelFont.jsx
import React, { useMemo, useState, useCallback } from 'react'
import DM_FONTS, { ensureFontFaceLoaded, getFontById } from '../../fonts/fontRegistry'
import { useAuth } from '../../../lib/useAuth'
import { addAsset, deleteAsset, getUserAssets, toggleFavorite as toggleAssetFavorite } from '../../../services/assetsService'

// строим библиотеку шрифтов на основе DM_FONTS (из R2)
const FONT_LIBRARY = (() => {
  try {
    if (!Array.isArray(DM_FONTS) || DM_FONTS.length === 0) {
      console.warn('DM_FONTS is not an array or is empty')
      return []
    }
    
    return DM_FONTS.map((font, index) => {
      if (!font) return null
      
      // имя для отображения
      const baseName =
        font.family ||
        font.id ||
        font.file ||
        'Font'

      const prettyLabel = baseName
        .replace(/[_]+/g, ' ')
        .replace(/[-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        id: font.id || `font-${index}`,
        label: prettyLabel,
        family: font.family || prettyLabel,
        recommended: index < 12,
        // Первые 100 шрифтов - бесплатные, остальные считаем PREMIUM
        premium: index >= 100,
      }
    }).filter(Boolean) // убираем null значения
  } catch (error) {
    console.error('Error building FONT_LIBRARY:', error)
    return []
  }
})()

export default function TextPanelFont(props) {
  const {
    project,
    currentLayer,
    onChangeLayer,
    onChangeProject
  } = props

  const { user } = useAuth()
  const [search, setSearch] = useState('')
  // Вкладки: БЕСПЛАТНЫЕ / PREMIUM / ИЗБРАННЫЕ
  const [activeTab, setActiveTab] = useState('free') // 'free' | 'premium' | 'favorites'
  const [showSearch, setShowSearch] = useState(false)
  // Индекс активного элемента в списке (для клавиатуры)
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = React.useRef(null)

  const [favoritesFromAssets, setFavoritesFromAssets] = useState([])
  
  // Загружаем избранные шрифты из user_assets при монтировании и изменении пользователя
  React.useEffect(() => {
    const loadFavoriteFonts = async () => {
      if (!user?.id) {
        // Если нет пользователя, используем project.textFontFavorites
        if (project && Array.isArray(project.textFontFavorites)) {
          setFavoritesFromAssets(project.textFontFavorites)
        }
        return
      }
      
      try {
        const userFontAssets = await getUserAssets(user.id, 'font')
        const favoriteFontIds = userFontAssets
          .filter(asset => asset.is_favorite === true)
          .map(asset => asset.asset_url || asset.asset_name)
        setFavoritesFromAssets(favoriteFontIds)
        
        // Синхронизируем с project.textFontFavorites
        if (project && JSON.stringify(project.textFontFavorites || []) !== JSON.stringify(favoriteFontIds)) {
          onChangeProject?.({
            ...project,
            textFontFavorites: favoriteFontIds
          })
        }
      } catch (error) {
        console.error('Error loading favorite fonts:', error)
        // Fallback на project.textFontFavorites
        if (project && Array.isArray(project.textFontFavorites)) {
          setFavoritesFromAssets(project.textFontFavorites)
        }
      }
    }
    
    loadFavoriteFonts()
  }, [user?.id, project?.projectId]) // Перезагружаем при изменении пользователя или проекта
  
  const favorites = useMemo(() => {
    // Используем favoritesFromAssets если есть пользователь, иначе project.textFontFavorites
    if (user?.id && favoritesFromAssets.length > 0) {
      return favoritesFromAssets
    }
    if (!project || !Array.isArray(project.textFontFavorites)) return []
    return project.textFontFavorites
  }, [favoritesFromAssets, project, user])

  const toggleFavorite = useCallback(
    async (fontId) => {
      if (!project || !onChangeProject) return
      
      const currentFavs = project.textFontFavorites || []
      const exists = currentFavs.includes(fontId)

      // Если удаляем из избранного
      if (exists) {
        // Сразу обновляем UI - удаляем из локального списка
        const nextFav = currentFavs.filter(id => id !== fontId)
        onChangeProject({
          ...project,
          textFontFavorites: nextFav
        })
        setFavoritesFromAssets(prev => prev.filter(id => id !== fontId))
        
        // Синхронизируем с user_assets - удаляем из избранного
        if (user?.id) {
          try {
            const userAssets = await getUserAssets(user.id, 'font')
            const asset = userAssets.find(a => a.asset_url === fontId || a.asset_name === fontId)
            if (asset) {
              // Удаляем актив из таблицы полностью
              await deleteAsset(asset.id)
            }
          } catch (error) {
            console.error('Error removing font from assets:', error)
          }
        }
        return
      }

      // Сразу обновляем UI - добавляем в локальный список (без лимитов, всё бесплатно)
      const nextFav = [...currentFavs, fontId]
      onChangeProject({
        ...project,
        textFontFavorites: nextFav
      })
      setFavoritesFromAssets(prev => {
        if (!prev.includes(fontId)) {
          return [...prev, fontId]
        }
        return prev
      })
      
      // Синхронизируем с user_assets - добавляем в избранное
      if (user?.id) {
        try {
          const font = getFontById(fontId)
          if (!font) return
          
          // Проверяем, существует ли уже такой актив
          const userAssets = await getUserAssets(user.id, 'font')
          const existingAsset = userAssets.find(a => a.asset_url === fontId || a.asset_name === fontId)
          
          if (!existingAsset) {
            // Создаем новый актив сразу с is_favorite = true
            console.log('📝 Creating new font asset:', { fontId, fontName: font.label || font.family })
            const newAsset = await addAsset(user.id, {
              asset_type: 'font',
              asset_name: font.label || font.family || fontId,
              asset_url: fontId,
              is_favorite: true
            })
            
            if (newAsset) {
              console.log('Font asset created successfully:', newAsset)
            } else {
              console.warn('Could not create font asset - returned null')
            }
          } else {
            // Если актив существует
            if (!existingAsset.is_favorite) {
              // Если не в избранном - обновляем
              console.log('📝 Updating existing font asset to favorite:', existingAsset.id)
              await toggleAssetFavorite(existingAsset.id, true)
              console.log('Font asset updated to favorite')
            } else {
              console.log('Font asset already exists and is favorite:', existingAsset.id)
            }
          }
        } catch (error) {
          console.error('Error adding font to assets:', error)
        }
      }
    },
    [project, onChangeProject, user]
  )

  const filteredFonts = useMemo(() => {
    if (!Array.isArray(FONT_LIBRARY) || FONT_LIBRARY.length === 0) {
      return []
    }
    
    let list = FONT_LIBRARY

    // Фильтр по вкладкам
    if (activeTab === 'favorites') {
      list = list.filter(f => f && favorites.includes(f.id))
    } else if (activeTab === 'premium') {
      list = list.filter(f => f && f.premium)
    } else if (activeTab === 'free') {
      list = list.filter(f => f && !f.premium)
    }
    // иначе показываем все

    // Фильтр по поиску
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        f =>
          f && 
          f.label && 
          f.family &&
          (f.label.toLowerCase().includes(q) ||
          f.family.toLowerCase().includes(q))
      )
    }

    return list || []
  }, [search, activeTab, favorites])

  // Получаем текущий fontFamily, проверяя и fontId и fontFamily
  const currentFontFamily = useMemo(() => {
    if (!currentLayer) return 'Inter'
    
    // Если есть fontId, находим шрифт и используем его family
    if (currentLayer.fontId) {
      const font = DM_FONTS.find(f => f.id === currentLayer.fontId)
      if (font) {
        // Убеждаемся, что шрифт загружен
        ensureFontFaceLoaded(currentLayer.fontId).catch(() => {})
        return font.family
      }
    }
    
    // Иначе используем fontFamily из слоя
    return currentLayer.fontFamily || 'Inter'
  }, [currentLayer])

  // При смене вкладки или поискового запроса сбрасываем активный индекс
  React.useEffect(() => {
    setActiveIndex(0)
  }, [activeTab, search])

  // При первом показе панели шрифтов даём фокус списку, чтобы стрелки сразу работали
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.focus()
    }
  }, [])

  const handleSelectFont = useCallback(
    (font) => {
      if (!onChangeLayer || !font || !currentLayer) {
        console.warn('⚠️ handleSelectFont: missing required props', { 
          onChangeLayer: !!onChangeLayer, 
          font: !!font,
          currentLayer: !!currentLayer 
        })
        return
      }

      console.log('📝 Selecting font:', { 
        fontId: font.id, 
        fontFamily: font.family, 
        currentLayerId: currentLayer.id,
        currentFontId: currentLayer.fontId 
      })

      // Загружаем шрифт заранее
      if (font.id) {
        ensureFontFaceLoaded(font.id)
          .then(() => {
            console.log('Font loaded successfully:', font.id)
          })
          .catch((error) => {
            console.error('Error loading font:', font.id, error)
          })
      }

      // Обновляем слой с новым шрифтом - это должно немедленно применить изменения
      onChangeLayer({
        fontId: font.id,
        fontFamily: font.family
      })
      
      console.log('Font change applied to layer:', { layerId: currentLayer.id, fontId: font.id })
    },
    [onChangeLayer, currentLayer]
  )

  // Клавиатурная навигация по списку шрифтов
  const handleListKeyDown = useCallback((e) => {
    if (!filteredFonts || filteredFonts.length === 0) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1

      // Считаем следующий индекс от текущего состояния
      let next = activeIndex + dir
      if (next < 0) next = 0
      if (next >= filteredFonts.length) next = filteredFonts.length - 1

      setActiveIndex(next)

      // Автоскролл к активному элементу
      const container = listRef.current
      if (container) {
        const items = container.querySelectorAll('.dm-font-row')
        const el = items[next]
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'nearest' })
        }
      }

      // Живой предпросмотр: сразу применяем шрифт к тексту (только для бесплатных)
      const font = filteredFonts[next]
      if (font && !font.premium) {
        handleSelectFont(font)
      }
    } else if (e.key === 'Enter') {
      // Enter оставляем пустым, чтобы ничего лишнего не дёргалось
      e.preventDefault()
    }
  }, [filteredFonts, activeIndex, handleSelectFont])

  const renderFontRow = (font, indexInList) => {
    if (!font || !font.id || !font.family) {
      return null
    }
    
    const isCurrent = currentFontFamily === font.family
    const isKeyboardActive = indexInList === activeIndex
    const isFav = favorites.includes(font.id)

    // Предзагружаем шрифт при наведении для корректного отображения превью
    const handleMouseEnter = () => {
      if (font.id) {
        ensureFontFaceLoaded(font.id).catch(() => {
          // Игнорируем ошибки при предзагрузке
        })
      }
    }

    return (
      <div
        key={font.id}
        className={
          'dm-font-row' +
          (isCurrent ? ' dm-font-row-active' : '') +
          (isKeyboardActive ? ' dm-font-row-kb' : '') +
          (font.recommended ? ' dm-font-row-recommended' : '')
        }
        onClick={() => {
          if (font.premium) {
            window.open('/pricing', '_blank')
          } else {
            handleSelectFont(font)
          }
        }}
        onMouseEnter={handleMouseEnter}
      >
        <div className="dm-font-row-main">
          <div
            className="dm-font-row-ab"
            style={{ 
              fontFamily: font.family.includes(' ') || font.family.includes('-')
                ? `"${font.family}"`
                : font.family
            }}
          >
            Ab
          </div>
          <div className="dm-font-row-text">
            <div className="dm-font-row-label">
              <span className="dm-font-row-index">{indexInList + 1}</span>
              <span>{font.label}</span>
              {font.premium && (
                <span className="dm-font-premium-crown" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 18H20L18.5 9L14.5 13L12 7L9.5 13L5.5 9L4 18Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    <circle cx="5.5" cy="8.5" r="1" fill="currentColor"/>
                    <circle cx="12" cy="6" r="1" fill="currentColor"/>
                    <circle cx="18.5" cy="8.5" r="1" fill="currentColor"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="dm-font-row-meta">
              {font.premium ? 'PREMIUM' : 'БЕСПЛАТНЫЕ'}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={'dm-font-fav-btn' + (isFav ? ' dm-font-fav-btn-active' : '')}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(font.id)
          }}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>
    )
  }

  return (
    <div className="dm-text-section dm-text-font-section">
      <div className="dm-font-groups-tabs">
        <span 
          className={`dm-font-group-label ${activeTab === 'free' ? 'dm-font-group-label-active' : ''}`}
          onClick={() => setActiveTab('free')}
        >
          БЕСПЛАТНЫЕ
        </span>
        <span 
          className={`dm-font-group-label ${activeTab === 'premium' ? 'dm-font-group-label-active' : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          PREMIUM
        </span>
        <span 
          className={`dm-font-group-label ${activeTab === 'favorites' ? 'dm-font-group-label-active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ИЗБРАННЫЕ
        </span>
        <button
          type="button"
          className={`dm-font-search-toggle ${showSearch ? 'dm-font-search-toggle-active' : ''}`}
          onClick={() => setShowSearch(!showSearch)}
          title="Поиск"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 7.5L11 10M9.5 5.5C9.5 7.70914 7.70914 9.5 5.5 9.5C3.29086 9.5 1.5 7.70914 1.5 5.5C1.5 3.29086 3.29086 1.5 5.5 1.5C7.70914 1.5 9.5 3.29086 9.5 5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={`dm-font-search-container ${showSearch ? 'dm-font-search-container-open' : ''}`}>
        <input
          className="dm-input dm-font-search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск шрифта..."
          autoFocus={showSearch}
        />
      </div>

      <div
        className="dm-font-list"
        ref={listRef}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        onClick={() => {
          if (listRef.current) {
            listRef.current.focus()
          }
        }}
      >
        {Array.isArray(filteredFonts) && filteredFonts.length > 0
          ? filteredFonts.map((font, index) => renderFontRow(font, index)).filter(Boolean)
          : <div className="dm-font-list-empty">Нет доступных шрифтов</div>
        }
      </div>

    </div>
  )
}
