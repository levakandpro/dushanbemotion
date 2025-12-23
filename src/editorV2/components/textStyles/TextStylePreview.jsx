// src/author/components/textStyles/TextStylePreview.jsx
// ПОЛНАЯ ЗАМЕНА (2-слойный превью: stroke + fill)

import React from "react";
import { getTextStyleForRender } from "../../../textStyles";

const hasLatinChars = (value) => /[A-Za-z]/.test(String(value || ''))

export default function TextStylePreview({ preset, isActive, onSelect }) {
  const { style, strokeStyle } = getTextStyleForRender(preset.id, { forPreview: true });

  const containerStyle = {
    all: "unset",
    cursor: "pointer",
    boxSizing: "border-box",
    borderRadius: 6,
    padding: "10px 12px",
    background: "#1a1a1a",
    border: "1px solid #333333",
    boxShadow: isActive
      ? "0 0 0 1px #FFD78C, 0 0 12px 0 rgba(255, 215, 140, 0.2)"
      : "0 4px 8px rgba(0, 0, 0, 0.4)",
    transition: "all 0.15s ease-out",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 64,
    position: "relative",
    overflow: "visible", // Изменено с "hidden" на "visible", чтобы обводка не обрезалась
    width: "100%",
  };

  const nameStyle = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: isActive ? "#FFD78C" : "#999999",
    marginBottom: 2,
  };

  const isPremium = preset.isPremium === true;
  const sampleText = preset.sampleText || "ТЕКСТ";
  const text = hasLatinChars(sampleText) ? "ТЕКСТ" : sampleText;
  const showName = !hasLatinChars(preset.name)

  return (
    <button type="button" onClick={onSelect} style={containerStyle}>
      {isPremium && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "2px 6px",
            backgroundColor: "#FFD78C",
            color: "#1a1a1a",
            fontSize: 8,
            fontWeight: 900,
            textTransform: "uppercase",
            borderRadius: "0 6px 0 6px",
            letterSpacing: "0.05em",
          }}
        >
          by D
        </div>
      )}

      {showName && <div style={nameStyle}>{preset.name}</div>}

      <div
        style={{
          minHeight: 20,
          width: "100%",
          transform: "translateZ(0)",
          overflow: "hidden",
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          {strokeStyle && <span style={strokeStyle}>{text}</span>}
          <span style={{ ...style, display: "inline-block" }}>{text}</span>
        </span>
      </div>
    </button>
  );
}
