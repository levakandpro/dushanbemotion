import React from "react";
import "./author-ui.css";

export default function EmptyAuthorState({
  title,
  text,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <div className="au-empty">
      <h2 className="au-empty__title">{title}</h2>
      <p className="au-empty__text">{text}</p>
      <div className="au-empty__actions">
        <button className="au-btn" type="button" onClick={onPrimary}>
          {primaryLabel}
        </button>
        {secondaryLabel && (
          <button className="au-btn au-btn--ghost" type="button" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
