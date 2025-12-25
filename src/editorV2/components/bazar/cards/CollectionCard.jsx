import React, { useState, useEffect } from "react";
import "../CollectionCard.css";

const DEFAULT_COVER = "https://archive.org/download/dcol_20251214/dcol.jpg";
const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

export default function CollectionCard({ collection, covers = [], onView, onAuthorClick, mini = false }) {
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const isEmpty = !collection?.items_count || collection.items_count === 0;
  const displayCovers = isEmpty ? [DEFAULT_COVER] : (covers.length > 0 ? covers.slice(0, 5) : [FALLBACK_IMG]);

  useEffect(() => {
    if (!isHovering || displayCovers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentCoverIndex((prev) => (prev + 1) % displayCovers.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isHovering, displayCovers.length]);

  const handleView = () => {
    if (onView && collection?.id) {
      onView(collection.id);
    }
  };

  return (
    <article 
      className={`bz-work ${mini ? 'bz-work--mini' : 'bz-work--normal'}`}
      onClick={handleView}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="bz-work__media"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setCurrentCoverIndex(0);
        }}
      >
<div className="bz-work__badge">
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
  КОЛЛЕКЦИЯ
</div>


        <img
          className="bz-work__img"
          src={displayCovers[currentCoverIndex]}
          alt=""
          draggable={false}
          style={{
            transition: isHovering ? "opacity 0.3s ease" : "none"
          }}
        />

        <div className="bz-work__overlay">
          <div className="bz-work__top">
            <button
              className="bz-fav"
              type="button"
              title="Избранное"
            >
              ★
            </button>
          </div>

          <div className="bz-work__bottom">
            <div className="bz-work__meta">
              <div className="bz-work__title">{collection?.title || "Коллекция"}</div>
              <div className="bz-work__stats">
                <span className="bz-work__stat">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {collection?.views_count || 0}
                </span>
                <span className="bz-work__stat">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {collection?.likes_count || 0}
                </span>
              </div>
            </div>

            {!mini && (
              <button className="bz-collection-open" type="button" onClick={handleView}>
                Открыть
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bz-work__footer">
        <div 
          className="bz-authorMini bz-authorMini--clickable"
          onClick={(e) => {
            e.stopPropagation();
            if (onAuthorClick && collection?.author_username) {
              onAuthorClick(collection.author_username);
            }
          }}
          style={{ cursor: 'pointer' }}
          title={collection?.author_username ? `Перейти к ${collection.author_name}` : 'Автор'}
        >
          <div className="bz-authorMini__name">
            {collection?.author_name || "Автор"}
          </div>
        </div>

        <div className="bz-metrics">
          <span className="bz-stat" style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {collection?.views_count || 0}
          </span>
          <span className="bz-stat" style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {collection?.likes_count || 0}
          </span>
        </div>
      </div>
    </article>
  );
}
