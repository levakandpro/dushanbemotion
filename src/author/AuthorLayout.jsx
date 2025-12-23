import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { getUserProfile } from "../services/userService";
import { getCollabNotificationsCount } from "../services/collabService";
import Loader from "../components/ui/Loader";
import "./AuthorLayout.css";
import mark from "../editorV2/components/bazar/assets/ii.png";

// Звук уведомления для коллабов
const collabNotificationSound = typeof Audio !== 'undefined' 
  ? new Audio('https://archive.org/download/zvuk-chiha-multyashny/zvuk-chiha-multyashny.mp3') 
  : null;

// Soft toast для realtime уведомлений
function SoftToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="au-soft-toast">
      <span className="au-soft-toast__icon">🔔</span>
      <span className="au-soft-toast__text">{message}</span>
    </div>
  );
}


function Dot() {
  return <span className="au-dot" aria-hidden="true" />;
}

function CopyLinkButton({ username }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/u/${username || ''}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button 
      className={`au-brand__copy ${copied ? 'is-copied' : ''}`}
      type="button"
      onClick={handleCopy}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
    </button>
  );
}

function Icon({ type }) {
  switch (type) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3.2 3 10.4v10.4h6.2v-6.1h5.6v6.1H21V10.4L12 3.2zm7.2 16h-2.6v-6.1H7.4v6.1H4.8v-8l7.2-5.8 7.2 5.8v8z"
          />
        </svg>
      );
    case "works":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11zm2.5-.9a.9.9 0 0 0-.9.9v11c0 .5.4.9.9.9h11c.5 0 .9-.4.9-.9v-11a.9.9 0 0 0-.9-.9h-11zM7 15.8l2.3-2.6 2.2 2.4 3.4-4.2 2.1 2.6v1.8H7v-2z"
          />
        </svg>
      );
    case "services":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 4h10a2 2 0 0 1 2 2v2h-2V6H7v12h10v-2h2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm10.4 6.2 1.4-1.4 3.2 3.2-1.4 1.4-3.2-3.2zM10 13.6l6.4-6.4 3.2 3.2-6.4 6.4H10v-3.2z"
          />
        </svg>
      );
    case "collabs":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7.2 12.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm9.6 0a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM7.2 13.8c2.4 0 4.4 1.2 5.3 3.1.1.2.1.5 0 .7-.2.3-.4.4-.7.4H2.7c-.3 0-.5-.1-.7-.4-.1-.2-.1-.5 0-.7.9-1.9 2.9-3.1 5.2-3.1zm9.6 0c2.4 0 4.4 1.2 5.3 3.1.1.2.1.5 0 .7-.2.3-.4.4-.7.4h-6.3c.1-.2.1-.5 0-.7-.6-1.2-1.6-2.2-2.8-2.8.9-.5 2-.7 3.2-.7z"
          />
        </svg>
      );
    case "collections":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"
          />
        </svg>
      );
    case "balance":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
          />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12.2a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm0-6.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zM4.2 20.2c.6-4 4-6.6 7.8-6.6s7.2 2.6 7.8 6.6H18c-.5-3-3-5-6-5s-5.5 2-6 5H4.2z"
          />
        </svg>
      );
  }
}

