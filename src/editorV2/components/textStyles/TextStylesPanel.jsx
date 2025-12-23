// src/author/components/textStyles/TextStylesPanel.jsx
// ПОЛНАЯ ЗАМЕНА. Без двойной логики selection (панель только прокидывает слой)

import React from "react";
import TextStylesGrid from "./TextStylesGrid";

export default function TextStylesPanel({ currentLayer, onChangeLayer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        TEXT STYLES
      </div>

      <TextStylesGrid currentLayer={currentLayer} onChangeLayer={onChangeLayer} />
    </div>
  );
}
