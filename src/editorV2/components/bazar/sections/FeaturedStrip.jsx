import React from "react";
import "../BazarUI.css";
import WorkCard from "../cards/WorkCard";

export default function FeaturedStrip({ items = [], onView }) {
  return (
    <div className="bz-strip dm-scroll">
      {items.map((it) => (
        <div key={it.id} className="bz-strip__item">
          <WorkCard item={{ ...it, badge: "ВИТРИНА" }} variant="strip" onView={onView} />
        </div>
      ))}
    </div>
  );
}
