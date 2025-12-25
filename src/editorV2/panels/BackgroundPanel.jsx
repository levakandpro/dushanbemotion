import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { useIsMobile } from '../../hooks/useMobileGestures';
import logofiolIcon from '../../assets/icons/logofiol.svg';
import { createStickerClip } from '../utils/stickerClips';
import { makeShuffleSeed, stableShuffle } from '../utils/stableShuffle';
import CollectionModal from '../components/CollectionModal';
import CollabModal from '../components/CollabModal';
import SwipeableGallery from '../components/SwipeableGallery';

// Функция для получения размера канваса
function getBaseFrameSize() {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // Мобильный: вертикальный формат 9:16
    const width = Math.floor(window.innerWidth * 0.92);
    const height = Math.floor(width * (16 / 9));
    
    const maxHeight = window.innerHeight - 140;
    const finalHeight = Math.min(height, maxHeight);
    const finalWidth = finalHeight < height ? Math.floor(finalHeight * (9 / 16)) : width;
    
    return { width: finalWidth, height: finalHeight };
  } else {
    // Десктоп: горизонтальный формат 16:9
    const max = 800;
    return { width: max, height: Math.round((9 / 16) * max) };
  }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// HEX → RGB
function hexToRgb(hex) {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return { r: 255, g: 255, b: 255 };
  const v = parseInt(hex.slice(1), 16);
  return {
    r: (v >> 16) & 255,
    g: (v >> 8) & 255,
    b: v & 255,
  };
}

