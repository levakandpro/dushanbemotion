import React from "react";
import "./author-ui.css";
import AuthorWorkCard from "./AuthorWorkCard";

export default function AuthorWorksGrid({ items, onTogglePublish, onView }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="au-masonry">
      {list.map((w, idx) => {
        const big = idx % 7 === 0;
        const col = big ? "au-col-6" : "au-col-4";
        return (
          <div key={w.id || idx} className={col}>
            <AuthorWorkCard 
              work={w} 
              size={big ? "big" : "normal"} 
              onTogglePublish={onTogglePublish}
              onView={onView}
            />
          </div>
        );
      })}
    </div>
  );
}
