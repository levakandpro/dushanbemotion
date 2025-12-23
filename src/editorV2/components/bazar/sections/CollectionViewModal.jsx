import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../lib/useAuth";
import Loader from "../../../../components/ui/Loader";
import { useHeartAnimation, HeartIcon, EyeIcon } from "../../../../components/ui/HeartAnimation";
import "../../../../components/ui/HeartAnimation.css";
import "../BazarUI.css";

export default function CollectionViewModal({ collection, onClose }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Проверяем есть ли у пользователя активный PREMIUM
  const userHasPremium = React.useMemo(() => {
    if (!profile) return false;
    if (profile.is_lifetime) return true;
    if (!profile.current_plan || profile.current_plan === 'free') return false;
    if (!profile.plan_expires_at) return false;
    return new Date(profile.plan_expires_at) > new Date();
  }, [profile]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ views: 0, likes: 0 });
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const { triggerHearts, HeartsContainer } = useHeartAnimation();

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load collection items and stats
  useEffect(() => {
    const loadData = async () => {
      if (!collection?.id) return;
      setLoading(true);
      try {
        // Load collection items
        const { data: itemsData, error: itemsError } = await supabase
          .from('collection_items')
          .select('asset_id, asset_type')
          .eq('collection_id', collection.id)
          .order('created_at', { ascending: false });

        if (!itemsError && itemsData && itemsData.length > 0) {
          // UUID паттерн
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          // Разделяем на works и backgrounds
          const workItems = itemsData.filter(item => item.asset_type === 'work' && uuidPattern.test(item.asset_id));
          const backgroundItems = itemsData.filter(item => item.asset_type === 'background');
          
          let loadedItems = [];
          
          // Backgrounds - asset_id это URL
          backgroundItems.forEach(item => {
            loadedItems.push({ id: item.asset_id, preview_url: item.asset_id, title: 'Фон' });
          });
          
          // Works - загружаем из БД
          if (workItems.length > 0) {
            const workIds = workItems.map(item => item.asset_id);
            const { data: works } = await supabase
              .from('works')
              .select('id, title, thumbnail_url, media_url')
              .in('id', workIds);
            
            if (works) {
              works.forEach(work => {
                loadedItems.push({
                  id: work.id,
                  preview_url: work.thumbnail_url || work.media_url,
                  title: work.title
                });
              });
            }
          }
          
          setItems(loadedItems);
        }

        // Load stats
        const { data: collectionData } = await supabase
          .from('collections')
          .select('views_count, likes_count')
          .eq('id', collection.id)
          .single();
        
        if (collectionData) {
          setStats({
            views: collectionData.views_count || 0,
            likes: collectionData.likes_count || 0
          });
        }

        // Increment view
        console.log('Incrementing view for collection:', collection.id);
        const { error: viewError } = await supabase.rpc('increment_collection_view', { collection_id: collection.id });
        if (!viewError) {
          setStats(prev => ({ ...prev, views: prev.views + 1 }));
        } else {
          console.error('Error incrementing collection view:', viewError);
        }

        // Check if user already liked
        if (user?.id) {
          const { data: likeData } = await supabase
            .from('collection_likes')
            .select('id')
            .eq('collection_id', collection.id)
            .eq('user_id', user.id)
            .maybeSingle();
          setLiked(!!likeData);
        }
      } catch (err) {
        console.error("Error loading collection data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [collection, user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, items.length, currentIndex]);

  const nextImage = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  }, [items.length]);

  const prevImage = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }
  }, [items.length]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLike = async (e) => {
    if (!user?.id) {
      onClose();
      navigate('/auth');
      return;
    }

    if (likeLoading) return;

    try {
      setLikeLoading(true);
      triggerHearts(e, liked ? 6 : 20);

      if (liked) {
        // Unlike
        await supabase
          .from('collection_likes')
          .delete()
          .eq('collection_id', collection.id)
          .eq('user_id', user.id);
        setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
        setLiked(false);
      } else {
        // Like
        await supabase
          .from('collection_likes')
          .insert({ collection_id: collection.id, user_id: user.id });
        setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
        setLiked(true);
      }
    } catch (err) {
      console.error("Error liking collection:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAuthorClick = () => {
    if (collection?.author_username) {
      onClose();
      navigate(`/u/${collection.author_username}`);
    }
  };

  if (!collection) return null;

  const currentItem = items[currentIndex];
  const displayImage = currentItem?.preview_url || currentItem?.thumbnail_url || collection.cover_url;

  return createPortal(
    <>
      <div className="bz-modal-backdrop" onClick={handleBackdropClick}>
        <div className="bz-modal bz-modal--gallery" onClick={(e) => e.stopPropagation()}>
          <button className="bz-modal__close" onClick={onClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {loading ? (
            <div className="bz-modal__loading">
              <Loader fullscreen={false} size="compact" showText={false} />
            </div>
          ) : (
            <div className="bz-gallery">
              {/* Main image */}
              <div className="bz-gallery__main">
                {items.length > 1 && (
                  <button className="bz-gallery__arrow bz-gallery__arrow--left" onClick={prevImage} type="button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                
                <div className="bz-gallery__image">
                  {displayImage ? (
                    <img src={displayImage} alt={currentItem?.title || collection.title} />
                  ) : (
                    <div className="bz-gallery__placeholder">Нет изображений</div>
                  )}
                </div>

                {items.length > 1 && (
                  <button className="bz-gallery__arrow bz-gallery__arrow--right" onClick={nextImage} type="button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {items.length > 1 && (
                <div className="bz-gallery__thumbs">
                  {items.slice(0, 10).map((item, idx) => (
                    <button
                      key={item.id}
                      className={`bz-gallery__thumb ${idx === currentIndex ? 'is-active' : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                      type="button"
                    >
                      <img src={item.preview_url || item.thumbnail_url} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info panel */}
              <div className="bz-gallery__info">
                <div className="bz-gallery__badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  КОЛЛЕКЦИЯ
                </div>
                <h2 className="bz-gallery__title">{collection.title}</h2>
                
                <div 
                  className="bz-gallery__author bz-gallery__author--clickable"
                  onClick={handleAuthorClick}
                >
                  {collection.author_name || "Автор"}
                </div>

                {collection.description && (
                  <p className="bz-gallery__desc">{collection.description}</p>
                )}

                <div className="bz-gallery__stats">
                  <span className="bz-gallery__stat">
                    <EyeIcon size={16} /> {stats.views}
                  </span>
                  <button 
                    className={`bz-gallery__stat bz-gallery__stat--btn ${liked ? 'is-liked' : ''}`}
                    onClick={handleLike}
                    type="button"
                  >
                    <HeartIcon filled={liked} size={16} /> {stats.likes}
                  </button>
                  <span className="bz-gallery__stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    {items.length} работ
                  </span>
                </div>

                {items.length > 0 && (
                  <div className="bz-gallery__counter">
                    {currentIndex + 1} / {items.length}
                  </div>
                )}

                {/* Download Button - Premium only */}
                <button 
                  className="bz-premium-download"
                  onClick={() => {
                    if (!userHasPremium) {
                      onClose();
                      navigate('/pricing');
                    } else {
                      // TODO: Implement download for premium users
                      alert('Скачивание доступно для Premium пользователей');
                    }
                  }}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {userHasPremium ? 'Скачать' : 'Скачать (Premium)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <HeartsContainer />
    </>,
    document.body
  );
}
