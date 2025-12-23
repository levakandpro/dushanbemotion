import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getServiceById } from "../../../../services/authorServiceService";
import Loader from "../../../../components/ui/Loader";
import "../BazarUI.css";

export default function ServiceViewModal({ service, onClose }) {
  const navigate = useNavigate();
  const [fullService, setFullService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load full service data
  useEffect(() => {
    const loadService = async () => {
      if (!service?.id) return;
      setLoading(true);
      try {
        const data = await getServiceById(service.id);
        console.log('Loaded service data:', data);
        console.log('Images:', data?.images);
        console.log('Cover URL:', data?.cover_url);
        setFullService(data);
      } catch (err) {
        console.error("Error loading service:", err);
        setFullService(service); // fallback to passed data
      } finally {
        setLoading(false);
      }
    };
    loadService();
  }, [service]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!service) return null;

  const s = fullService || service;
  const images = s.images || [];
  const allImages = s.cover_url ? [s.cover_url, ...images] : images;
  const hasImages = allImages.length > 0;
  const youtubeUrl = s.youtube_url || s.youtubeUrl;

  // Extract YouTube video ID
  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };
  const youtubeId = getYoutubeId(youtubeUrl);

  return createPortal(
    <div className="bz-modal-backdrop" onClick={handleBackdropClick}>
      <div className="bz-modal bz-modal--large" onClick={(e) => e.stopPropagation()}>
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
          <div className="bz-modal__content">
            {/* Media Section */}
            <div className="bz-modal__media">
              {/* Images Gallery - First */}
              {hasImages && (
                <>
                  <div className="bz-modal__cover">
                    <img src={allImages[currentImageIndex]} alt={s.title} />
                  </div>
                  {allImages.length > 1 && (
                    <div className="bz-modal__thumbs">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          className={`bz-modal__thumb ${idx === currentImageIndex ? 'is-active' : ''}`}
                          onClick={() => setCurrentImageIndex(idx)}
                          type="button"
                        >
                          <img src={img} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* YouTube Video - Last */}
              {youtubeId && (
                <div className="bz-modal__video">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="bz-modal__body">
              <h2 className="bz-modal__title">{s.title}</h2>
              
              <div 
                className="bz-modal__author bz-modal__author--clickable"
                onClick={() => {
                  const username = s.author_username || s.profiles?.username;
                  if (username) {
                    onClose();
                    navigate(`/u/${username}`);
                  }
                }}
              >
                <span>Автор: {s.author_name || s.profiles?.display_name || service.authorName || "Автор"}</span>
              </div>

              <p className="bz-modal__desc">{s.description || s.desc}</p>

              <div className="bz-modal__stats">
                <div className="bz-modal__stat">
                  <span className="bz-modal__stat-label">Срок</span>
                  <span className="bz-modal__stat-value">{s.delivery_days || s.deliveryDays} дн.</span>
                </div>
                <div className="bz-modal__stat">
                  <span className="bz-modal__stat-label">Правки</span>
                  <span className="bz-modal__stat-value">{s.revisions === -1 ? '∞' : s.revisions || 2}</span>
                </div>
                <div className="bz-modal__stat">
                  <span className="bz-modal__stat-label">Рейтинг</span>
                  <span className="bz-modal__stat-value">
                    ⭐ {(s.rating || s.stars) > 0 ? (s.rating || s.stars).toFixed(1) : "—"}
                  </span>
                </div>
                <div className="bz-modal__stat">
                  <span className="bz-modal__stat-label">Заказов</span>
                  <span className="bz-modal__stat-value">{s.orders_count || s.orders || 0}</span>
                </div>
              </div>

              <div className="bz-modal__actions">
                <button className="bz-modal__btn bz-modal__btn--primary" type="button" onClick={(e) => e.stopPropagation()}>
                  Заказать услугу
                </button>
                <button className="bz-modal__btn bz-modal__btn--secondary" type="button" onClick={onClose}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
