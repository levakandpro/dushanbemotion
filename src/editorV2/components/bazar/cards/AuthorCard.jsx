import React from "react";
import "../BazarUI.css";

const DEFAULT_AVA = "https://archive.org/download/dd_20251214/dd.png";

export default function AuthorCard({ author }) {
  const a = author || {};

  // ВСЕГДА ОДИН АВАТАР ДЛЯ ВСЕХ (временно)
  const avaSrc = DEFAULT_AVA;

  return (
    <article className="bz-author">
      <div className="bz-author__top">
        <img className="bz-author__ava" src={avaSrc} alt="" />

        <div className="bz-author__info">
          <div className="bz-author__name">{a.name}</div>
          <div className="bz-author__tag">{a.tagline}</div>
        </div>

        <button className="bz-author__cta" type="button">
          Заказать
        </button>
      </div>

      <div className="bz-author__stats">
        <div className="bz-stat">
          <div className="bz-stat__v">⭐ {a.stars}</div>
          <div className="bz-stat__k">Рейтинг</div>
        </div>

        <div className="bz-stat">
          <div className="bz-stat__v">РЕКОМЕНДУЮТ {a.malades}</div>
          <div className="bz-stat__k">Рекомендации</div>
        </div>

        <div className="bz-stat">
          <div className="bz-stat__v">{a.orders}</div>
          <div className="bz-stat__k">Заказов</div>
        </div>
      </div>

      <div className="bz-author__gallery">
        {(a.preview || []).map((src, i) => (
          <img key={i} className="bz-author__thumb" src={src} alt="" />
        ))}
      </div>

      <div className="bz-author__foot">
        <button className="bz-linkBtn" type="button">
          Профиль
        </button>
        <div className="bz-socials">
          <span className="bz-dot" />
          <span className="bz-dot" />
          <span className="bz-dot" />
        </div>
      </div>
    </article>
  );
}