// RGB → HEX
function rgbToHex(r, g, b) {
  const toHex = (x) => {
    const h = x.toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

// RGB → HSV
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

// HSV → RGB
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return { r, g, b };
}

// CSS-градиент из массива стопов
function buildGradientCss(type, angle, stops) {
  const stopStr = stops.map((s) => `${s.color} ${s.pos}%`).join(", ");
  if (type === "radial") {
    return `radial-gradient(circle, ${stopStr})`;
  }
  return `linear-gradient(${angle}deg, ${stopStr})`;
}


// Категории фонов (для получения русского названия по ключу)
const BACKGROUND_CATEGORIES_MAP = {
  people: "Люди",
  animals: "Животные",
  nature: "Природа",
  culture: "Культура",
  illustrations: "Арт",
  textures: "Текстуры",
  architecture: "Наследие",
  modern: "21 Век",
  food: "Дастархан",
  flags: "Флаги",
  fo: "Рынок",
  sport: "Спорт",
  music: "Музыка",
  love: "Любовь",
  bardak: "Бардак",
};

// Массив категорий для мобильных (горизонтальный скролл)
const BACKGROUND_CATEGORIES = [
  { label: "Люди", key: "people" },
  { label: "Дастархан", key: "food" },
  { label: "Животные", key: "animals" },
  { label: "Природа", key: "nature" },
  { label: "Культура", key: "culture" },
  { label: "Арт", key: "illustrations" },
  { label: "Текстуры", key: "textures" },
  { label: "Наследие", key: "architecture" },
  { label: "21 Век", key: "modern" },
  { label: "Флаги", key: "flags" },
  { label: "Рынок", key: "fo" },
  { label: "Спорт", key: "sport" },
  { label: "Музыка", key: "music" },
  { label: "Любовь", key: "love" },
  { label: "Бардак", key: "bardak" },
];

export default function BackgroundPanel({ project, onChangeProject, activeCategory = 'people', onPrefetchCategory, editorState, onClose }) {
  const toast = useToast()
  const isMobile = useIsMobile()
  const loadMenuRef = useRef(null);
  const initialBgRef = useRef(project.backgroundType);
  const initialBgAlphaRef = useRef(
    typeof project.backgroundAlpha === "number" ? project.backgroundAlpha : 1
  );
  const normalizeHex = (bg) => {
    if (bg === "transparent") return null; // специальный случай
    if (typeof bg === "string" && /^#([0-9a-fA-F]{6})$/.test(bg)) return bg;
    if (bg === "white") return "#ffffff";
    if (bg === "black") return "#000000";
    return "#05070a";
  };

  // ======== MODE ========
  const [mode, setMode] = useState("backgrounds"); // 'backgrounds' | 'settings'
  const [gridColumns, setGridColumns] = useState(1); // 1, 4, 6
  
  // ======== GALLERY STATES ========
  const [galleryState, setGalleryState] = useState("loading"); // 'loading' | 'empty' | 'error' | 'ready'
  
  // ======== SCENES CACHE ========
  const [scenesCache, setScenesCache] = useState({}); // { category: { items: [...], timestamp: ... } }
  const [currentScenesRaw, setCurrentScenesRaw] = useState([]); // raw items (без фильтров)
  const [galleryShuffleSeed, setGalleryShuffleSeed] = useState(() => makeShuffleSeed())
  const visibleScenes = React.useMemo(() => {
    return stableShuffle(
      currentScenesRaw,
      galleryShuffleSeed,
      (scene) => String(scene?.key || scene?.url || scene?.fileName || '')
    )
  }, [currentScenesRaw, galleryShuffleSeed])
  
  // ======== PREVIEW MODAL ========
  const [previewImage, setPreviewImage] = useState(null); // URL изображения для превью
  const [previewPosition, setPreviewPosition] = useState({ top: '50%', left: '50%' }); // Позиция превью
  const previewTimeoutRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const pressStartRef = useRef(0);
  const pressPointRef = useRef({ x: 0, y: 0 });
  const suppressNextClickRef = useRef(false);
  const previewShownRef = useRef(false);
  const didDragRef = useRef(false);
  
  // Коллекции
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedAssetForCollection, setSelectedAssetForCollection] = useState(null);
  
  // Коллабы
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [selectedAssetForCollab, setSelectedAssetForCollab] = useState(null);
  
  // Контекстное меню
  const [contextMenu, setContextMenu] = useState(null); // { x, y, scene }
  
  // ======== REQUEST DEDUPLICATION ========
  const activeRequestsRef = useRef(new Map()); // { category: AbortController }
  
  // ======== LOAD SCENES (with retry & deduplication) ========
  const loadScenes = useCallback(async (category, retryCount = 0) => {
    // Проверяем кэш (TTL: 1 час)
    const cacheEntry = scenesCache[category];
    const CACHE_TTL = 60 * 60 * 1000; // 1 час
    const hasFreshCache = !!(cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL)
    if (hasFreshCache) {
      // Мгновенно показываем кэш, но НЕ выходим - ниже всё равно подтянем свежие данные
      console.log('🎨 Using cache for instant display:', category);
      setCurrentScenesRaw(cacheEntry.items);
      setGalleryState("ready");
    }
    
    // Отменяем предыдущий запрос для этой категории (deduplication)
    const existingRequest = activeRequestsRef.current.get(category);
    if (existingRequest) {
      console.log('🔄 Cancelling duplicate request for category:', category);
      existingRequest.abort();
    }
    
    // Создаем новый AbortController
    const abortController = new AbortController();
    activeRequestsRef.current.set(category, abortController);
    
    console.log('🎨 Loading scenes for category:', category, retryCount > 0 ? `(retry ${retryCount})` : '');
    // Если кэш уже показан - не мигать "loading" и не очищать
    if (!hasFreshCache) {
      setGalleryState("loading");
      if (retryCount === 0) {
        setCurrentScenesRaw([]); // Очищаем только при первом запросе
      }
    }
    
    try {
      // Определяем базовый URL для API (worker)
      const workerUrl = import.meta.env.VITE_WORKER_URL || 'https://stickers-manifest.natopchane.workers.dev';
      // Для мобильных используем папку mob/
      const isMobile = window.innerWidth <= 768;
      
      // ВАЖНО: для мобильных НЕ меняем category, Worker сам должен понимать структуру папок
      const categoryPath = isMobile ? `mob/${category}` : category;
      const apiUrl = `${workerUrl}/api/scenes?category=${encodeURIComponent(categoryPath)}`;
      
      console.log('🎨 [DEBUG] Fetching:', apiUrl);
      console.log('🎨 [DEBUG] isMobile:', isMobile, 'category:', category, 'categoryPath:', categoryPath);
      const response = await fetch(apiUrl, {
        signal: abortController.signal,
        // Нам важно быстро видеть новые добавления - не полагаемся на HTTP-кэш
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        // Удаляем из активных запросов
        activeRequestsRef.current.delete(category);
        
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Unknown error';
        }
        console.error('HTTP error:', response.status, errorText);
        
        // Retry logic для временных ошибок (5xx, network errors)
        const MAX_RETRIES = 3;
        if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
          const delay = Math.min(1500 * Math.pow(2, retryCount), 6000); // Exponential backoff: 1.5s, 3s, 6s
          console.log(`🔄 Retrying in ${delay}ms...`);
          setTimeout(() => {
            loadScenes(category, retryCount + 1);
          }, delay);
          return;
        }
        
        // Если 404 или другая ошибка, возвращаем пустой массив вместо ошибки
        if (response.status === 404 || response.status >= 500) {
          console.warn('⚠️ API returned error, using empty array for category:', category);
          setScenesCache(prev => ({
            ...prev,
            [category]: {
              items: [],
              timestamp: Date.now()
            }
          }));
          setCurrentScenesRaw([]);
          setGalleryState("ready");
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        // Если не удалось распарсить, используем пустой массив
        setScenesCache(prev => ({
          ...prev,
          [category]: {
            items: [],
            timestamp: Date.now()
          }
        }));
        setCurrentScenesRaw([]);
        setGalleryState("ready");
        return;
      }
      console.log('🎨 Scenes data received:', { 
        category, 
        itemsCount: data.items?.length, 
        firstItem: data.items?.[0],
        dataKeys: Object.keys(data)
      });
      
      if (data.items && Array.isArray(data.items)) {
        // Удаляем из активных запросов
        activeRequestsRef.current.delete(category);
        
        // Сохраняем в кэш и устанавливаем текущие сцены
        setScenesCache(prev => ({
          ...prev,
          [category]: {
            items: data.items,
            timestamp: Date.now()
          }
        }));
        
        setCurrentScenesRaw(data.items);
        console.log('🎨 Current scenes set:', data.items.length, 'items for category', category);
        
        // Preload первые 6 изображений для мгновенного отображения
        if (data.items.length > 0) {
          const preloadCount = Math.min(6, data.items.length);
          data.items.slice(0, preloadCount).forEach((scene, idx) => {
            const img = new Image();
            img.src = scene.url;
            img.loading = 'eager';
          });
        }
        
        // Всегда устанавливаем ready, даже если массив пустой
        // Пустой массив будет обработан в UI
        setGalleryState("ready");
      } else {
        activeRequestsRef.current.delete(category);
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Удаляем из активных запросов
      activeRequestsRef.current.delete(category);
      
      // Retry logic для network errors
      if (error.name === 'AbortError') {
        console.log('🔄 Request aborted for category:', category);
        return; // Не показываем ошибку для отмененных запросов
      }
      
      const MAX_RETRIES = 3;
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1500 * Math.pow(2, retryCount), 6000);
        console.log(`🔄 Retrying after error in ${delay}ms...`);
        setTimeout(() => {
          loadScenes(category, retryCount + 1);
        }, delay);
        return;
      }
      
      console.error('Error loading scenes for category', category, ':', error);
      setGalleryState("error");
      setCurrentScenesRaw([]);
    }
  }, [scenesCache]);
  
  // Prefetch функция для категорий (вызывается при наведении)
  const prefetchCategory = useCallback((category) => {
    // Проверяем, не загружена ли уже категория
    const cacheEntry = scenesCache[category];
    const CACHE_TTL = 60 * 60 * 1000; // 1 час
    if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
      return; // Уже в кэше
    }
    
    // Проверяем, нет ли активного запроса
    if (activeRequestsRef.current.has(category)) {
      return; // Уже загружается
    }
    
    // Prefetch в фоне (без изменения UI)
    console.log('🚀 Prefetching category:', category);
    const workerUrl = import.meta.env.VITE_WORKER_URL || 'https://stickers-manifest.natopchane.workers.dev';
    // Для мобильных используем папку mob/
    const isMobile = window.innerWidth <= 768;
    const categoryPath = isMobile ? `mob/${category}` : category;
    const apiUrl = `${workerUrl}/api/scenes?category=${encodeURIComponent(categoryPath)}`;
    
    fetch(apiUrl, { 
      cache: 'default',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.items && Array.isArray(data.items)) {
          setScenesCache(prev => ({
            ...prev,
            [category]: {
              items: data.items,
              timestamp: Date.now()
            }
          }));
          console.log('Prefetched', data.items.length, 'items for category', category);
        }
      })
      .catch(err => {
        console.warn('Prefetch failed for category', category, ':', err);
      });
  }, [scenesCache]);
  
  // Экспортируем prefetch для использования в BackgroundCategoriesRail
  React.useEffect(() => {
    window.__backgroundPrefetch = prefetchCategory;
    return () => {
      delete window.__backgroundPrefetch;
    };
  }, [prefetchCategory]);
  
  // Загрузка сцен при смене категории или режима
  useEffect(() => {
    if (mode === "backgrounds") {
      console.log('🎨 Category changed to:', activeCategory, 'mode:', mode);
      // Каждый вход/переход по категориям в Галерее - новое перемешивание
      setGalleryShuffleSeed(makeShuffleSeed())
      
      // Всегда загружаем заново при смене категории (можно использовать кэш для оптимизации позже)
      // Проверяем кэш только для мгновенного отображения, но все равно загружаем свежие данные
      if (scenesCache[activeCategory]) {
        console.log('🎨 Using cached scenes for instant display:', activeCategory, 'items:', scenesCache[activeCategory].items.length);
        setCurrentScenesRaw(scenesCache[activeCategory].items);
        setGalleryState("ready");
      } else {
        console.log('🎨 No cache, loading scenes for category:', activeCategory);
      }
      
      // Всегда загружаем свежие данные
      loadScenes(activeCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, mode]);

  // Добавление изображения из галереи как слоя на сцену
  const handleAddGalleryImage = useCallback((scene) => {
    if (!scene?.url || !project || !onChangeProject) return;

    const imageUrl = scene.url;
    const img = new Image();

    img.onload = () => {
      const { width: frameWidth, height: frameHeight } = getBaseFrameSize();

      const nextZIndex = (project.stickerLayers || []).reduce(
        (max, layer) => Math.max(max, layer?.zIndex || 0),
        0
      ) + 1;

      // Фоны всегда заполняют весь канвас
      const newSticker = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        imageUrl,
        fileName: scene.fileName || scene.name || 'image',
        x: 50,
        y: 50,
        width: frameWidth,
        height: frameHeight,
        fit: 'cover', // Заполняет канвас полностью
        rotation: 0,
        flipX: false,
        flipY: false,
        opacity: 1,
        zIndex: nextZIndex,
        animIn: 'none',
        animOut: 'none',
        animLoop: 'none',
        visible: true,
        locked: false
      };

      const newClip = createStickerClip(newSticker.id, 0);

      onChangeProject({
        ...project,
        stickerLayers: [...(project.stickerLayers || []), newSticker],
        stickerClips: [...(project.stickerClips || []), newClip],
        selectedStickerId: newSticker.id,
        selectedStickerClipId: newClip.id
      });

      // Закрываем панель на мобильной версии после выбора
      if (isMobile && onClose) {
        setTimeout(() => {
          onClose();
        }, 150);
      }
    };

    img.onerror = () => {
      console.error('❌ Image load error:', imageUrl);
    };

    img.src = imageUrl;
  }, [project, onChangeProject, isMobile, onClose]);
  
  // ======== INFO POPUP ========
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const infoIconRef = useRef(null);
  const infoPopupRef = useRef(null);

  // ======== SOLID COLOR ========

  const initialHex = normalizeHex(project.backgroundType) || "#05070a";
  const initialRgb = hexToRgb(initialHex);
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);
  const initialAlpha =
    typeof project.backgroundAlpha === "number"
      ? clamp(project.backgroundAlpha, 0, 1)
      : 1;

  const [hue, setHue] = useState(initialHsv.h); // 0–360
  const [sat, setSat] = useState(initialHsv.s); // 0–1
  const [val, setVal] = useState(initialHsv.v); // 0–1
  const [hex, setHex] = useState(initialHex);
  const [alpha, setAlpha] = useState(initialAlpha);
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState(false);
  const [wasWhiteBackground, setWasWhiteBackground] = useState(project?.backgroundType === "white");
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loadMenuRef.current && !loadMenuRef.current.contains(event.target)) {
        setShowLoadMenu(false);
      }
      // Закрываем контекстное меню при клике вне (но не на само меню)
      if (contextMenu) {
        const contextMenuEl = document.querySelector('.dm-context-menu');
        if (contextMenuEl && !contextMenuEl.contains(event.target)) {
          setContextMenu(null);
        }
      }
    };

    if (showLoadMenu || contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoadMenu, contextMenu]);

  // ======== TABS (для режима Настройки фона) ========

  const [activeTab, setActiveTab] = useState("color"); // 'color' | 'premium' | 'ideas'
  const [feedbackText, setFeedbackText] = useState(""); // legacy state (kept for compatibility)
  const [feedbackSending, setFeedbackSending] = useState(false) // legacy state (kept for compatibility)
  const [favorites, setFavorites] = useState(new Set()); // Set с ключами избранных фонов
  const [premiumExpanded, setPremiumExpanded] = useState(false); // раскрыта ли премиум секция

  const selectedLayerId = editorState?.selectedLayerId || null
  const selectedLayerData = editorState?.selectedLayer?.data || null
  const canApplyToSelectedLayer = !!(selectedLayerId && selectedLayerId !== 'bg')

  const [premiumView, setPremiumView] = React.useState(null) // null | 'filters' | 'luts' | 'masks' | 'curves' | 'clarityTexture'
  // Чтобы PREMIUM не "прыгал" и не открывался в разных внутренних экранах случайно
  React.useEffect(() => {
    // При смене вкладки - всегда возвращаемся на главный экран PREMIUM
    setPremiumView(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const updateSelectedEffects = React.useCallback((patch) => {
    if (!canApplyToSelectedLayer) return false
    const currentEffects = (selectedLayerData && selectedLayerData.effects) ? selectedLayerData.effects : {}
    const nextEffects = { ...currentEffects, ...(patch || {}) }
    editorState.updateLayer(selectedLayerId, { effects: nextEffects })
    return true
  }, [canApplyToSelectedLayer, editorState, selectedLayerId, selectedLayerData])

  const toggleSelectedEffectFlag = React.useCallback((key) => {
    if (!canApplyToSelectedLayer) return false
    const currentEffects = (selectedLayerData && selectedLayerData.effects) ? selectedLayerData.effects : {}
    const next = { ...currentEffects, [key]: !currentEffects[key] }
    editorState.updateLayer(selectedLayerId, { effects: next })
    return true
  }, [canApplyToSelectedLayer, editorState, selectedLayerId, selectedLayerData])

  const STYLE_CLIPBOARD_KEY = 'dm_style_clipboard_v1'

  const applyToSelectedLayer = React.useCallback((changes) => {
    if (!canApplyToSelectedLayer) return false
    editorState.updateLayer(selectedLayerId, changes || {})
    return true
  }, [canApplyToSelectedLayer, editorState, selectedLayerId])

  const handleCopySelectedStyle = React.useCallback(() => {
    if (!canApplyToSelectedLayer) return
    const l = selectedLayerData || {}
    const payload = {
      filter: l.filter || null,
      filters: l.filters || null,
      fxStack: l.fxStack || null,
      lutStack: l.lutStack || null,
      opacity: l.opacity ?? 1,
      blendMode: l.blendMode || 'normal',
      shadow: l.shadow || null,
      stroke: l.stroke || null,
      glowRadius: l.glowRadius ?? 0,
      glowColor: l.glowColor || null,
      vignette: l.vignette ?? null,
      effects: l.effects || null
    }
    try { localStorage.setItem(STYLE_CLIPBOARD_KEY, JSON.stringify(payload)) } catch {}
  }, [canApplyToSelectedLayer, selectedLayerData])

  const handlePasteSelectedStyle = React.useCallback(() => {
    if (!canApplyToSelectedLayer) return
    try {
      const raw = localStorage.getItem(STYLE_CLIPBOARD_KEY)
      if (!raw) return
      const payload = JSON.parse(raw)
      if (!payload || typeof payload !== 'object') return
      applyToSelectedLayer({
        filter: payload.filter ?? null,
        filters: payload.filters ?? {},
        fxStack: payload.fxStack ?? [],
        lutStack: payload.lutStack ?? [],
        opacity: payload.opacity ?? 1,
        blendMode: payload.blendMode ?? 'normal',
        shadow: payload.shadow ?? { enabled: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 },
        stroke: payload.stroke ?? { enabled: false, color: '#ffffff', width: 0 },
        glowRadius: payload.glowRadius ?? 0,
        glowColor: payload.glowColor ?? null,
        vignette: payload.vignette ?? null,
        effects: payload.effects ?? {}
      })
    } catch {}
  }, [applyToSelectedLayer, canApplyToSelectedLayer])

  const handleResetSelectedAll = React.useCallback(() => {
    if (!canApplyToSelectedLayer) return
    applyToSelectedLayer({
      opacity: 1,
      blendMode: 'normal',
      filter: null,
      filters: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 },
      fxStack: [],
      lutStack: [],
      shadow: { enabled: false, color: '#000000', blur: 0, offsetX: 0, offsetY: 0 },
      stroke: { enabled: false, color: '#ffffff', width: 0 },
      glowRadius: 0,
      glowColor: null,
      vignette: null,
      effects: {}
    })
  }, [applyToSelectedLayer, canApplyToSelectedLayer])

  const PREMIUM_FILTER_PRESETS = React.useMemo(() => ([
    {
      id: 'warm_portrait',
      name: 'Warm Portrait',
      values: { presetId: 'warm_portrait', temperature: 35, contrast: 10, vibrance: 18, shadows: 8, highlights: -6 }
    },
    {
      id: 'cool_cinematic',
      name: 'Cool Cinematic',
      values: { presetId: 'cool_cinematic', temperature: -25, contrast: 16, vibrance: 8, shadows: 4, highlights: -10 }
    },
    {
      id: 'punchy',
      name: 'Punchy',
      values: { presetId: 'punchy', temperature: 5, contrast: 22, vibrance: 25, shadows: 0, highlights: 0 }
    },
    {
      id: 'soft_matte',
      name: 'Soft Matte',
      values: { presetId: 'soft_matte', temperature: 10, contrast: -8, vibrance: -6, shadows: 14, highlights: -8 }
    }
  ]), [])

  const PREMIUM_LUTS = React.useMemo(() => ([
    { id: 'dmotion_cinematic_1', name: 'DMOTION Cinematic 1' },
    { id: 'islam_persian_1', name: 'Persian Gold 1' },
    { id: 'pamir_nature_1', name: 'Pamir Nature 1' },
    { id: 'books_wisdom_1', name: 'Vintage Wisdom 1' }
  ]), [])

  const CURVE_PRESETS = React.useMemo(() => ([
    { id: 'soft', name: 'Soft' },
    { id: 'contrast', name: 'Contrast' },
    { id: 'fade', name: 'Fade' }
  ]), [])

  // ======== GRADIENT PRESETS ========
  const GRADIENT_PRESETS = [
    {
      name: "Sunset",
      stops: [
        { color: "#FF6B6B", pos: 0 },
        { color: "#FFA500", pos: 50 },
        { color: "#FFD700", pos: 100 },
      ],
      angle: 135,
      type: "linear",
      premium: false,
    },
    {
      name: "Ocean",
      stops: [
        { color: "#667EEA", pos: 0 },
        { color: "#764BA2", pos: 100 },
      ],
      angle: 135,
      type: "linear",
      premium: false,
    },
    {
      name: "Vaporwave",
      stops: [
        { color: "#FC5C7D", pos: 0 },
        { color: "#6A82FB", pos: 100 },
      ],
      angle: 135,
      type: "linear",
      premium: false,
    },
    {
      name: "Twilight",
      stops: [
        { color: "#1F2937", pos: 0 },
        { color: "#7C3AED", pos: 50 },
        { color: "#EC4899", pos: 100 },
      ],
      angle: 90,
      type: "linear",
      premium: false,
    },
    {
      name: "Mint",
      stops: [
        { color: "#00D084", pos: 0 },
        { color: "#00E5CC", pos: 100 },
      ],
      angle: 135,
      type: "linear",
      premium: false,
    },
    {
      name: "Forest",
      stops: [
        { color: "#134E5E", pos: 0 },
        { color: "#71B280", pos: 100 },
      ],
      angle: 135,
      type: "linear",
      premium: false,
    },
    {
      name: "Purple Dream",
      stops: [
        { color: "#667EEA", pos: 0 },
        { color: "#764BA2", pos: 100 },
      ],
      angle: 180,
      type: "linear",
      premium: false,
    },
    {
      name: "Fire",
      stops: [
        { color: "#FF6B6B", pos: 0 },
        { color: "#FFA500", pos: 50 },
        { color: "#FFD700", pos: 100 },
      ],
      angle: 45,
      type: "linear",
      premium: false,
    },
    {
      name: "Midnight",
      stops: [
        { color: "#0F0C29", pos: 0 },
        { color: "#302B63", pos: 50 },
        { color: "#24243e", pos: 100 },
      ],
      angle: 180,
      type: "radial",
      premium: true,
    },
    {
      name: "Ocean Depth",
      stops: [
        { color: "#0F0C29", pos: 0 },
        { color: "#302B63", pos: 50 },
        { color: "#24243e", pos: 100 },
      ],
      angle: 180,
      type: "radial",
      premium: true,
    },
    {
      name: "Stardust",
      stops: [
        { color: "#1A1A2E", pos: 0 },
        { color: "#16213E", pos: 50 },
        { color: "#0F3460", pos: 100 },
      ],
      angle: 45,
      type: "linear",
      premium: true,
    },
  ];

  const applyGradientPreset = (preset) => {
    // TODO: Проверка премиум подписки
    // if (preset.premium && !hasPremium) {
    //   showPremiumModal();
    //   return;
    // }
    
    setGradientType(preset.type);
    setGradientAngle(preset.angle);
    setGradStops(preset.stops);
    setSelectedStopIdx(0);
    updateGradient({
      type: preset.type,
      angle: preset.angle,
      stops: preset.stops,
    });
  };

  // ======== COLOR HISTORY ========
  const [colorHistory, setColorHistory] = useState(() => {
    const saved = localStorage.getItem('dm-color-history');
    return saved ? JSON.parse(saved) : [];
  });

  const addToColorHistory = (hex) => {
    if (!hex || hex === 'transparent') return;
    const newHistory = [hex, ...colorHistory.filter(c => c !== hex)].slice(0, 8);
    setColorHistory(newHistory);
    localStorage.setItem('dm-color-history', JSON.stringify(newHistory));
  };

  const applyColorFromHistory = (hex) => {
    const rgb = hexToRgb(hex);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHex(hex);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    applyFromHsv(hsv.h, hsv.s, hsv.v);
  };

  // ======== GRADIENT STATE ========
  const [gradientType, setGradientType] = useState("linear");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradStops, setGradStops] = useState([
    { color: "#5865f2", pos: 0 },
    { color: "#eb459e", pos: 100 },
  ]);
  const [selectedStopIdx, setSelectedStopIdx] = useState(0);
  const selectedStop = gradStops[selectedStopIdx];
  const [gHue, setGHue] = useState(0);
  const [gSat, setGSat] = useState(0);
  const [gVal, setGVal] = useState(0);
  const [gDragging, setGDragging] = useState(false);
  const [gradFlash, setGradFlash] = useState(false);

  // вычисляем HSV для выбранного стопа
  useEffect(() => {
    if (!selectedStop) return;
    const rgb = hexToRgb(selectedStop.color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setGHue(hsv.h);
    setGSat(hsv.s);
    setGVal(hsv.v);
  }, [selectedStopIdx, selectedStop]);

  const gHueHex = rgbToHex(...Object.values(hsvToRgb(gHue, 1, 1)));
  const gThumbX = gSat * 100;
  const gThumbY = (1 - gVal) * 100;
  const selectedStopHex = selectedStop?.color || "#5865f2";

  useEffect(() => {
    if (!selectedStop) return;
    setGradFlash(true);
    const t = setTimeout(() => setGradFlash(false), 180);
    return () => clearTimeout(t);
  }, [selectedStop?.color]);

  // sync HSV для выбранного стопа градиента
  useEffect(() => {
    if (!selectedStop) return;
    const rgb = hexToRgb(selectedStop.color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setGHue(hsv.h);
    setGSat(hsv.s);
    setGVal(hsv.v);
  }, [selectedStopIdx, selectedStop]);

  const pushToProject = (nextBg, nextAlpha) => {
    onChangeProject({
      ...project,
      backgroundType: nextBg,
      backgroundAlpha: nextAlpha,
    });
  };

  // ======== SOLID COLOR HANDLERS ========

  const applyFromHsv = (h, s, v, keepAlpha = alpha) => {
    const rgb = hsvToRgb(h, s, v);
    const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b);

    setHue(h);
    setSat(s);
    setVal(v);
    setHex(nextHex);
    setAlpha(keepAlpha);

    pushToProject(nextHex, keepAlpha);
    addToColorHistory(nextHex);
  };

  const applyAlpha = (a) => {
    const clamped = clamp(a, 0, 1);
    setAlpha(clamped);
    pushToProject(hex, clamped);
  };

  const applyHex = (value) => {
    const rgb = hexToRgb(value);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHex(value);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    pushToProject(value, alpha);
  };

  const handleSquareChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    const s = x;
    const v = 1 - y;
    applyFromHsv(hue, s, v);
  };

  const handleSquareMouseDown = (e) => {
    setDragging(true);
    handleSquareChange(e);
  };

  const handleSquareMouseMove = (e) => {
    if (!dragging) return;
    handleSquareChange(e);
  };

  const handleSquareMouseUp = () => setDragging(false);
  const handleSquareMouseLeave = () => setDragging(false);

  const handleHueChange = (e) => {
    const h = Number(e.target.value);
    applyFromHsv(h, sat, val);
  };

  const handleHexChange = (e) => {
    const value = e.target.value.trim();
    setHex(value);
    let v = value;
    if (/^[0-9a-fA-F]{6}$/.test(value)) v = "#" + value;
    if (/^#([0-9a-fA-F]{6})$/.test(v)) {
      applyHex(v);
    }
  };

  const handleAlphaChange = (e) => {
    const v = Number(e.target.value) / 100;
    applyAlpha(v);
  };

  const handleReset = () => {
    // Если был выбран белый фон, возвращаем белый цвет
    const base = wasWhiteBackground ? "#ffffff" : "#05070a";
    setHex(base);
    setAlpha(1);
    const rgb = hexToRgb(base);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    pushToProject(base, 1);
  };

  const handlePickEyedropper = async () => {
    try {
      if (window.EyeDropper) {
        const eye = new window.EyeDropper();
        const result = await eye.open();
        const pickedHex = result.sRGBHex; // #rrggbb
        if (/^#([0-9a-fA-F]{6})$/.test(pickedHex)) {
          applyHex(pickedHex);
        }
      }
    } catch (err) {
      // Пользователь отменил выбор
    }
  };

  const hueHex = rgbToHex(...Object.values(hsvToRgb(hue, 1, 1)));
  const thumbX = sat * 100;
  const thumbY = (1 - val) * 100;
  const alphaPercent = Math.round(alpha * 100);

  // ======== GRADIENT HANDLERS ========

  const updateGradient = (patch) => {
    const nextType = patch.type ?? gradientType;
    const nextAngle = patch.angle ?? gradientAngle;
    const nextStops = patch.stops ?? gradStops;

    setGradientType(nextType);
    setGradientAngle(nextAngle);
    setGradStops(nextStops);

    const css = buildGradientCss(nextType, nextAngle, nextStops);
    pushToProject(css, 1);
  };

  const handleGradSquareChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    const s = x;
    const v = 1 - y;
    const rgb = hsvToRgb(gHue, s, v);
    const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    updateGradStop(selectedStopIdx, { color: nextHex });
  };

  const handleGradSquareMouseDown = (e) => {
    setGDragging(true);
    handleGradSquareChange(e);
  };

  const handleGradSquareMouseMove = (e) => {
    if (!gDragging) return;
    handleGradSquareChange(e);
  };

  const handleGradSquareMouseUp = () => setGDragging(false);
  const handleGradSquareMouseLeave = () => setGDragging(false);

  const handleGradHueChange = (e) => {
    const h = Number(e.target.value);
    const rgb = hsvToRgb(h, gSat, gVal);
    const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    updateGradStop(selectedStopIdx, { color: nextHex });
  };

  const handleGradHexChange = (e) => {
    const value = e.target.value.trim();
    let v = value;
    if (/^[0-9a-fA-F]{6}$/.test(value)) v = "#" + value;
    if (/^#([0-9a-fA-F]{6})$/.test(v)) {
      updateGradStop(selectedStopIdx, { color: v });
    }
  };

  const handleGradReset = () => {
    const defaultStops = [
      { color: "#5865f2", pos: 0 },
      { color: "#eb459e", pos: 100 },
    ];
    setGradStops(defaultStops);
    setGradientType("linear");
    setGradientAngle(135);
    setSelectedStopIdx(0);
    updateGradient({
      type: "linear",
      angle: 135,
      stops: defaultStops,
    });
  };

  const handleGradPickEyedropper = async () => {
    try {
      if (window.EyeDropper) {
        const eye = new window.EyeDropper();
        const result = await eye.open();
        const pickedHex = result.sRGBHex;
        if (/^#([0-9a-fA-F]{6})$/.test(pickedHex)) {
          updateGradStop(selectedStopIdx, { color: pickedHex });
        }
      }
    } catch (err) {
      // Пользователь отменил выбор
    }
  };

  const updateGradStop = (idx, patch) => {
    const next = gradStops.map((s, i) =>
      i === idx ? { ...s, ...patch } : s
    );
    setGradStops(next);
    updateGradient({ stops: next });
  };

  const resetGradientBackground = () => {
    const initialBg = initialBgRef.current;
    const initialAlpha = initialBgAlphaRef.current;
    pushToProject(initialBg, initialAlpha);
  };

  const handleLoadBackground = () => {
    setShowLoadMenu(!showLoadMenu);
  };

  const handleLoadFromCatalog = () => {
    setShowLoadMenu(false);
    // TODO: Открыть каталог фонов
  };

  const handleLoadFromFile = () => {
    setShowLoadMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result;
          if (imageUrl) {
            onChangeProject({
              ...project,
              backgroundType: `url(${imageUrl})`,
              backgroundAlpha: 1,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // (ФИЛЬТРЫ УДАЛЕНЫ ПОЛНОСТЬЮ)

  // Закрытие popup при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showInfoPopup &&
        infoPopupRef.current &&
        !infoPopupRef.current.contains(event.target) &&
        infoIconRef.current &&
        !infoIconRef.current.contains(event.target)
      ) {
        setShowInfoPopup(false);
      }
    };

    if (showInfoPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showInfoPopup]);

  const getBgMode = (bgType) => {
    if (bgType === 'transparent') return 'transparent'
    if (bgType === 'white') return 'white'
    if (bgType === '#00ff00' || bgType === 'green') return 'green'
    return 'white'
  }

  const bgMode = getBgMode(project?.backgroundType)

  const bgBtnStyle =
    bgMode === 'white'
      ? {
          background: '#ffffff',
          color: '#0b1512',
          borderColor: 'rgba(255,255,255,0.55)',
        }
      : bgMode === 'green'
      ? {
          background: '#00ff00',
          color: '#001a06',
          borderColor: 'rgba(0,255,0,0.55)',
        }
      : {
          background:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 6px, rgba(255,255,255,0.04) 6px 12px)',
          color: 'rgba(255,255,255,0.92)',
          borderColor: 'rgba(255,255,255,0.24)',
        }

  const toggleBg = () => {
    if (bgMode === 'white') {
      setWasWhiteBackground(false)
      pushToProject('#00ff00', 1)
      return
    }
    if (bgMode === 'green') {
      setWasWhiteBackground(false)
      pushToProject('transparent', 0)
      return
    }
    setWasWhiteBackground(true)
    pushToProject('white', 1)
  }

  return (
    <div className="editor-v2-panel">
      <div className="dm-panel-header-main dm-right-panel-header">
        <div className="dm-panel-header-left">
          <span className="dm-panel-header-dot" />
          <span className="dm-panel-header-title">Авторская</span>
          <div className="dm-panel-header-info-wrapper">
            <button
              ref={infoIconRef}
              type="button"
              className="dm-panel-header-info-icon"
              onClick={() => setShowInfoPopup(!showInfoPopup)}
            >
              ?
            </button>
            {mode === "backgrounds" && (
              <div className="dm-backgrounds-grid-switcher">
                <button
                  type="button"
                  className="dm-editor-canvas-control-bg-btn"
                  onClick={toggleBg}
                  style={bgBtnStyle}
                  aria-label="Фон"
                  title={bgMode === 'white' ? 'Белый' : bgMode === 'green' ? 'Зеленый' : 'Прозрачный'}
                >
                  ФОН
                </button>

                <button
                  type="button"
                  className={`dm-backgrounds-grid-switcher-btn ${gridColumns === 1 ? 'dm-backgrounds-grid-switcher-btn-active' : ''}`}
                  onClick={() => setGridColumns(1)}
                >
                  1x
                </button>
                <button
                  type="button"
                  className={`dm-backgrounds-grid-switcher-btn ${gridColumns === 4 ? 'dm-backgrounds-grid-switcher-btn-active' : ''}`}
                  onClick={() => setGridColumns(4)}
                >
                  4x
                </button>
                <button
                  type="button"
                  className={`dm-backgrounds-grid-switcher-btn ${gridColumns === 6 ? 'dm-backgrounds-grid-switcher-btn-active' : ''}`}
                  onClick={() => setGridColumns(6)}
                >
                  6x
                </button>
              </div>
            )}
          </div>
        </div>
        {showInfoPopup && (
          <div ref={infoPopupRef} className="dm-panel-header-info-popup">
            <h3 className="dm-panel-header-info-popup-title">
              Как создаётся наша галерея
            </h3>
            <p className="dm-panel-header-info-popup-text">
              Над подборкой фонов работает команда Levakand Pictures - мы вручную собираем и оформляем каждую категорию так, чтобы она соответствовала стилю и задачам создателей в D MOTION.
            </p>
            <p className="dm-panel-header-info-popup-text">
              Новые материалы появляются каждый день, чтобы у вас всегда были свежие идеи.
            </p>
          </div>
        )}
        <div className="dm-panel-header-mode-switcher">
          <button
            type="button"
            className={`dm-panel-mode-btn ${mode === "backgrounds" ? "dm-panel-mode-btn-active" : ""}`}
            onClick={() => setMode("backgrounds")}
          >
            ГАЛЕРЕЯ
          </button>
          <button
            type="button"
            className={`dm-panel-mode-btn ${mode === "settings" ? "dm-panel-mode-btn-active" : ""}`}
            onClick={() => setMode("settings")}
          >
            НАСТРОЙКИ
          </button>
        </div>
      </div>

      {/* ======== MODE: BACKGROUNDS ======== */}
      {mode === "backgrounds" && (
        <div className="dm-backgrounds-mode">
          {galleryState === "loading" && (
            <div className="dm-backgrounds-state">
              <div className="dm-backgrounds-state-icon-wrapper">
                <img src={logofiolIcon} alt="" className="dm-backgrounds-state-icon" />
                <div className="dm-backgrounds-loading-spinner" />
              </div>
              <p className="dm-backgrounds-state-text">Секундочку, загружаем библиотеку D MOTION...</p>
            </div>
          )}
          
          {galleryState === "empty" && (
            <div className="dm-backgrounds-state">
              <img src={logofiolIcon} alt="" className="dm-backgrounds-state-icon" />
              <p className="dm-backgrounds-state-text">Пока нет фонов</p>
            </div>
          )}
          
          {galleryState === "error" && (
            <div className="dm-backgrounds-state">
              <img src={logofiolIcon} alt="" className="dm-backgrounds-state-icon" />
              <p className="dm-backgrounds-state-text">Не удалось загрузить. Попробуйте обновить страницу.</p>
            </div>
          )}
          
          {galleryState === "ready" && (
            <>
              {/* МОБИЛЬНАЯ ВЕРСИЯ: Swipeable Gallery (влево/вправо) */}
              {window.innerWidth <= 768 ? (
                <SwipeableGallery
                  items={visibleScenes}
                  onSelectItem={handleAddGalleryImage}
                />
              ) : (
                /* ДЕСКТОП ВЕРСИЯ: Обычная сетка */
                <div className="dm-backgrounds-grid">
                  <div 
                    className="dm-backgrounds-grid-items"
                    style={{
                      gridTemplateColumns: gridColumns === 1 
                        ? '1fr' 
                        : gridColumns === 4 
                        ? 'repeat(4, 1fr)' 
                        : 'repeat(6, 1fr)'
                    }}
                  >
                {visibleScenes.length > 0 ? (
                  visibleScenes.map((scene, index) => {
                    const sceneKey = scene.key || scene.url || index;
                    const isFavorite = favorites.has(sceneKey);
                    return (
                    <button
                      key={sceneKey}
                      type="button"
                      className="dm-backgrounds-grid-item"
                      onClick={(e) => {
                        if (suppressNextClickRef.current) {
                          suppressNextClickRef.current = false;
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        handleAddGalleryImage(scene)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          scene: scene
                        });
                      }}
                      onPointerDown={(e) => {
                        // Важно: не preventDefault, чтобы оставался обычный click.
                        isMouseDownRef.current = true;
                        suppressNextClickRef.current = false;
                        previewShownRef.current = false;
                        didDragRef.current = false;
                        pressStartRef.current = Date.now();
                        pressPointRef.current = { x: e.clientX || 0, y: e.clientY || 0 };

                        // Показываем превью через небольшую задержку (long-press)
                        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
                        previewTimeoutRef.current = setTimeout(() => {
                          if (isMouseDownRef.current) {
                            previewShownRef.current = true;
                            // Вычисляем позицию центра канваса (немного выше)
                            const canvasArea = document.querySelector('.dm-editor-canvas-area');
                            if (canvasArea) {
                              const rect = canvasArea.getBoundingClientRect();
                              const centerX = rect.left + rect.width / 2;
                              const centerY = rect.top + rect.height / 2 - 60; // Смещаем на 60px выше
                              setPreviewPosition({
                                top: `${centerY}px`,
                                left: `${centerX}px`
                              });
                            }
                            setPreviewImage(scene.url);
                          }
                        }, 200);
                      }}
                      onPointerMove={(e) => {
                        if (!isMouseDownRef.current) return;
                        const dx = (e.clientX || 0) - pressPointRef.current.x;
                        const dy = (e.clientY || 0) - pressPointRef.current.y;
                        if ((dx * dx + dy * dy) > (6 * 6)) {
                          // drag/scroll gesture: отменяем превью и запрещаем apply по отпусканию
                          didDragRef.current = true;
                          suppressNextClickRef.current = true;
                          if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
                          setPreviewImage(null);
                        }
                      }}
                      onPointerUp={(e) => {
                        const dt = Date.now() - (pressStartRef.current || 0);
                        isMouseDownRef.current = false;
                        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
                        setPreviewImage(null);

                        // Если был long-press/drag - НЕ применять по отпусканию (и блокируем ближайший click)
                        if (didDragRef.current || previewShownRef.current || dt >= 200) {
                          suppressNextClickRef.current = true;
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }

                        // Короткий тап: применяем ТОЛЬКО здесь, а следующий click гасим
                        handleAddGalleryImage(scene)
                        suppressNextClickRef.current = true;
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onPointerCancel={() => {
                        isMouseDownRef.current = false;
                        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
                        setPreviewImage(null);
                        suppressNextClickRef.current = true;
                      }}
                      onPointerLeave={() => {
                        isMouseDownRef.current = false;
                        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
                        setPreviewImage(null);
                        // Уход мыши во время удержания - тоже не применять
                        suppressNextClickRef.current = true;
                      }}
                    >
                      <img
                        src={scene.url}
                        alt=""
                        className="dm-backgrounds-grid-item-image"
                        loading="lazy"
                        decoding="async"
                        fetchpriority={index < 6 ? "high" : "low"}
                        onError={(e) => {
                          console.error('Image load error:', scene.url);
                          // Retry один раз через 2 секунды
                          setTimeout(() => {
                            e.target.src = scene.url + '?retry=' + Date.now();
                          }, 2000);
                        }}
                        onLoad={(e) => {
                          // Плавное появление изображения
                          e.target.style.opacity = '1';
                        }}
                        style={{
                          opacity: index < 6 ? 1 : 0,
                          transition: 'opacity 0.3s ease-in'
                        }}
                      />
                      {/* Звездочка в избранное */}
                      <div
                        className={`dm-backgrounds-favorite-btn ${isFavorite ? 'dm-backgrounds-favorite-btn-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setFavorites(prev => {
                            const next = new Set(prev);
                            if (isFavorite) {
                              next.delete(sceneKey);
                            } else {
                              next.add(sceneKey);
                            }
                            return next;
                          });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setFavorites(prev => {
                              const next = new Set(prev);
                              if (isFavorite) {
                                next.delete(sceneKey);
                              } else {
                                next.add(sceneKey);
                              }
                              return next;
                            });
                          }
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      
                      {/* Кнопка меню ⋯ */}
                      <div
                        className="dm-backgrounds-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Открываем модал коллекций (теперь там и коллекции и коллабы)
                          setSelectedAssetForCollection(scene);
                          setCollectionModalOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        title="Добавить в коллекцию или коллаб"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                          <circle cx="5" cy="12" r="1"/>
                        </svg>
                      </div>
                    </button>
                    );
                  })
                ) : (
                  <div className="dm-backgrounds-empty-message">
                     <p>В этой категории пока нет фонов</p>
                  </div>
                )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======== PREVIEW MODAL ======== */}
      {previewImage && (
        <div className="dm-backgrounds-preview-modal">
          <div className="dm-backgrounds-preview-backdrop" />
          <div 
            className="dm-backgrounds-preview-content-wrapper"
            style={{
              top: previewPosition.top,
              left: previewPosition.left,
            }}
          >
            <div className="dm-backgrounds-preview-content">
              <img
                src={previewImage}
                alt="Preview"
                className="dm-backgrounds-preview-image"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======== MODE: SETTINGS ======== */}
      {mode === "settings" && (
        <>
          {/* Tabs: Цвет / PREMIUM */}
          <div className="dm-bg-tabs">
            <button
              className={
                "dm-bg-tab" + (activeTab === "color" ? " dm-bg-tab-active" : "")
              }
              onClick={() => setActiveTab("color")}
              type="button"
            >
              Цвет
            </button>
            <button
              className={
                "dm-bg-tab" + (activeTab === "premium" ? " dm-bg-tab-active" : "")
              }
              onClick={() => setActiveTab("premium")}
              type="button"
            >
              PREMIUM
            </button>
          </div>

          {/* ======== COLOR TAB ======== */}
          {activeTab === "color" && (
            <>
              {/* Быстрые пресеты: Прозрачный, Белый, Чёрный */}
              <div className="dm-bg-presets">
                <button
                  type="button"
                  className={
                    "dm-bg-preset-btn" +
                    (project?.backgroundType === "transparent"
                      ? " dm-bg-preset-btn-active"
                      : "")
                  }
                  onClick={() => {
                    setWasWhiteBackground(false);
                    pushToProject("transparent", 0);
                  }}
                >
                  Прозрачный
                </button>
                <button
                  type="button"
                  className={
                    "dm-bg-preset-btn" +
                    (project?.backgroundType === "white"
                      ? " dm-bg-preset-btn-active"
                      : "")
                  }
                  onClick={() => {
                    setWasWhiteBackground(true);
                    pushToProject("white", 1);
                  }}
                >
                  Белый
                </button>
                <button
                  type="button"
                  className={
                    "dm-bg-preset-btn" +
                    (project?.backgroundType === "black"
                      ? " dm-bg-preset-btn-active"
                      : "")
                  }
                  onClick={() => {
                    setWasWhiteBackground(false);
                    pushToProject("black", 1);
                  }}
                >
                  Чёрный
                </button>
              </div>

              {/* Настройка интенсивности сетки для прозрачного фона */}
              {project?.backgroundType === "transparent" && (
                <div className="dm-gradient-row">
                  <label>Интенсивность фоновой сетки</label>
                  <div className="dm-checkerboard-intensity">
                    <button
                      type="button"
                      className={
                        "dm-checkerboard-btn" +
                        ((project?.checkerboardIntensity === "light" || !project?.checkerboardIntensity) 
                          ? " dm-checkerboard-btn-active" 
                          : "")
                      }
                      onClick={() => {
                        onChangeProject({
                          ...project,
                          checkerboardIntensity: "light",
                        });
                      }}
                    >
                      Бледная
                    </button>
                    <button
                      type="button"
                      className={
                        "dm-checkerboard-btn" +
                        (project?.checkerboardIntensity === "medium"
                          ? " dm-checkerboard-btn-active"
                          : "")
                      }
                      onClick={() => {
                        onChangeProject({
                          ...project,
                          checkerboardIntensity: "medium",
                        });
                      }}
                    >
                      Стандарт
                    </button>
                    <button
                      type="button"
                      className={
                        "dm-checkerboard-btn" +
                        (project?.checkerboardIntensity === "strong"
                          ? " dm-checkerboard-btn-active"
                          : "")
                      }
                      onClick={() => {
                        onChangeProject({
                          ...project,
                          checkerboardIntensity: "strong",
                        });
                      }}
                    >
                      Сильная
                    </button>
                  </div>
                </div>
              )}

              {project?.backgroundType !== "transparent" && (
                <>
                  {/* История цветов */}
                  {colorHistory.length > 0 && (
                    <div className="dm-color-history">
                      <label className="dm-field-label">Недавние</label>
                      <div className="dm-color-history-row">
                        {colorHistory.map((hex, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="dm-color-history-swatch"
                            style={{ backgroundColor: hex }}
                            onClick={() => applyColorFromHistory(hex)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={
                      "dm-bg-picker--custom" + (flash ? " dm-bg-picker-flash" : "")
                    }
                  >
                    {/* квадрат H/S/V */}
                    <div
                      className="dm-color-square"
                      style={{ backgroundColor: hueHex }}
                      onMouseDown={handleSquareMouseDown}
                      onMouseMove={handleSquareMouseMove}
                      onMouseUp={handleSquareMouseUp}
                      onMouseLeave={handleSquareMouseLeave}
                    >
                      <div className="dm-color-square-overlay-white" />
                      <div className="dm-color-square-overlay-black" />
                      <div
                        className="dm-color-square-thumb"
                        style={{
                          left: `${thumbX}%`,
                          top: `${thumbY}%`,
                        }}
                      />
                    </div>

                    {/* Hue */}
                    <div className="dm-color-row dm-color-row--hue">
                      <label>HUE</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hue}
                        onChange={handleHueChange}
                        className="dm-color-hue-slider"
                      />
                    </div>

                    {/* Alpha */}
                    <div className="dm-color-row dm-color-row--alpha">
                      <label>ALPHA</label>
                      <div className="dm-color-alpha-wrapper">
                        <div className="dm-color-alpha-track">
                          <div
                            className="dm-color-alpha-fill"
                            style={{
                              background:
                                "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1))",
                            }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={alphaPercent}
                            onChange={handleAlphaChange}
                            className="dm-color-alpha-slider"
                          />
                        </div>
                        <span className="dm-color-alpha-label">{alphaPercent}%</span>
                      </div>
                    </div>

                    {/* HEX */}
                    <div className="dm-color-row">
                      <label>HEX</label>
                      <input
                        type="text"
                        value={hex}
                        onChange={handleHexChange}
                        className="dm-color-input"
                        placeholder="#05070a"
                      />
                    </div>

                    {/* Toolbar: Сброс + Пипетка */}
                    <div className="dm-color-toolbar">
                      <button
                        className="dm-color-tool-btn"
                        type="button"
                        onClick={handleReset}
                      >
                        <span className="dm-color-tool-icon">
                          <svg viewBox="0 0 16 16">
                            <path d="M3 6V2l2 2a5 5 0 1 1-1.2 3.3h1.8A3.3 3.3 0 1 0 8 3.7a3.2 3.2 0 0 0-2.3.9L3 6z" />
                          </svg>
                        </span>
                        <span className="dm-color-tool-label">Сброс</span>
                      </button>

                      <button
                        className="dm-color-tool-btn"
                        type="button"
                        onClick={handlePickEyedropper}
                      >
                        <span className="dm-color-tool-icon">
                          <svg viewBox="0 0 16 16">
                            <path d="M11.2 2.2a1.6 1.6 0 0 1 2.3 2.3l-1.2 1.2-.8-.8.8-.8-.7-.7-.8.8-.8-.8z" />
                            <path d="M10.1 5.1 4.7 10.5 4 12l1.5-.7 5.4-5.4z" />
                            <path d="M3.3 11.9 2 14l2.1-1.3z" className="dm-icon-dropper-tip" />
                          </svg>
                        </span>
                        <span className="dm-color-tool-label">Пипетка</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ======== ГРАДИЕНТЫ (перенесено из вкладки "Градиент") ======== */}
              <div className="dm-bg-section-divider" />
              <div className="dm-bg-section-title">Градиенты</div>

              <div className="dm-bg-picker--gradient">
                {/* Пресеты градиентов */}
                <div className="dm-gradient-presets">
                  {/* Бесплатные пресеты */}
                  <div className="dm-gradient-presets-section">
                    <div className="dm-gradient-header">
                      <label className="dm-field-label">Бесплатные</label>
                      <button
                        type="button"
                        className="dm-gradient-reset-btn"
                        onClick={resetGradientBackground}
                        aria-label="Сброс градиента"
                      >
                        <svg viewBox="0 0 16 16" className="dm-gradient-reset-icon">
                          <path d="M3 6V2l2 2a5 5 0 1 1-1.2 3.3h1.8A3.3 3.3 0 1 0 8 3.7a3.2 3.2 0 0 0-2.3.9L3 6z" />
                        </svg>
                      </button>
                    </div>
                    <div className="dm-gradient-presets-grid">
                      {GRADIENT_PRESETS.filter(p => !p.premium).map((preset, idx) => {
                        const presetCss = buildGradientCss(preset.type, preset.angle, preset.stops);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="dm-gradient-preset-btn"
                            onClick={() => applyGradientPreset(preset)}
                          >
                            <div
                              className="dm-gradient-preset-preview"
                              style={{ background: presetCss }}
                            />
                            <span className="dm-gradient-preset-name">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Премиум пресеты */}
                  <div className="dm-gradient-presets-section dm-gradient-presets-premium">
                    <button
                      type="button"
                      className="dm-gradient-presets-premium-header"
                      onClick={() => setPremiumExpanded(!premiumExpanded)}
                    >
                      <span className="dm-gradient-premium-label">
                        <svg viewBox="0 0 24 24" className="dm-gradient-premium-crown">
                          <path d="M4 17h16l-1-9-4 4-3-5-3 5-4-4-1 9z" />
                          <path d="M4 17h16v2H4z" />
                        </svg>
                        ПРЕМИУМ
                      </span>
                      <span className={`dm-premium-arrow ${premiumExpanded ? 'dm-premium-arrow-expanded' : ''}`}>▼</span>
                    </button>
                    {premiumExpanded && (
                      <div className="dm-gradient-presets-grid">
                        {GRADIENT_PRESETS.filter(p => p.premium).map((preset, idx) => {
                          const presetCss = buildGradientCss(preset.type, preset.angle, preset.stops);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className="dm-gradient-preset-btn dm-gradient-preset-premium"
                              onClick={() => applyGradientPreset(preset)}
                            >
                              <div
                                className="dm-gradient-preset-preview"
                                style={{ background: presetCss }}
                              />
                              <span className="dm-gradient-preset-name">{preset.name}</span>
                              <span className="dm-gradient-preset-badge">в…</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dm-gradient-row">
                  <label>Тип</label>
                  <div className="dm-gradient-type">
                    <button
                      type="button"
                      className={
                        "dm-gradient-type-btn" +
                        (gradientType === "linear" ? " dm-g-active" : "")
                      }
                      onClick={() => updateGradient({ type: "linear" })}
                    >
                      Линейный
                    </button>
                    <button
                      type="button"
                      className={
                        "dm-gradient-type-btn" +
                        (gradientType === "radial" ? " dm-g-active" : "")
                      }
                      onClick={() => updateGradient({ type: "radial" })}
                    >
                      Радиальный
                    </button>
                  </div>
                </div>

                <div className="dm-gradient-row">
                  <div className="dm-gradient-angle-header">
                    <label>Угол</label>
                    <span className="dm-gradient-angle-value">{gradientAngle}В°</span>
                  </div>
                  <div className="dm-gradient-angle-wrapper">
                    <div className="dm-gradient-angle-visual" style={{ transform: `translate(-50%, -50%) rotate(${gradientAngle}deg)` }}>
                      <div className="dm-gradient-angle-line" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) =>
                        updateGradient({ angle: Number(e.target.value) || 0 })
                      }
                      className="dm-gradient-angle"
                    />
                  </div>
                </div>

                {/* Разделитель */}
                <div className="dm-gradient-divider"></div>

                {/* редактор цвета выбранного стопа */}
                {selectedStop && (
                  <div className="dm-gradient-color-editor">
                    <div
                      className={
                        "dm-bg-picker--custom" + (gradFlash ? " dm-bg-picker-flash" : "")
                      }
                    >
                      {/* квадрат H/S/V */}
                      <div
                        className="dm-color-square"
                        style={{ backgroundColor: gHueHex }}
                        onMouseDown={handleGradSquareMouseDown}
                        onMouseMove={handleGradSquareMouseMove}
                        onMouseUp={handleGradSquareMouseUp}
                        onMouseLeave={handleGradSquareMouseLeave}
                      >
                        <div className="dm-color-square-overlay-white" />
                        <div className="dm-color-square-overlay-black" />
                        <div
                          className="dm-color-square-thumb"
                          style={{
                            left: `${gThumbX}%`,
                            top: `${gThumbY}%`,
                          }}
                        />
                      </div>

                      {/* Hue */}
                      <div className="dm-color-row dm-color-row--hue">
                        <label>HUE</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={gHue}
                          onChange={handleGradHueChange}
                          className="dm-color-hue-slider"
                        />
                      </div>

                      {/* HEX */}
                      <div className="dm-color-row">
                        <label>HEX</label>
                        <input
                          type="text"
                          value={selectedStopHex}
                          onChange={handleGradHexChange}
                          className="dm-color-input"
                          placeholder="#5865f2"
                        />
                      </div>

                      {/* Toolbar: Сброс + Пипетка */}
                      <div className="dm-color-toolbar">
                        <button
                          className="dm-color-tool-btn"
                          type="button"
                          onClick={handleGradReset}
                        >
                          <span className="dm-color-tool-icon">
                            <svg viewBox="0 0 16 16">
                              <path d="M3 6V2l2 2a5 5 0 1 1-1.2 3.3h1.8A3.3 3.3 0 1 0 8 3.7a3.2 3.2 0 0 0-2.3.9L3 6z" />
                            </svg>
                          </span>
                          <span className="dm-color-tool-label">Сброс</span>
                        </button>

                        <button
                          className="dm-color-tool-btn"
                          type="button"
                          onClick={handleGradPickEyedropper}
                        >
                          <span className="dm-color-tool-icon">
                            <svg viewBox="0 0 16 16">
                              <path d="M11.2 2.2a1.6 1.6 0 0 1 2.3 2.3l-1.2 1.2-.8-.8.8-.8-.7-.7-.8.8-.8-.8z" />
                              <path d="M10.1 5.1 4.7 10.5 4 12l1.5-.7 5.4-5.4z" />
                              <path d="M3.3 11.9 2 14l2.1-1.3z" className="dm-icon-dropper-tip" />
                            </svg>
                          </span>
                          <span className="dm-color-tool-label">Пипетка</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======== PREMIUM TAB ======== */}
          {activeTab === "premium" && (
            <div className="dm-premium-tab">
              {!canApplyToSelectedLayer && (
                <div style={{ padding: '8px 0', color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  Выберите слой на холсте, чтобы применить PREMIUM
                </div>
              )}

              {premiumView === null && (
                <div className="dm-premium-grid">
                  <button type="button" className="dm-premium-tile" onClick={() => setPremiumView('filters')}>
                    <div className="dm-premium-tile-preview dm-premium-prev-fx">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <path d="M4 7h10M4 17h16M4 12h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="16" cy="7" r="2" fill="currentColor"/>
                          <circle cx="20" cy="17" r="2" fill="currentColor"/>
                          <circle cx="18" cy="12" r="2" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">Премиальные фильтры</div>
                  </button>
                  <button type="button" className="dm-premium-tile" onClick={() => setPremiumView('luts')}>
                    <div className="dm-premium-tile-preview dm-premium-prev-lut">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <path d="M12 3l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M4 7v10l8 4 8-4V7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">Премиальные LUT</div>
                  </button>
                  <button type="button" className="dm-premium-tile" onClick={() => setPremiumView('masks')}>
                    <div className="dm-premium-tile-preview dm-premium-prev-mask">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <circle cx="10" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                          <rect x="12.5" y="7" width="8" height="10" rx="5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">Премиальные маски</div>
                  </button>
                  <button type="button" className="dm-premium-tile" onClick={() => setPremiumView('curves')}>
                    <div className="dm-premium-tile-preview dm-premium-prev-curves">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <path d="M4 18c4-10 6 10 10 0s6 0 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M4 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">Цветовые кривые</div>
                  </button>
                  <button
                    type="button"
                    className="dm-premium-tile"
                    onClick={() => {
                      const cur = selectedLayerData?.effects || {}
                      const nextOn = !cur.aiEnhanceApplied
                      updateSelectedEffects({
                        aiEnhanceApplied: nextOn,
                        noiseReduction: nextOn ? 0.25 : 0,
                        sharpnessBoost: nextOn ? 0.25 : 0,
                        contrastBoost: nextOn ? 0.10 : 0
                      })
                    }}
                  >
                    <div className="dm-premium-tile-preview dm-premium-prev-ai">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <path d="M12 2l1.2 3.8L17 7l-3.8 1.2L12 12l-1.2-3.8L7 7l3.8-1.2L12 2z" fill="currentColor"/>
                          <path d="M19 12l.8 2.4L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.6L19 12z" fill="currentColor" opacity="0.85"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">AI Enhance</div>
                  </button>
                  <button type="button" className="dm-premium-tile" onClick={() => setPremiumView('clarityTexture')}>
                    <div className="dm-premium-tile-preview dm-premium-prev-clarity">
                      <div className="dm-premium-tile-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
                        </svg>
                      </div>
                    </div>
                    <div className="dm-premium-tile-label">Clarity / Texture</div>
                  </button>
                </div>
              )}

              {premiumView === 'filters' && (
                <div>
                  <div className="dm-premium-subheader">
                    <div className="dm-premium-subheader-title">Премиальные фильтры</div>
                    <button type="button" className="dm-premium-back" onClick={() => setPremiumView(null)} aria-label="Назад">
                      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dm-premium-list">
                    {PREMIUM_FILTER_PRESETS.map((p) => (
                      <button key={p.id} type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects(p.values)}>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {premiumView === 'luts' && (
                <div>
                  <div className="dm-premium-subheader">
                    <div className="dm-premium-subheader-title">Премиальные LUT</div>
                    <button type="button" className="dm-premium-back" onClick={() => setPremiumView(null)} aria-label="Назад">
                      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dm-premium-list">
                    {PREMIUM_LUTS.map((l) => (
                      <button key={l.id} type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ lut: l.id })}>
                        <span>{l.name}</span>
                      </button>
                    ))}
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ lut: null })}>
                      <span>Выключить LUT</span>
                    </button>
                  </div>
                </div>
              )}

              {premiumView === 'masks' && (
                <div>
                  <div className="dm-premium-subheader">
                    <div className="dm-premium-subheader-title">Премиальные маски</div>
                    <button type="button" className="dm-premium-back" onClick={() => setPremiumView(null)} aria-label="Назад">
                      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dm-premium-list">
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ maskShape: 'circle' })}>circle</button>
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ maskShape: 'softCircle' })}>softCircle</button>
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ maskShape: 'oval' })}>oval</button>
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ maskShape: null })}>без маски</button>
                  </div>
                </div>
              )}

              {premiumView === 'curves' && (
                <div>
                  <div className="dm-premium-subheader">
                    <div className="dm-premium-subheader-title">Цветовые кривые</div>
                    <button type="button" className="dm-premium-back" onClick={() => setPremiumView(null)} aria-label="Назад">
                      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dm-premium-list">
                    {CURVE_PRESETS.map((c) => (
                      <button key={c.id} type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ curveId: c.id })}>
                        {c.name}
                      </button>
                    ))}
                    <button type="button" className="dm-premium-list-item" onClick={() => updateSelectedEffects({ curveId: null })}>Выключить</button>
                  </div>
                </div>
              )}

              {premiumView === 'clarityTexture' && (
                <div>
                  <div className="dm-premium-subheader">
                    <div className="dm-premium-subheader-title">Clarity / Texture</div>
                    <button type="button" className="dm-premium-back" onClick={() => setPremiumView(null)} aria-label="Назад">
                      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dm-premium-sliders">
                    <label className="dm-field-label">Clarity</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={Number(selectedLayerData?.effects?.clarity || 0)}
                      onChange={(e) => updateSelectedEffects({ clarity: Number(e.target.value) })}
                    />
                    <label className="dm-field-label" style={{ marginTop: 10 }}>Texture</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={Number(selectedLayerData?.effects?.texture || 0)}
                      onChange={(e) => updateSelectedEffects({ texture: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {/* ======== AFTER PRESETS: APPLY TO SELECTED LAYER (panel controls) ======== */}
              {premiumView === null && canApplyToSelectedLayer && (
                <>
                  <div className="dm-bg-section-divider" />
                  <div className="dm-bg-section-title">Для выбранного слоя</div>

                  <div className="dm-premium-actions-row">
                    <button type="button" className="dm-premium-list-item" onClick={handleCopySelectedStyle}>
                      Копировать стиль
                    </button>
                    <button type="button" className="dm-premium-list-item" onClick={handlePasteSelectedStyle}>
                      Вставить стиль
                    </button>
                    <button type="button" className="dm-premium-list-item" onClick={handleResetSelectedAll}>
                      Сбросить всё
                    </button>
                  </div>

                  <div className="dm-premium-sliders" style={{ marginTop: 10 }}>
                    <div className="dm-premium-inline-row">
                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">Vignette</label>
                        <button
                          type="button"
                          className={`dm-toggle-switch ${(selectedLayerData?.effects?.vignette ? 'dm-toggle-switch-active' : '')}`}
                          onClick={() => toggleSelectedEffectFlag('vignette')}
                        >
                          <div className="dm-toggle-switch-thumb" />
                        </button>
                      </div>

                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">Fisheye</label>
                        <button
                          type="button"
                          className={`dm-toggle-switch ${(selectedLayerData?.effects?.fisheye ? 'dm-toggle-switch-active' : '')}`}
                          onClick={() => toggleSelectedEffectFlag('fisheye')}
                        >
                          <div className="dm-toggle-switch-thumb" />
                        </button>
                      </div>

                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">CINEMATIC B/W</label>
                        <button
                          type="button"
                          className={`dm-toggle-switch ${(selectedLayerData?.effects?.cinematicBW ? 'dm-toggle-switch-active' : '')}`}
                          onClick={() => toggleSelectedEffectFlag('cinematicBW')}
                        >
                          <div className="dm-toggle-switch-thumb" />
                        </button>
                      </div>
                    </div>

                    <div className="dm-premium-inline-row">
                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">Маска</label>
                        <select
                          className="dm-settings-select"
                          value={selectedLayerData?.effects?.maskShape || ''}
                          onChange={(e) => updateSelectedEffects({ maskShape: e.target.value || null })}
                        >
                          <option value="">Нет</option>
                          <option value="circle">circle</option>
                          <option value="softCircle">softCircle</option>
                          <option value="oval">oval</option>
                        </select>
                      </div>

                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">LUT</label>
                        <select
                          className="dm-settings-select"
                          value={selectedLayerData?.effects?.lut || ''}
                          onChange={(e) => updateSelectedEffects({ lut: e.target.value || null })}
                        >
                          <option value="">Нет</option>
                          <option value="dmotion_cinematic_1">DMOTION Cinematic 1</option>
                          <option value="islam_persian_1">Persian Gold 1</option>
                          <option value="pamir_nature_1">Pamir Nature 1</option>
                          <option value="books_wisdom_1">Vintage Wisdom 1</option>
                        </select>
                      </div>

                      <div className="dm-premium-mini-field">
                        <label className="dm-field-label">Кривые</label>
                        <select
                          className="dm-settings-select"
                          value={selectedLayerData?.effects?.curveId || ''}
                          onChange={(e) => updateSelectedEffects({ curveId: e.target.value || null })}
                        >
                          <option value="">Нет</option>
                          <option value="soft">Soft</option>
                          <option value="contrast">Contrast</option>
                          <option value="fade">Fade</option>
                        </select>
                      </div>
                    </div>

                    <label className="dm-field-label">Clarity</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={Number(selectedLayerData?.effects?.clarity || 0)}
                      onChange={(e) => updateSelectedEffects({ clarity: Number(e.target.value) })}
                    />

                    <label className="dm-field-label" style={{ marginTop: 10 }}>Texture</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={Number(selectedLayerData?.effects?.texture || 0)}
                      onChange={(e) => updateSelectedEffects({ texture: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
            </div>
          )}

        </>
      )}
      
      {/* Модальное окно коллекций */}
      {collectionModalOpen && selectedAssetForCollection && (
        <CollectionModal
          asset={selectedAssetForCollection}
          assetType="background"
          onClose={() => {
            setCollectionModalOpen(false);
            setSelectedAssetForCollection(null);
          }}
          onSuccess={() => {
            // Можно показать уведомление об успехе
          }}
        />
      )}
      
      {/* Модальное окно коллабов */}
      {collabModalOpen && selectedAssetForCollab && (
        <CollabModal
          asset={selectedAssetForCollab}
          assetType="background"
          onClose={() => {
            setCollabModalOpen(false);
            setSelectedAssetForCollab(null);
          }}
          onSuccess={() => {
            toast?.success?.('Добавлено в коллаб');
          }}
        />
      )}
      
      {/* Контекстное меню */}
      {contextMenu && (
        <div 
          className="dm-context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000
          }}
        >
          <button
            className="dm-context-menu-item"
            onClick={() => {
              console.log('Opening collection modal for:', contextMenu.scene);
              setSelectedAssetForCollection(contextMenu.scene);
              setCollectionModalOpen(true);
              setContextMenu(null);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            В коллекцию
          </button>
          <button
            className="dm-context-menu-item"
            onClick={() => {
              console.log('Opening collab modal for:', contextMenu.scene);
              setSelectedAssetForCollab(contextMenu.scene);
              setCollabModalOpen(true);
              setContextMenu(null);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            В коллаб
          </button>
        </div>
      )}
    </div>
  );
}
