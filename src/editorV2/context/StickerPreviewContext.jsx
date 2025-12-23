// src/editorV2/context/StickerPreviewContext.jsx
import React, { createContext, useContext, useState } from 'react'

const StickerPreviewContext = createContext()

export function StickerPreviewProvider({ children }) {
  const [previewSticker, setPreviewSticker] = useState(null)

  return (
    <StickerPreviewContext.Provider value={{ previewSticker, setPreviewSticker }}>
      {children}
    </StickerPreviewContext.Provider>
  )
}

export function useStickerPreview() {
  const context = useContext(StickerPreviewContext)
  if (!context) {
    throw new Error('useStickerPreview must be used within StickerPreviewProvider')
  }
  return context
}


