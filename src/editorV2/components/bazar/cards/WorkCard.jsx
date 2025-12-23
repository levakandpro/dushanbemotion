import React, { useState } from "react";
import "../BazarUI.css";
import { useHeartAnimation, HeartIcon } from "../../../../components/ui/HeartAnimation";
import "../../../../components/ui/HeartAnimation.css";
import { likeWork } from "../../../../services/workService";
import { useAuth } from "../../../../lib/useAuth";
import { useNavigate } from "react-router-dom";

const WORK_IMAGE =
  "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

const DEFAULT_AVA =
  "https://archive.org/download/dd_20251214/dd.png";

export default function WorkCard({
  item,
  variant = "masonry",
  masonrySize = "normal",
  onView,
}) {
  const it = item || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const sizeClass = masonrySize === "big" ? "bz-work--big" : "bz-work--normal";
  const [isFav, setIsFav] = useState(it.fav || false);
  const [likeLoading, setLikeLoading] = useState(false);
  const { triggerHearts, HeartsContainer } = useHeartAnimation();

  const authorAva =
    typeof it.authorAvatar === "string" && it.authorAvatar.trim() !== ""
      ? it.authorAvatar
      : DEFAULT_AVA;

  const coverImg = it.cover || WORK_IMAGE;

  const handleView = () => {
    if (onView && it.id) {
      onView(it.id);
    }
  };

  const handleFav = async (e) => {
    e.stopPropagation();
    
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    if (likeLoading) return;

    try {
      setLikeLoading(true);
      // Trigger hearts animation - много сердечек!
      triggerHearts(e, isFav ? 6 : 20);
      
      // Call real like service
      if (it.id) {
        const result = await likeWork(it.id, user.id);
        setIsFav(result.isLiked);
      } else {
        // Fallback for items without real ID
        setIsFav(!isFav);
      }
    } catch (err) {
      console.error("Error liking work:", err);
      // Still toggle locally on error
      setIsFav(!isFav);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article
      className={`bz-work ${
        variant === "strip" ? "bz-work--strip" : sizeClass
      }`}
    >
      <HeartsContainer />
      <div className="bz-work__media">
        {it.badge && <div className="bz-badge">{it.badge}</div>}

        <img
          className="bz-work__img"
          src={coverImg}
          alt=""
          draggable={false}
        />

        <div className="bz-work__overlay">
          <div className="bz-work__top">
            <button
              className={`bz-fav ${isFav ? "is-on" : ""}`}
              type="button"
              title="Избранное"
              onClick={handleFav}
            >
              <HeartIcon filled={isFav} size={18} />
            </button>
          </div>

          <div className="bz-work__bottom">
            <div className="bz-work__meta">
              <div className="bz-work__title">{it.title}</div>
              <div className="bz-work__sub">{it.meta}</div>
            </div>

            <button className="bz-mini" type="button" onClick={handleView}>
              Смотреть
            </button>
          </div>
        </div>
      </div>

      <div className="bz-work__footer">
        <div className="bz-authorMini">
          <img className="bz-authorMini__ava" src={authorAva} alt="" />
          <div className="bz-authorMini__name">{it.authorName}</div>
        </div>

        <div className="bz-metrics">
          <span className="bz-star">⭐ {it.stars}</span>
          <span className="bz-mad">ВЫПОЛНЕНО {it.malades}</span>
        </div>

        <div className="bz-socialProof">Выбирают сейчас</div>
      </div>
    </article>
  );
}
