import React from "react";
import "../BazarUI.css";

export default function ServiceCard({ service, onClick }) {
  const s = service || {};
  
  // Обрезаем описание до 60 символов
  const truncatedDesc = (s.desc || s.subtitle || "").length > 60 
    ? (s.desc || s.subtitle || "").substring(0, 60) + "..." 
    : (s.desc || s.subtitle || "");

  // Первое изображение как обложка
  const coverImage = s.images?.[0] || s.cover;

  return (
    <article className="bz-service" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {coverImage && (
        <div className="bz-service__cover">
          <img src={coverImage} alt="" />
        </div>
      )}
      
      <div className="bz-service__content">
        <div className="bz-service__head">
          <div className="bz-service__title">{s.title}</div>
          <div className="bz-service__price">{s.price} DMC</div>
        </div>

        <div className="bz-service__sub">{truncatedDesc}</div>

        <div className="bz-service__meta">
          {s.deliveryDays && <span>⏱️ {s.deliveryDays} дн.</span>}
          <span>⭐ {s.stars > 0 ? s.stars.toFixed(1) : "-"}</span>
          <span>Заказов {s.orders || 0}</span>
        </div>

        <div className="bz-service__actions">
          <button 
            className="bz-service__more" 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
          >
            Подробнее
          </button>
        </div>
      </div>
    </article>
  );
}
