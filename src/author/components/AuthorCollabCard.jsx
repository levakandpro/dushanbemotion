import React from "react";
import "./author-ui.css";

const FALLBACK_IMG =
  "https://archive.org/download/collabs_20251214_0442/COLLABS.png";
const DEFAULT_AVA =
  "https://archive.org/download/dd_20251214/dd.png";

export default function AuthorCollabCard({ pack }) {
  const p = pack || {};
  const cover = (p.cover && String(p.cover).trim()) ? p.cover : FALLBACK_IMG;
  const authors = Array.isArray(p.coauthors) ? p.coauthors : [];

  return (
    <article className="au-card">
      <div className="au-card__in">
        <div className="au-badge is-accent">Официальный коллаб-пак</div>

        <div style={{ marginTop: 12 }} className="au-collabMedia">
          <img src={cover} alt="" draggable={false} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: ".2px" }}>
            {p.title || "Collab Pack"}
          </div>
          <div style={{ marginTop: 4, color: "rgba(230,237,234,.58)", fontSize: 12, lineHeight: 1.4 }}>
            {p.subtitle || "Совместная коллекция авторов"}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div className="au-avaRow" title="Соавторы">
            {authors.slice(0, 5).map((a, i) => (
              <img
                key={i}
                className="au-ava"
                src={(a && a.avatar) || DEFAULT_AVA}
                alt=""
                draggable={false}
              />
            ))}
            {authors.length > 5 ? (
              <span className="au-badge" style={{ marginLeft: 10 }}>+{authors.length - 5}</span>
            ) : null}
          </div>

          <div className="au-metrics">
            <span>⭐ <b>{p.stars ?? "-"}</b></span>
            <span>РЕКОМЕНДУЮ <b>{p.recommend ?? 0}</b></span>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="au-tool" type="button">Открыть</button>
          <button className="au-tool" type="button">Управлять</button>
          <button className="au-btn" type="button">Добавить ассеты</button>
        </div>
      </div>
    </article>
  );
}
