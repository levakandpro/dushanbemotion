import React from "react";
import "./author-ui.css";
import { incrementWorkView } from "../../services/workService";

const FALLBACK_IMG =
  "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

export default function AuthorWorkCard({ work, size = "normal", onTogglePublish, onView }) {
  const w = work || {};
  const cover = (w.cover && String(w.cover).trim()) ? w.cover : FALLBACK_IMG;
  const isDraft = w.status === "draft";
  const badge = w.badge || "";

  const handleView = async () => {
    if (w.id) {
      try {
        await incrementWorkView(w.id);
        if (onView) {
          onView(w.id);
        }
      } catch (error) {
        console.error("Error incrementing view:", error);
      }
    }
  };

  const handleTogglePublish = () => {
    if (onTogglePublish && w.id) {
      onTogglePublish(w.id, w.status);
    }
  };

  return (
    <article className="au-workCard au-card" data-size={size}>
      <div className="au-workCard__media">
        <img className="au-workCard__img" src={cover} alt="" draggable={false} />
        <div className="au-workCard__scrim" />

        {badge ? (
          <div className={`au-workCard__badge ${badge === "ВИТРИНА" ? "is-accent" : ""}`}>
            {badge}
          </div>
        ) : null}

        <div className="au-workCard__status">
          <span className={`au-chip ${isDraft ? "is-draft" : "is-pub"}`}>
            {isDraft ? "Черновик" : "Опубликовано"}
          </span>
        </div>

        <div className="au-workCard__overlay">
          <div className="au-workCard__topRow">
            <button className="au-iconBtn" type="button" title="В избранное (для себя)">
              ★
            </button>
            <button className="au-iconBtn" type="button" title="Поделиться">
              ⤴
            </button>
          </div>

          <div className="au-workCard__bottom">
            <div className="au-workCard__meta">
              <div className="au-workCard__title">{w.title || "Работа без названия"}</div>
              <div className="au-workCard__sub">{w.meta || "Формат • Категория"}</div>
            </div>

            <button className="au-miniBtn" type="button" onClick={handleView}>
              Смотреть
            </button>
          </div>
        </div>
      </div>

      <div className="au-workCard__foot">
        <div className="au-metrics">
          <span>⭐ <b>{w.stars ?? "-"}</b></span>
          <span>РЕКОМЕНДУЮ <b>{w.recommend ?? 0}</b></span>
          <span>Просмотров <b>{w.views ?? 0}</b></span>
          <span>Обновлено <b>{w.updatedAt || "-"}</b></span>
        </div>

        <div className="au-ownerTools">
          <button className="au-tool" type="button">Редактировать</button>
          <button className="au-tool" type="button" onClick={handleTogglePublish}>
            {isDraft ? "Опубликовать" : "Снять"}
          </button>
        </div>
      </div>
    </article>
  );
}
