import React, { useState, useMemo, useRef } from 'react';
import { useStickersManifest } from './useStickersManifest';
import { useStickerPreview } from '../../../editorV2/context/StickerPreviewContext';
import { createStickerClip } from '../../../editorV2/timeline/stickers/stickerTimelineState';
import { useAuth } from '../../../lib/useAuth';
import greenIcon from '../../../assets/icons/green.svg';
import Loader from '../../../components/ui/Loader';
import './styles.css';
import { makeShuffleSeed, stableShuffle } from '../../../editorV2/utils/stableShuffle';

// Мужская корона (классическая)
const MaleCrownIcon = ({ className = '', size = 14 }) => (
  <svg className={`dm-crown-icon dm-crown-male ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="crownGoldM" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFA500" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
    </defs>
    <path 
      d="M2 17L4 7L8 12L12 4L16 12L20 7L22 17H2Z" 
      fill="url(#crownGoldM)" 
      stroke="#B8860B" 
      strokeWidth="1"
    />
    <circle cx="4" cy="7" r="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
    <circle cx="12" cy="4" r="2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
    <circle cx="20" cy="7" r="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
    <rect x="2" y="17" width="20" height="3" rx="1" fill="url(#crownGoldM)" stroke="#B8860B" strokeWidth="0.5"/>
    <circle cx="6" cy="18.5" r="0.8" fill="#E74C3C"/>
    <circle cx="12" cy="18.5" r="1" fill="#3498DB"/>
    <circle cx="18" cy="18.5" r="0.8" fill="#2ECC71"/>
  </svg>
);

// Женская корона (тиара с сердечками)
const FemaleCrownIcon = ({ className = '', size = 14 }) => (
  <svg className={`dm-crown-icon dm-crown-female ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="crownGoldF" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB6C1" />
        <stop offset="50%" stopColor="#FF69B4" />
        <stop offset="100%" stopColor="#FFB6C1" />
      </linearGradient>
      <linearGradient id="crownPinkGem" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#FF69B4" />
      </linearGradient>
    </defs>
    <path 
      d="M3 18C3 18 4 10 6 10C7 10 8 13 9 13C10 13 11 6 12 6C13 6 14 13 15 13C16 13 17 10 18 10C20 10 21 18 21 18H3Z" 
      fill="url(#crownGoldF)" 
      stroke="#DB7093" 
      strokeWidth="1"
    />
    <path 
      d="M12 4C12.5 4 13.5 5 13.5 6C13.5 7 12 8.5 12 8.5C12 8.5 10.5 7 10.5 6C10.5 5 11.5 4 12 4Z" 
      fill="url(#crownPinkGem)"
      stroke="#C71585"
      strokeWidth="0.5"
    />
    <circle cx="6" cy="10" r="1.2" fill="#FF69B4" stroke="#DB7093" strokeWidth="0.5"/>
    <circle cx="18" cy="10" r="1.2" fill="#FF69B4" stroke="#DB7093" strokeWidth="0.5"/>
    <rect x="3" y="18" width="18" height="2.5" rx="1" fill="url(#crownGoldF)" stroke="#DB7093" strokeWidth="0.5"/>
    <circle cx="7" cy="19" r="0.6" fill="#FF1493"/>
    <circle cx="12" cy="19" r="0.8" fill="#FF1493"/>
    <circle cx="17" cy="19" r="0.6" fill="#FF1493"/>
  </svg>
);

// Русские названия категорий (ВСЕ переведены)
const CATEGORY_NAMES = {
  // Общие / мужские
  aralash: 'Аралаш',
  collection: 'Аралаш',
  animals: 'Животные',
  avto: 'Авто',
  boznes: 'Бизнес',
  business: 'Бизнес',
  eda: 'Еда',
  food: 'Еда',
  game: 'Игры',
  games: 'Игры',
  history: 'История',
  islam: 'Ислам',
  love: 'Любовь',
  m_name: 'Имена',
  names: 'Имена',
  nature: 'Природа',
  priroda: 'Природа',
  sport: 'Спорт',
  travel: 'Путешествия',
  music: 'Музыка',
  tech: 'Технологии',
  techno: 'Техно',
  patriot: 'Патриот',
  flags: 'Флаги',
  culture: 'Культура',
  art: 'Арт',
  textures: 'Текстуры',
  // Дополнительные
  emocii: 'Эмоции',
  minimalism: 'Минимализм',
  prazdniki: 'Праздники',
  uzori: 'Узоры',
  medic: 'Медицина',
  
  // Женские категории
  free: 'Аралаш',
  chakchak: 'Чак-чак',
  cveti: 'Цветы',
  flowers: 'Цветы',
  decor: 'Декор',
  emocil: 'Эмоции',
  emotions: 'Эмоции',
  imena: 'Имена',
  kariera: 'Карьера',
  career: 'Карьера',
  lux: 'Люкс',
  luxury: 'Люкс',
  makeup: 'Макияж',
  moda: 'Мода',
  fashion: 'Мода',
  nasledie: 'Наследие',
  heritage: 'Наследие',
  patriotka: 'Патриотка',
  peyzaji: 'Пейзажи',
  landscapes: 'Пейзажи',
  tadjichka: 'Таджичка',
  
  // Premium
  pro: 'Premium',
  premium: 'Premium',
  m_pro: 'Premium',
  
  // M_PRO подкатегории (с префиксом)
  m_pro_animals: 'Животные',
  m_pro_avto: 'Авто',
  m_pro_eda: 'Еда',
  m_pro_history: 'История',
  m_pro_love: 'Любовь',
  m_pro_maski: 'Маски',
  m_pro_medic: 'Медицина',
  m_pro_patriot: 'Патриот',
  m_pro_prazdiniki: 'Праздники',
  m_pro_priroda: 'Природа',
  m_pro_smile: 'Смайлы',
  m_pro_soc: 'Соцсети',
  m_pro_sport: 'Спорт',
  // Без префикса для fallback
  maski: 'Маски',
  medicina: 'Медицина',
  prazdiniki: 'Праздники',
  smile: 'Смайлы',
  soc: 'Соцсети',
};

function getCategoryName(slug) {
  return CATEGORY_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default function StickersPanel({ project, onChangeProject, gridColumns: externalGridColumns, onGridColumnsChange }) {
  const { manifest, loading } = useStickersManifest();
  const { profile } = useAuth();
  
  // Проверяем есть ли у пользователя активный PREMIUM
  const userHasPremium = useMemo(() => {
    if (!profile) return false;
    if (profile.is_lifetime) return true;
    if (!profile.current_plan || profile.current_plan === 'free') return false;
    if (!profile.plan_expires_at) return false;
    return new Date(profile.plan_expires_at) > new Date();
  }, [profile]);
  
  // Сохраняем состояние в localStorage
  const [mainTab, setMainTab] = useState(() => {
    return localStorage.getItem('dm_stickers_main_tab') || 'free';
  });
  const [categoryId, setCategoryId] = useState(() => {
    return localStorage.getItem('dm_stickers_category_id') || 'aralash';
  });
  const [shuffleSeed, setShuffleSeed] = useState(() => makeShuffleSeed());
  
  const [internalGridColumns, setInternalGridColumns] = useState(1);
  const gridColumns = externalGridColumns !== undefined ? externalGridColumns : internalGridColumns;
  const setGridColumns = onGridColumnsChange || setInternalGridColumns;
  
  // Scroll-to-top button
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('dm_sticker_favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Сохраняем избранное в localStorage
  React.useEffect(() => {
    localStorage.setItem('dm_sticker_favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Для превью при удержании
  const { previewSticker, setPreviewSticker } = useStickerPreview();
  const holdTimeoutRef = useRef(null);
  const wasPreviewShownRef = useRef(false);

  // Пересоздаём seed при смене вкладки/категории (shuffle)
  React.useEffect(() => {
    setShuffleSeed(makeShuffleSeed());
    // Скролл наверх при смене категории
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [mainTab, categoryId]);

  // Обработчик скролла для кнопки "вверх"
  const handleContainerScroll = React.useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setShowScrollTop(scrollTop > 100);
  }, []);

  // Функция скролла наверх
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // При смене главной вкладки - выбираем дефолтную категорию и сохраняем
  React.useEffect(() => {
    localStorage.setItem('dm_stickers_main_tab', mainTab);
    
    if (mainTab === 'free') {
      setCategoryId('aralash');
    } else if (mainTab === 'm_premium') {
      setCategoryId(null);
    } else if (mainTab === 'women') {
      setCategoryId('aralash'); // Женский аралаш тоже называется aralash
    }
  }, [mainTab]);

  // Сохраняем категорию при изменении
  React.useEffect(() => {
    if (categoryId) {
      localStorage.setItem('dm_stickers_category_id', categoryId);
    }
  }, [categoryId]);

  // Строим категории для текущей вкладки (ДОЛЖНО БЫТЬ ПЕРЕД useEffect которые используют tabCategories)
  const tabCategories = useMemo(() => {
    if (!manifest) return [];
    
    if (mainTab === 'free') {
      // Бесплатные категории из male (кроме premium, m_pro и m_pro_*)
      const maleCategories = manifest.genders?.male?.categories || {};
      const cats = Object.values(maleCategories)
        .filter(c => 
          c.id !== 'premium' && 
          c.id !== 'm_pro' && 
          !c.id?.startsWith('m_pro_') &&
          !c.isPremium
        )
        .sort((a, b) => {
          if (a.id === 'aralash' || a.id === 'collection') return -1;
          if (b.id === 'aralash' || b.id === 'collection') return 1;
          return (a.order || 0) - (b.order || 0);
        });
      return cats;
    }
    
    if (mainTab === 'm_premium') {
      // Premium категории - ищем категории с isPremium или начинающиеся с m_pro_
      const maleCategories = manifest.genders?.male?.categories || {};
      
      const mProCats = Object.values(maleCategories).filter(c => 
        c.id?.startsWith('m_pro_') || 
        c.isPremium === true
      ).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (mProCats.length > 0) {
        return mProCats;
      }
      
      // Fallback - старый premium если нет подкатегорий
      const premiumCat = maleCategories['premium'];
      if (premiumCat) return [premiumCat];
      return [];
    }
    
    if (mainTab === 'women') {
      // Женские категории
      const femaleCategories = manifest.genders?.female?.categories || {};
      const cats = Object.values(femaleCategories)
        .sort((a, b) => {
          // aralash первый
          if (a.id === 'aralash') return -1;
          if (b.id === 'aralash') return 1;
          // premium последний
          if (a.id === 'premium' || a.isPremium) return 1;
          if (b.id === 'premium' || b.isPremium) return -1;
          return (a.order || 0) - (b.order || 0);
        });
      return cats;
    }
    
    return [];
  }, [manifest, mainTab]);

  // Активная категория
  const activeCategory = useMemo(() => {
    if (!tabCategories.length) return null;
    if (categoryId) {
      const found = tabCategories.find(c => c.id === categoryId);
      if (found) return found;
    }
    return tabCategories[0];
  }, [tabCategories, categoryId]);

  // Стикеры для отображения
  const stickers = useMemo(() => {
    if (!activeCategory?.stickers) return [];
    return stableShuffle(activeCategory.stickers, shuffleSeed, (s) => String(s?.key || ''));
  }, [activeCategory, shuffleSeed]);

  // Проверяем, является ли категория premium
  const isPremiumCategory = useMemo(() => {
    if (mainTab === 'm_premium') return true;
    if (mainTab === 'women' && (activeCategory?.id === 'pro' || activeCategory?.id === 'premium' || activeCategory?.isPremium)) return true;
    return false;
  }, [mainTab, activeCategory]);

  // Передаём категории в EditorShell через глобальные функции
  React.useEffect(() => {
    if (tabCategories.length > 0 && window.__setStickerCategories) {
      const railCategories = tabCategories.map(cat => ({
        id: cat.id,
        label: getCategoryName(cat.id),
        isPremium: cat.id === 'pro' || cat.id === 'premium' || cat.isPremium
      }));
      window.__setStickerCategories(railCategories);
    }
    // Передаём информацию о женской вкладке
    if (window.__setStickersFemaleMode) {
      window.__setStickersFemaleMode(mainTab === 'women');
    }
  }, [tabCategories, mainTab]);

  // Передаём активную категорию
  React.useEffect(() => {
    if (activeCategory && window.__setActiveStickerCategory) {
      window.__setActiveStickerCategory(activeCategory.id);
    }
  }, [activeCategory]);

  // Слушаем изменения категории из EditorShell (Rail)
  React.useEffect(() => {
    const handleCategoryChange = (e) => {
      const newCategoryId = e.detail?.categoryId;
      if (newCategoryId) {
        setCategoryId(newCategoryId);
      }
    };
    
    window.addEventListener('stickerCategoryChange', handleCategoryChange);
    return () => window.removeEventListener('stickerCategoryChange', handleCategoryChange);
  }, []);

  // Обработчики для стикеров
  const handleStickerMouseDown = (stickerUrl, fileName) => {
    wasPreviewShownRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      setPreviewSticker({ url: stickerUrl, fileName });
      wasPreviewShownRef.current = true;
    }, 200);
  };

  const handleStickerClick = (stickerUrl, fileName, isPremium) => {
    // Очищаем таймер превью
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    // Если превью было показано - просто скрываем
    if (wasPreviewShownRef.current) {
      setPreviewSticker(null);
      wasPreviewShownRef.current = false;
      return;
    }

    setPreviewSticker(null);

    // Premium gating - если у пользователя нет PREMIUM, переход на страницу тарифов
    if (isPremium && !userHasPremium) {
      // Сохраняем состояние чтобы вернуться
      sessionStorage.setItem('dm_return_to', 'stickers');
      window.location.href = '/pricing';
      return;
    }
    
    if (!project || !onChangeProject) return;
    
    const newSticker = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      type: 'sticker',
      imageUrl: stickerUrl,
      fileName: fileName || 'sticker',
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      rotation: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      zIndex: 100 + (project.stickerLayers?.length || 0),
      animIn: 'none',
      animOut: 'none',
      animLoop: 'none'
    };

    const newClip = createStickerClip(newSticker.id, 0);
    
    onChangeProject({
      ...project,
      stickerLayers: [...(project.stickerLayers || []), newSticker],
      stickerClips: [...(project.stickerClips || []), newClip],
      selectedStickerId: newSticker.id,
      selectedStickerClipId: newClip.id
    });
  };

  const handleStickerMouseLeave = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setPreviewSticker(null);
    wasPreviewShownRef.current = false;
  };

  if (loading) {
    return <Loader fullscreen={false} size="compact" />;
  }

  if (!manifest) {
    return (
      <div className="dm-stickers-error">
        <p>Ошибка загрузки стикеров</p>
      </div>
    );
  }

  return (
    <div className={`dm-stickers-panel ${mainTab === 'women' ? 'dm-stickers-panel-feminine' : ''}`}>
      {/* Три главные вкладки - ФИКСИРОВАННЫЕ */}
      <div className="dm-stickers-main-tabs">
        <button 
          className={`dm-stickers-main-tab ${mainTab === 'free' ? 'active' : ''}`}
          onClick={() => setMainTab('free')}
        >
          БЕСПЛАТНО
        </button>
        <button 
          className={`dm-stickers-main-tab dm-stickers-main-tab-premium dm-stickers-main-tab-male ${mainTab === 'm_premium' ? 'active' : ''}`}
          onClick={() => setMainTab('m_premium')}
        >
          <MaleCrownIcon size={16} /> М
        </button>
        <button 
          className={`dm-stickers-main-tab dm-stickers-main-tab-premium dm-stickers-main-tab-female ${mainTab === 'women' ? 'active' : ''}`}
          onClick={() => setMainTab('women')}
        >
          <FemaleCrownIcon size={16} /> Ж
        </button>
      </div>

      {/* Контейнер для скролла стикеров */}
      <div className="dm-stickers-scroll-container" ref={scrollContainerRef} onScroll={handleContainerScroll}>
        {/* Сетка стикеров */}
        <div 
          className="dm-stickers-grid"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
        >
        {stickers.map((s) => {
          const stickerUrl = `${manifest.baseUrl}/${s.key}`;
          const stickerKey = `${mainTab}_${activeCategory?.id}_${s.key}`;
          const isFavorite = favorites.has(stickerKey);
          
          return (
            <div key={s.key} className="dm-sticker-item-wrapper">
              <div 
                className={`dm-sticker-item ${isPremiumCategory ? 'premium' : ''}`}
                onMouseDown={() => handleStickerMouseDown(stickerUrl, s.fileName)}
                onMouseUp={() => handleStickerClick(stickerUrl, s.fileName, isPremiumCategory)}
                onMouseLeave={handleStickerMouseLeave}
              >
                <img src={stickerUrl} alt="" loading="lazy" />
                {isPremiumCategory && (
                  <div className="dm-sticker-premium-badge">
                    {mainTab === 'women' ? <FemaleCrownIcon size={12} /> : <MaleCrownIcon size={12} />}
                  </div>
                )}
              </div>
              <button
                type="button"
                className={`dm-sticker-favorite-btn ${isFavorite ? 'dm-sticker-favorite-btn-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFavorites(prev => {
                    const next = new Set(prev);
                    if (isFavorite) next.delete(stickerKey);
                    else next.add(stickerKey);
                    return next;
                  });
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            </div>
          );
        })}
        </div>
      </div>

      {/* Кнопка "Вверх" - вне scroll container */}
      {showScrollTop && (
        <button 
          className="dm-stickers-scroll-top-btn"
          onClick={scrollToTop}
          aria-label="Наверх"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      )}
    </div>
  );
}
