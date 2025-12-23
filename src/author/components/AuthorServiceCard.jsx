import React from "react";
import "./author-ui.css";

export default function AuthorServiceCard({ service, onToggleStatus, onDelete }) {
  const s = service || {};
  const isActive = s.status === 'active';

  return (
    <article className={`au-card ${!isActive ? 'au-card--paused' : ''}`}>
      <div className="au-card__in">
        <div className="au-serviceCard__row">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 className="au-serviceCard__title">{s.title || "Услуга"}</h3>
              {!isActive && (
                <span className="au-serviceCard__status au-serviceCard__status--paused">
                  Приостановлена
                </span>
              )}
            </div>
            <p className="au-serviceCard__sub">{s.subtitle || "Короткое описание услуги"}</p>
          </div>
          <div className="au-serviceCard__price">{s.price || 0} DMC</div>
        </div>

        {s.deliveryDays && (
          <div className="au-serviceCard__delivery">
            ⏱️ Срок выполнения: {s.deliveryDays} дн.
          </div>
        )}

        <div className="au-sep" />

        <div className="au-metrics">
          <span>⭐ <b>{s.stars > 0 ? s.stars.toFixed(1) : "-"}</b></span>
          <span>РЕКОМЕНДУЮ <b>{s.recommend ?? 0}</b></span>
          <span>Заказов <b>{s.orders ?? 0}</b></span>
        </div>

        <div className="au-serviceCard__info">
          💳 TJ-кошельки • 20% комиссия
        </div>

        <div className="au-serviceCard__actions">
          <button className="au-tool" type="button">Редактировать</button>
          <button 
            className="au-tool" 
            type="button"
            onClick={onToggleStatus}
          >
            {isActive ? 'Приостановить' : 'Активировать'}
          </button>
          <button 
            className="au-tool au-tool--danger" 
            type="button"
            onClick={onDelete}
          >
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}
