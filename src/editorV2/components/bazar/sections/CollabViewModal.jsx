import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getCollabMaterials, likeCollab, checkCollabLiked } from "../../../../services/collabService";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../lib/useAuth";
import Loader from "../../../../components/ui/Loader";
import { useHeartAnimation, HeartIcon, EyeIcon } from "../../../../components/ui/HeartAnimation";
import "../../../../components/ui/HeartAnimation.css";
import "../BazarUI.css";

export default function CollabViewModal({ collab, onClose, isPremium: propIsPremium = false }) {
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
  
  // Если контент премиум, но у пользователя есть PREMIUM - разрешаем
  const isPremium = propIsPremium && !userHasPremium;
  const [materials, setMaterials] = useState([]);
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

  // Load materials and stats
  useEffect(() => {
    const loadData = async () => {
      if (!collab?.id) return;
      setLoading(true);
      try {
        const mats = await getCollabMaterials(collab.id);
        // Only approved materials with preview
        const approved = mats.filter(m => m.status === 'approved' && m.preview_url);
        setMaterials(approved);

        // Load stats
        const { data: collabData } = await supabase
          .from('collabs')
          .select('views_count, likes_count')
          .eq('id', collab.id)
          .single();
        
        if (collabData) {
          setStats({
            views: collabData.views_count || 0,
            likes: collabData.likes_count || 0
          });
        }

        // Increment view
        console.log('Incrementing view for collab:', collab.id);
        const { error: viewError, data: viewData } = await supabase.rpc('increment_collab_view', { collab_id: collab.id });
        console.log('View increment result:', { error: viewError, data: viewData });
        if (!viewError) {
          setStats(prev => ({ ...prev, views: prev.views + 1 }));
        } else {
          console.error('Error incrementing view:', viewError);
        }

        // Check if user already liked
        if (user?.id) {
          const isLiked = await checkCollabLiked(collab.id, user.id);
          setLiked(isLiked);
        }
      } catch (err) {
        console.error("Error loading collab data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [collab, user]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, materials.length, currentIndex]);

  const nextImage = useCallback(() => {
    if (materials.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % materials.length);
    }
  }, [materials.length]);

  const prevImage = useCallback(() => {
    if (materials.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + materials.length) % materials.length);
    }
  }, [materials.length]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLike = async (e) => {
    if (!user?.id) {
      // Redirect to login if not authenticated
      onClose();
      navigate('/auth');
      return;
    }

    if (likeLoading) return;

    try {
      setLikeLoading(true);
      
      // Trigger hearts animation (more hearts for better effect!)
      triggerHearts(e, liked ? 6 : 20);
      
      // Call real like service
      const result = await likeCollab(collab.id, user.id);
      setStats(prev => ({ ...prev, likes: result.likes }));
      setLiked(result.isLiked);
    } catch (err) {
      console.error("Error liking:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAuthorClick = (username) => {
    if (username) {
      onClose();
      navigate(`/u/${username}`);
    }
  };

  const handleDownloadArchive = () => {
    if (!isPremium) {
      onClose();
      navigate('/pricing');
      return;
    }
    // TODO: Implement archive download for premium
    alert('Скачивание архива скоро будет доступно');
  };

  if (!collab) return null;

  const currentMaterial = materials[currentIndex];
  const allImages = collab.coverUrl 
    ? [{ preview_url: collab.coverUrl, title: 'Обложка' }, ...materials]
    : materials;
  const displayIndex = collab.coverUrl ? currentIndex + 1 : currentIndex;
  const displayImage = collab.coverUrl && currentIndex === -1 
    ? collab.coverUrl 
    : currentMaterial?.preview_url || collab.coverUrl;

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
                {materials.length > 1 && (
                  <button className="bz-gallery__arrow bz-gallery__arrow--left" onClick={prevImage} type="button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                
                <div className="bz-gallery__image">
                  {displayImage ? (
                    <img src={displayImage} alt={currentMaterial?.title || collab.title} />
                  ) : (
                    <div className="bz-gallery__placeholder">Нет изображений</div>
                  )}
                </div>

                {materials.length > 1 && (
                  <button className="bz-gallery__arrow bz-gallery__arrow--right" onClick={nextImage} type="button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {materials.length > 1 && (
                <div className="bz-gallery__thumbs">
                  {materials.map((mat, idx) => (
                    <button
                      key={mat.id}
                      className={`bz-gallery__thumb ${idx === currentIndex ? 'is-active' : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                      type="button"
                    >
                      <img src={mat.preview_url} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info panel */}
              <div className="bz-gallery__info">
                <h2 className="bz-gallery__title">{collab.title}</h2>
                
                <div className="bz-gallery__authors">
                  <span 
                    className="bz-gallery__author"
                    onClick={() => handleAuthorClick(collab.author1?.username)}
                  >
                    {collab.author1?.display_name || "Автор"}
                  </span>
                  <span className="bz-gallery__x">×</span>
                  <span 
                    className="bz-gallery__author"
                    onClick={() => handleAuthorClick(collab.author2?.username)}
                  >
                    {collab.author2?.display_name || "Автор"}
                  </span>
                </div>

                {collab.description && (
                  <p className="bz-gallery__desc">{collab.description}</p>
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
                    {materials.length} фото
                  </span>
                </div>

                {materials.length > 0 && (
                  <div className="bz-gallery__counter">
                    {currentIndex + 1} / {materials.length}
                  </div>
                )}

                {/* Download Button - Premium only */}
                <button 
                  className="bz-premium-download"
                  onClick={handleDownloadArchive}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {isPremium ? "Скачать архив" : "Скачать (Premium)"}
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
