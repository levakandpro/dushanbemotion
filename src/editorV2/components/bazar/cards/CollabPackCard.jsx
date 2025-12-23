import React from "react";
import "../BazarUI.css";

export default function CollabPackCard({ pack }) {
  const p = pack || {};
  const authors = Array.isArray(p.coauthors) ? p.coauthors : [];

const coverSrc =
  typeof p.cover === "string" && p.cover.trim() !== ""
    ? p.cover
    : "https://archive.org/download/COLLABS/COLLABS.png";


  return (
    <article className="bz-collab">
      {/* MEDIA */}
<div
  className="bz-collab__media"
  style={{
    backgroundImage: 'url("https://archive.org/download/COLLABS/COLLABS.png")'
  }}
>



        <div className="bz-collab__badge">
          Официальная коллаборация
        </div>
      </div>

      {/* BODY */}
      <div className="bz-collab__body">
        <div className="bz-collab__title">
          {p.title || "Коллаборация"}
        </div>

        <div className="bz-collab__sub">
          Совместный проект • {authors.length} авторов
        </div>

        <div className="bz-collab__authors">
          {authors.slice(0, 5).map((a, i) => (
            <img
              key={i}
              className="bz-collab__ava"
              src={a.avatar}
              alt=""
              loading="lazy"
            />
          ))}

          {authors.length > 5 && (
            <div className="bz-collab__more">
              +{authors.length - 5}
            </div>
          )}
        </div>

        <button className="bz-collab__cta" type="button">
          Смотреть
        </button>
      </div>
    </article>
  );
}
