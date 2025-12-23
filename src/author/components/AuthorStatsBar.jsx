import React from "react";
import "./author-ui.css";

import crownIcon from "../../editorV2/components/bazar/assets/prof/crown.png";
import starIcon from "../../editorV2/components/bazar/assets/prof/star.png";
import recommendedIcon from "../../editorV2/components/bazar/assets/prof/recomended.png";
import handshakeIcon from "../../editorV2/components/bazar/assets/prof/handshake.png";
import dcoinIcon from "../../editorV2/components/bazar/assets/prof/dcoin.png";

const METRICS = [
  { key: "achievements", icon: crownIcon, label: "Достижения", statKey: null },
  { key: "rating", icon: starIcon, label: "Оценка", statKey: "likesStars" },
  { key: "recommend", icon: recommendedIcon, label: "Рекомендую", statKey: "recommend" },
  { key: "deals", icon: handshakeIcon, label: "Сделок", statKey: "orders" },
  { key: "dcoin", icon: dcoinIcon, label: "D coin", statKey: "balanceDmc" },
];

export default function AuthorStatsBar({ stats, activeMetric, onMetricClick }) {
  const fmt = (n) => Number(n || 0).toLocaleString("ru-RU");

  return (
    <div className="au-card au-card__in au-statsbar">
      <div className="au-statsbar__row">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`au-stat au-stat--clickable ${activeMetric === m.key ? "is-active" : ""}`}
            onClick={() => onMetricClick?.(m.key)}
          >
            <img src={m.icon} alt="" className="au-stat__icon" />
            {m.statKey && <span className="au-stat__value">{fmt(stats[m.statKey])}</span>}
            <span className="au-stat__label">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