export default function AuthorLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [collabNotifications, setCollabNotifications] = useState(0);
  const [softToast, setSoftToast] = useState(null);
  const lastToastRef = useRef({ message: '', time: 0 });
  
  // YouTube видео модалка
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeSuccess, setYoutubeSuccess] = useState(false);
  const [youtubeCount, setYoutubeCount] = useState(0);
  const [showTariffs, setShowTariffs] = useState(false);
  const VIDEO_LIMIT = 10;

  const loadCollabNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getCollabNotificationsCount(user.id);
      setCollabNotifications(count);
    } catch (error) {
      console.error("Error loading collab notifications:", error);
    }
  }, [user]);

  // Воспроизвести звук уведомления
  const playNotificationSound = useCallback(() => {
    try {
      if (collabNotificationSound) {
        collabNotificationSound.volume = 0.3;
        collabNotificationSound.currentTime = 0;
        collabNotificationSound.play().catch(() => {});
      }
    } catch (e) {
      console.error('Error playing notification sound:', e);
    }
  }, []);

  // Показать soft toast с дедупликацией и звуком
  const showSoftToast = useCallback((message) => {
    const now = Date.now();
    if (lastToastRef.current.message === message && now - lastToastRef.current.time < 5000) {
      return; // Дедупликация: не показывать одинаковые сообщения в течение 5 сек
    }
    lastToastRef.current = { message, time: now };
    setSoftToast(message);
    playNotificationSound();
    
    // Браузерное push уведомление если вкладка не активна
    if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Коллабы', {
        body: message,
        icon: '/logo192.png',
        tag: 'collab-notification',
        renotify: true
      });
    }
  }, [playNotificationSound]);

  useEffect(() => {
    if (user && !authLoading) {
      loadProfile();
      loadCollabNotifications();
      loadYoutubeCount();
    }
  }, [user, authLoading, loadCollabNotifications]);

  const loadYoutubeCount = async () => {
    if (!user) return;
    const { count } = await supabase.from('youtube_videos').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    setYoutubeCount(count || 0);
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getUserProfile(user.id);
      setProfile(profileData);
      
      // Логика проверки автора теперь в рендере - показываем экран "Вы не автор"
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Обновляем счётчик при переходе на страницу коллабов (после действий)
  useEffect(() => {
    if (location.pathname.startsWith("/author/collabs")) {
      loadCollabNotifications();
    }
  }, [location.pathname, loadCollabNotifications]);

  // Realtime подписка на изменения collabs и collab_materials
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('collab-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collabs' },
        (payload) => {
          const record = payload.new || payload.old;
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          // Реагируем только если изменение касается текущего пользователя
          if (record?.author1_id === user.id || record?.author2_id === user.id) {
            loadCollabNotifications();
            
            // Показываем toast только для событий от партнёра (не от себя)
            if (payload.eventType === 'UPDATE' && newRecord && oldRecord) {
              // Партнёр подтвердил участие
              if (newRecord.status === 'active' && oldRecord.status === 'pending') {
                showSoftToast('Партнёр подтвердил участие в коллабе');
              }
              // Партнёр запросил удаление
              if (newRecord.status === 'delete_requested' && newRecord.delete_requested_by !== user.id) {
                showSoftToast('Партнёр запросил удаление коллаба');
              }
              // Изменение долей подтверждено
              if (oldRecord.pending_author1_share && !newRecord.pending_author1_share && 
                  oldRecord.share_change_requested_by === user.id) {
                showSoftToast('Изменение долей принято');
              }
              // Изменение долей отклонено
              if (oldRecord.share_change_requested_by === user.id && 
                  !newRecord.share_change_requested_by && 
                  oldRecord.author1_share === newRecord.author1_share) {
                showSoftToast('Изменение долей отклонено');
              }
            }
            // Новый коллаб (приглашение)
            if (payload.eventType === 'INSERT' && newRecord?.created_by !== user.id) {
              showSoftToast('Вас пригласили в новый коллаб');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collab_materials' },
        (payload) => {
          const record = payload.new || payload.old;
          const newRecord = payload.new;
          const oldRecord = payload.old;
          
          // Реагируем если материал ожидает подтверждения от текущего пользователя
          // или если пользователь владелец материала
          if (record?.pending_approval_from === user.id || record?.owner_id === user.id) {
            loadCollabNotifications();
            
            // Toast для владельца материала
            if (payload.eventType === 'UPDATE' && newRecord && oldRecord) {
              if (newRecord.owner_id === user.id) {
                if (newRecord.status === 'approved' && oldRecord.status === 'pending') {
                  showSoftToast('Материал подтверждён партнёром');
                }
                if (newRecord.status === 'rejected' && oldRecord.status === 'pending') {
                  showSoftToast('Материал отклонён партнёром');
                }
              }
            }
            // Новый материал на подтверждение
            if (payload.eventType === 'INSERT' && newRecord?.pending_approval_from === user.id) {
              showSoftToast('Новый материал ожидает подтверждения');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadCollabNotifications, showSoftToast]);

  const nav = [
    { path: "/author", label: "Главная", icon: <Icon type="home" /> },
    { path: "/author/works", label: "Мои работы", icon: <Icon type="works" /> },
    { path: "/author/orders", label: "Мои заказы", icon: <Icon type="orders" /> },
    { path: "/author/collections", label: "Коллекции", icon: <Icon type="collections" /> },
    { path: "/author/services", label: "Услуги", icon: <Icon type="services" /> },
    { path: "/author/collabs", label: "Коллабы", icon: <Icon type="collabs" /> },
    { path: "/author/balance", label: "Баланс", icon: <Icon type="balance" /> },
  ];

  const isActive = (path) => {
    if (path === "/author") return location.pathname === "/author";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  // Показываем загрузку, пока проверяем профиль
  if (authLoading || profileLoading) {
    return <Loader />;
  }

  // Если пользователь не автор - редирект на /account
  if (profile && profile.is_author !== true) {
    navigate('/account');
    return null;
  }

  return (
    <div className="au-layout">
      {/* Soft Toast для realtime уведомлений */}
      {softToast && (
        <SoftToast message={softToast} onClose={() => setSoftToast(null)} />
      )}
      
      <aside className="au-side">
        <div className="au-side__top">
          <div className="au-brand">
            <div className="au-brand__mark">
  <img src={mark} alt="" className="au-brand__markImg" draggable={false} />
</div>

            <div className="au-brand__text">
              <div className="au-brand__title">D MOTION</div>
              <div className="au-brand__sub">Панель автора</div>
            </div>

            <CopyLinkButton username={profile?.username} />
          </div>

          <div className="au-side__quick">
            <Link className="au-ghostLink" to="/bazar">
              BAZAR <Dot />
            </Link>
            <Link className="au-ghostLink" to="/editor">
              Редактор <Dot />
            </Link>
          </div>
        </div>

        <nav className="au-nav">
          {nav.map((it) => (
            <Link
              key={it.path}
              to={it.path}
              className={`au-navItem ${isActive(it.path) ? "is-active" : ""}`}
            >
              <span className="au-navItem__icon">{it.icon}</span>
              <span className="au-navItem__label">{it.label}</span>
              {it.path === "/author/collabs" && collabNotifications > 0 && (
                <span className="au-navItem__badge">
                  {collabNotifications > 9 ? "9+" : collabNotifications}
                </span>
              )}
              <span className="au-navItem__chev" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </nav>

        <div className="au-side__bottom">
          <button className="au-navItem" onClick={() => setYoutubeModalOpen(true)}>
            <span className="au-navItem__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </span>
            <span className="au-navItem__label">ЗАГРУЗИТЬ ВИДЕО</span>
          </button>
          <button
            className="au-navItem au-navItem--logout"
            onClick={handleLogout}
          >
            <span className="au-navItem__icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"
                />
              </svg>
            </span>
            <span className="au-navItem__label">Выйти</span>
          </button>
        </div>
      </aside>

      <main className="au-main">
        <div className="au-main__bg" aria-hidden="true" />
        <div className="au-main__inner">{children}</div>
      </main>

      {/* Модальное окно загрузки YouTube видео */}
      {youtubeModalOpen && (
        <div className="au-youtube-modal-overlay" onClick={() => !youtubeLoading && setYoutubeModalOpen(false)}>
          <div className="au-youtube-modal" onClick={(e) => e.stopPropagation()}>
            {youtubeSuccess ? (
              <div className="au-youtube-modal__success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3>ВИДЕО ЗАГРУЖЕНО НА ВАШУ СТРАНИЦУ</h3>
              </div>
            ) : (
              <>
                <div className="au-youtube-modal__header">
                  <h3>Загрузить видео с YouTube</h3>
                  <button className="au-youtube-modal__close" onClick={() => setYoutubeModalOpen(false)}>×</button>
                </div>
                <div className="au-youtube-modal__body">
                  <input
                    type="text"
                    placeholder="Вставьте ссылку на YouTube видео..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="au-youtube-modal__input"
                  />
                  <button 
                    className="au-youtube-modal__btn"
                    disabled={!youtubeUrl.trim() || youtubeLoading}
                    onClick={async () => {
                      if (!youtubeUrl.trim() || !user) return;
                      
                      // Проверяем лимит
                      if (youtubeCount >= VIDEO_LIMIT) {
                        setYoutubeModalOpen(false);
                        setShowTariffs(true);
                        return;
                      }
                      
                      setYoutubeLoading(true);
                      try {
                        await supabase.from('youtube_videos').insert({
                          user_id: user.id,
                          url: youtubeUrl.trim()
                        });
                        setYoutubeCount(prev => prev + 1);
                        setYoutubeSuccess(true);
                        setTimeout(() => {
                          setYoutubeModalOpen(false);
                          setYoutubeUrl('');
                          setYoutubeSuccess(false);
                        }, 2000);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setYoutubeLoading(false);
                      }
                    }}
                  >
                    {youtubeLoading ? 'Подождите…' : 'Загрузить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно тарифов */}
      {showTariffs && (
        <div className="au-youtube-modal-overlay" onClick={() => setShowTariffs(false)}>
          <div className="au-tariffs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-tariffs-modal__header">
              <h3>Лимит видео достигнут</h3>
              <button className="au-youtube-modal__close" onClick={() => setShowTariffs(false)}>×</button>
            </div>
            <div className="au-tariffs-modal__body">
              <div className="au-tariffs-modal__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p>Вы достигли лимита в <strong>{VIDEO_LIMIT} видео</strong></p>
              <p className="au-tariffs-modal__sub">Оформите PREMIUM подписку чтобы загружать до 50 видео</p>
              <div className="au-tariffs-modal__actions">
                <button className="au-tariffs-modal__btn au-tariffs-modal__btn--premium" onClick={() => {
                  setShowTariffs(false);
                  navigate('/pricing');
                }}>
                  Перейти к тарифам
                </button>
                <button className="au-tariffs-modal__btn au-tariffs-modal__btn--back" onClick={() => setShowTariffs(false)}>
                  Назад
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
