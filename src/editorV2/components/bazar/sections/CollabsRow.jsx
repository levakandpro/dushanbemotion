import React from "react";
import "../BazarUI.css";
import CollabPackCard from "../cards/CollabPackCard";

export default function CollabsRow({ packs = [] }) {
  return (
    <section className="bz-sec">
      <div className="bz-sec__head">
        <div className="bz-sec__title">КОЛЛАБОРАЦИИ</div>
        <div className="bz-sec__sub">Официальные коллаб-паки и коллекции</div>
        <div className="bz-sec__spacer" />
        <button className="bz-linkBtn" type="button">Все коллабы</button>
      </div>

      <div className="bz-grid bz-grid--2">
        {packs.map((p) => (
          <CollabPackCard key={p.id} pack={p} />
        ))}
      </div>
    </section>
  );
}
