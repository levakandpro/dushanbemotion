import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./BazarUI.css";
import logo from "./assets/logo.svg";
import { useAuth } from "../../../lib/useAuth";
import { getUserProfile, getTopAuthorsBySubscribers } from "../../../services/userService";
import { PromoModal, usePromoModal } from "../../../components/PromoModal";
import MobileBackButton from "../MobileBackButton";

import { getBazarWorks, incrementWorkView } from "../../../services/workService";
import { getPublicCollections, getCollectionCovers } from "../../../services/collectionService";
import { getActiveServices } from "../../../services/authorServiceService";
import { getPublicCollabs } from "../../../services/collabService";

import FeaturedStrip from "./sections/FeaturedStrip";
import ServicesSection from "./sections/ServicesSection";
import CollectionsRow from "./sections/CollectionsRow";
import CollectionViewModal from "./sections/CollectionViewModal";
import CollabsSection from "./sections/CollabsSection";
import AuthorsOfMonthSection from "./sections/AuthorsOfMonthSection";
import WorksGrid from "./sections/WorksGrid";
import Footer from "./Footer";

import { FeedSkeleton } from "../../../components/ui/Skeleton";
import { ThemeSwitcher } from "../../../components/ui/ThemeSwitcher";
import { ScrollReveal } from "../../../components/ui/ScrollAnimation";
import "../../../components/ui/Skeleton.css";
import "../../../components/ui/ThemeSwitcher.css";
import "../../../components/ui/ScrollAnimation.css";

const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

