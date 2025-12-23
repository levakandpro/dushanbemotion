import React from "react";
import "../BazarUI.css";
import WorkCard from "../cards/WorkCard";

export default function WorksGrid({ items = [], onView }) {
  return (
    <section className="bz-sec">
      <div className="bz-sec__head">
        <div className="bz-sec__title">ЛЕНТА</div>
        <div className="bz-sec__sub">Публичная лента работ и ассетов</div>
        <div className="bz-sec__spacer" />
        <div className="bz-miniStat">Сегодня добавлено: {items.length}+</div>
      </div>

      <div className="bz-masonry">
        {items.map((it, idx) => {
          // РИТМ: 1 большая на 7 карточек (0, 7, 14, 21...)
          const masonrySize = idx % 7 === 0 ? "big" : "normal";

          return <WorkCard key={it.id || idx} item={it} masonrySize={masonrySize} onView={onView} />;
        })}
      </div>
    </section>
  );
}
