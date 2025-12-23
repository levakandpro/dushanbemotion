import React from "react";
import "../BazarUI.css";
import AuthorCard from "../cards/AuthorCard";

export default function TopAuthorsRow({ authors = [] }) {
  return (
    <section className="bz-sec">
      <div className="bz-sec__head">
        <div className="bz-sec__title">ТОП АВТОРОВ</div>
        <div className="bz-sec__sub">Авторы с максимальным доверием и РЕКОМЕНДУЮТ</div>
        <div className="bz-sec__spacer" />
        <button className="bz-linkBtn" type="button">Все авторы</button>
      </div>

      <div className="bz-row dm-scroll">
        {authors.map((a) => (
          <div key={a.id} className="bz-row__item">
            <AuthorCard author={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