export default function BazarPageShell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bazarWorks, setBazarWorks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [services, setServices] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showAuthorsInfo, setShowAuthorsInfo] = useState(false);
  const [sortMode, setSortMode] = useState('best'); // 'best' or 'new'
  const [showSortInfo, setShowSortInfo] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const pageRef = useRef(null);
  const lastScrollY = useRef(0);
  
  // Промо-окно акции
  const { isOpen: isPromoOpen, showPromo, closePromo, showOnMount } = usePromoModal();
  
  // Показ промо при входе в BAZAR
  useEffect(() => {
    showOnMount();
  }, [showOnMount]);

  // Запускаем автоматический heartbeat для онлайн присутствия
  useEffect(() => {
    let cleanup = null;
    
    const startHeartbeat = async () => {
      try {
        const { startPresenceHeartbeat, stopPresenceHeartbeat } = await import('../../../services/statsService');
        const { supabase } = await import('../../../lib/supabaseClient');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser?.id) {
          startPresenceHeartbeat(authUser.id);
          cleanup = stopPresenceHeartbeat;
        }
      } catch (e) {
        console.warn('[BazarPageShell] Ошибка запуска heartbeat:', e);
      }
    };
    
    startHeartbeat();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Check if user is author
  useEffect(() => {
    const checkAuthor = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setIsAuthor(profile?.is_author || false);
        } catch (err) {
          setIsAuthor(false);
        }
      } else {
        setIsAuthor(false);
      }
    };
    checkAuthor();
  }, [user]);

  useEffect(() => {
    const loadBazarData = async () => {
      try {
        setLoading(true);

        const [works, publicCollections, activeServices, publicCollabs, authorsOfMonth] = await Promise.all([
          getBazarWorks(100),
          getPublicCollections(50),
          getActiveServices().catch(() => []),
          getPublicCollabs(20).catch(() => []),
          getTopAuthorsBySubscribers(10).catch(() => []),
        ]);

        const formattedWorks = works.map((work) => ({
          id: work.id,
          title: work.title || "Работа без названия",
          meta: work.category || work.description || "Формат • Категория",
          cover: work.thumbnail_url || work.media_url || FALLBACK_IMG,
          authorName: work.author_name || work.author_username || "Автор",
          authorAvatar: work.author_avatar || null,
          stars: work.stars || 0,
          malades: work.recommends || 0,
          badge: "",
          fav: false,
        }));

        const coversCache = {};
        const collectionsWithCovers = await Promise.all(
          publicCollections.map(async (col) => {
            try {
              if (!coversCache[col.id]) {
                coversCache[col.id] = await getCollectionCovers(col.id, 5);
              }
              return {
                ...col,
                covers: coversCache[col.id] || [],
                views_count: col.views_count || 0,
                likes_count: col.likes_count || 0,
              };
            } catch (err) {
              console.error('Error loading covers for collection:', col.id, err);
              return {
                ...col,
                covers: [],
                views_count: col.views_count || 0,
                likes_count: col.likes_count || 0,
              };
            }
          })
        );

        const formattedServices = activeServices.map((s) => {
          // Check if created within last 24 hours
          const createdAt = new Date(s.created_at);
          const now = new Date();
          const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
          const isNew = hoursDiff <= 24;

          return {
            id: s.id,
            title: s.title,
            desc:
              s.description.slice(0, 80) + (s.description.length > 80 ? "..." : ""),
            price: s.price,
            deliveryDays: s.delivery_days,
            coverUrl: s.cover_url || s.images?.[0] || null,
            authorName: s.author_name || "Автор",
            stars: s.rating || 0,
            orders: s.orders_count || 0,
            isNew: isNew,
          };
        });

        // Format collabs
        const formattedCollabs = publicCollabs.map((c) => {
          const createdAt = new Date(c.created_at);
          const now = new Date();
          const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
          const isNew = hoursDiff <= 72; // 3 дня для тестирования, потом вернуть 24

          return {
            id: c.id,
            title: c.title,
            description: c.description,
            author1: c.author1,
            author2: c.author2,
            coverUrl: c.cover_url || null,
            createdAt: c.created_at,
            isNew: isNew,
          };
        });

        setBazarWorks(formattedWorks);
        setCollections(collectionsWithCovers);
        setServices(formattedServices);
        setCollabs(formattedCollabs);
        setTopAuthors(authorsOfMonth);
      } catch (error) {
        console.error("Error loading bazar data:", error);
        setBazarWorks([]);
        setCollections([]);
        setServices([]);
        setCollabs([]);
        setTopAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    loadBazarData();
  }, []);

  // Scroll handler - show scroll-to-top button
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const scrollY = container.scrollTop;
      setShowScrollTop(scrollY > 200);
      lastScrollY.current = scrollY;
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFooter = (e) => {
    e.stopPropagation();
    setShowFooter(prev => !prev);
  };

  // Close footer on click outside
  useEffect(() => {
    if (!showFooter) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest(".bz-footer-wrapper") && !e.target.closest(".bz-helpBtn")) {
        setShowFooter(false);
      }
    };
    
    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showFooter]);

  const scrollToTop = () => {
    if (pageRef.current) {
      pageRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleViewWork = async (workId) => {
    try {
      await incrementWorkView(workId);
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  };

  const handleViewCollection = (collectionId) => {
    console.log('handleViewCollection called with:', collectionId);
    console.log('Available collections:', collections);
    const collection = collections.find(c => c.id === collectionId);
    console.log('Found collection:', collection);
    if (collection) {
      setSelectedCollection(collection);
    }
  };

  // Сортировка данных
  const getSortedData = () => {
    if (sortMode === 'new') {
      // НОВЫЕ - сортировка по дате создания (новые первые)
      const sortByDate = (a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
      
      return {
        works: [...bazarWorks].sort(sortByDate).slice(0, 8),
        collections: [...collections].sort(sortByDate),
        services: [...services].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
        collabs: [...collabs].sort(sortByDate),
        authors: topAuthors.slice(0, 8),
      };
    } else {
      // ЛУЧШИЕ - сортировка по метрикам
      return {
        works: [...bazarWorks].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8),
        collections: [...collections].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)),
        services: [...services].sort((a, b) => (b.stars || 0) - (a.stars || 0)),
        collabs: [...collabs].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)),
        authors: topAuthors.slice(0, 8),
      };
    }
  };

  const filteredData = getSortedData();

  const handleBrandClick = () => {
    navigate("/editor");
  };

  return (
    <div className="bz-page" ref={pageRef}>
      {/* ================= TOP BAR ================= */}
      <div className="bz-topbar">
        <div className="bz-topbar__left">
          {/* Кнопка назад для мобильных */}
          <MobileBackButton className="bz-back-btn" />
          
          {/* BRAND */}
          <div className="bz-topbar__brand">
            <div
              className="bz-brand"
              onClick={handleBrandClick}
              style={{ cursor: "pointer" }}
            >
              <img src={logo} alt="D MOTION" className="bz-brand__logo" />
              <span className="bz-brand__title">BAZAR</span>
              <span className="bz-brand__desc">
                Лента дизайнеров и медиа-креаторов Таджикистана
              </span>

              <button
                className="bz-brand__fav"
                type="button"
                aria-label="О BAZAR"
                onClick={toggleFooter}
              >
                <span className="bz-brand__favIcon">★</span>
              </button>
            </div>
          </div>

          {/* SORT */}
          <div className="bz-sort">
            <button 
              className={`bz-sortBtn ${sortMode === 'best' ? 'is-active' : ''}`} 
              type="button"
              onClick={() => setSortMode('best')}
            >
              ЛУЧШИЕ
            </button>
            <button 
              className={`bz-sortBtn ${sortMode === 'new' ? 'is-active' : ''}`} 
              type="button"
              onClick={() => setSortMode('new')}
            >
              НОВЫЕ
            </button>
          </div>

          {/* HELP - opens sort info */}
          <button 
            className="bz-iconBtn bz-helpBtn" 
            type="button" 
            aria-label="Как работает сортировка"
            onClick={() => setShowSortInfo(true)}
          >
            ?
          </button>
        </div>

        {/* RIGHT ICONS */}
        <div className="bz-topbar__right">
          {/* Редактор - всегда виден */}
          <button 
            className="bz-navIcon" 
            type="button" 
            aria-label="Редактор"
            onClick={() => navigate("/editor")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M14 9l3 3-3 3" />
            </svg>
          </button>

          {/* Кабинет - только для залогиненных */}
          {user && (
            <button 
              className="bz-navIcon" 
              type="button" 
              aria-label={isAuthor ? "Кабинет автора" : "Личный кабинет"}
              onClick={() => navigate(isAuthor ? "/author" : "/account")}
            >
              {isAuthor ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  <path d="M16 4l2 2-2 2" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </button>
          )}

          {/* Переключатель темы */}
          <ThemeSwitcher variant="cycle" />
        </div>
      </div>
      {/* ================= /TOP BAR ================= */}

      {/* ================= CONTENT ================= */}
      <div className="bz-wrap">
        <div className="bz-content-section">
          {/* ================= 1. ВИТРИНА ================= */}
          <ScrollReveal animation="fadeUp">
            <section className="bz-sec">
              <div className="bz-sec__head">
                <h2 className="bz-sec__title">ВИТРИНА</h2>
                <span className="bz-sec__sub">{sortMode === 'new' ? 'Новые работы' : 'Лучшие работы платформы'}</span>
              </div>
              {loading ? (
                <FeedSkeleton count={4} type="work" />
              ) : (
                <FeaturedStrip items={filteredData.works} onView={handleViewWork} />
              )}
            </section>
          </ScrollReveal>

          {/* ================= КОЛЛЕКЦИИ ================= */}
          {filteredData.collections.length > 0 && (
            <ScrollReveal animation="fadeUp" delay={100}>
              <CollectionsRow
                collections={filteredData.collections}
                onView={handleViewCollection}
                onAuthorClick={(username) => navigate(`/u/${username}`)}
              />
            </ScrollReveal>
          )}

          {/* ================= 3. УСЛУГИ ================= */}
          {filteredData.services.length > 0 && (
            <ScrollReveal animation="fadeUp" delay={150}>
              <section className="bz-sec">
                <div className="bz-sec__head">
                  <h2 className="bz-sec__title">УСЛУГИ</h2>
                  <span className="bz-sec__sub">Закажите работу напрямую у автора</span>
                </div>
                <ServicesSection services={filteredData.services} />
              </section>
            </ScrollReveal>
          )}

          {/* ================= 4. КОЛЛАБЫ ================= */}
          {filteredData.collabs.length > 0 && (
            <ScrollReveal animation="fadeUp" delay={200}>
              <section className="bz-sec">
                <div className="bz-sec__head">
                  <h2 className="bz-sec__title">КОЛЛАБЫ</h2>
                  <span className="bz-sec__sub">Работы, созданные в сотрудничестве</span>
                </div>
                <CollabsSection collabs={filteredData.collabs} />
              </section>
            </ScrollReveal>
          )}

          {/* ================= 5. АВТОРЫ МЕСЯЦА ================= */}
          <ScrollReveal animation="fadeUp" delay={250}>
            <section className="bz-sec">
              <div className="bz-sec__head">
                <h2 className="bz-sec__title">АВТОРЫ МЕСЯЦА</h2>
                <span className="bz-sec__sub">Лучшие по итогам месяца</span>
                <button 
                  className="bz-info-btn" 
                  onClick={() => setShowAuthorsInfo(true)}
                  title="Как это работает?"
                >
                  ?
                </button>
              </div>
              {filteredData.authors.length > 0 ? (
                <AuthorsOfMonthSection authors={filteredData.authors} />
              ) : (
                <div className="bz-sec__placeholder">Скоро здесь появятся топ-авторы</div>
              )}
            </section>
          </ScrollReveal>

          {/* Модалка информации об Авторах месяца */}
          {showAuthorsInfo && (
            <div className="bz-modal-backdrop" onClick={() => setShowAuthorsInfo(false)}>
              <div className="bz-modal bz-modal--info" onClick={(e) => e.stopPropagation()}>
                <button className="bz-modal__close" onClick={() => setShowAuthorsInfo(false)} type="button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <div className="bz-modal__body">
                  <h2 className="bz-modal__title">🏆 Как работает "Авторы месяца"?</h2>
                  <div className="bz-info-content">
                    <p><strong>Рейтинг авторов</strong> формируется автоматически на основе количества подписчиков.</p>
                    <ul>
                      <li>🥇 <strong>1 место</strong> — автор с наибольшим числом подписчиков</li>
                      <li>🥈 <strong>2 место</strong> — второй по количеству подписчиков</li>
                      <li>🥉 <strong>3 место</strong> — третий по количеству подписчиков</li>
                      <li>И так далее...</li>
                    </ul>
                    <p>Рейтинг обновляется в реальном времени. Чем больше у вас подписчиков - тем выше ваше место!</p>
                    <p className="bz-info-tip">💡 <strong>Совет:</strong> Публикуйте качественные работы и коллабы, чтобы привлечь больше подписчиков.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ================= /CONTENT ================= */}

      {/* ================= SCROLL TO TOP ================= */}
      <button
        className={`bz-scrollTop ${showScrollTop ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Наверх"
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* ================= FOOTER (hidden, pull-up to show) ================= */}
      <div className={`bz-footer-wrapper ${showFooter ? "is-visible" : ""}`}>
        <Footer />
      </div>

      {/* ================= SORT INFO MODAL ================= */}
      {showSortInfo && (
        <div className="bz-modal-backdrop" onClick={() => setShowSortInfo(false)}>
          <div className="bz-modal bz-modal--info" onClick={(e) => e.stopPropagation()}>
            <button className="bz-modal__close" onClick={() => setShowSortInfo(false)} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="bz-modal__body">
              <h2 className="bz-modal__title">📊 Как работает сортировка?</h2>
              <div className="bz-info-content">
                <p><strong>ЛУЧШИЕ</strong> - показывает контент отсортированный по популярности:</p>
                <ul>
                  <li>📸 <strong>Работы</strong> - по количеству просмотров</li>
                  <li>📁 <strong>Коллекции</strong> - по количеству просмотров</li>
                  <li>🛠 <strong>Услуги</strong> - по рейтингу и рекомендациям</li>
                  <li>🤝 <strong>Коллабы</strong> - по количеству просмотров</li>
                  <li>👤 <strong>Авторы</strong> - топ 8 по подписчикам</li>
                </ul>
                <p><strong>НОВЫЕ</strong> - показывает только контент, добавленный за последние 24 часа.</p>
                <p className="bz-info-tip">💡 Переключайтесь между режимами, чтобы найти интересный контент!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection View Modal */}
      {selectedCollection && (
        <CollectionViewModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
        />
      )}
      
      {/* Промо-окно акции PREMIUM */}
      <PromoModal isOpen={isPromoOpen} onClose={closePromo} />
    </div>
  );
}
