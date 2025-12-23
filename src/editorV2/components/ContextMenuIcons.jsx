// src/editorV2/components/ContextMenuIcons.jsx
import React from 'react'

// НОВАЯ: Для сохранения в коллекции
export const SaveToCollectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
)

export const DuplicateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 9V3C2 2.44772 2.44772 2 3 2H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
)

export const FlipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
    <path d="M9.5 3.5C10.5 3.5 11.5 4 11.5 5.5V8.5C11.5 10 10.5 10.5 9.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4.5 3.5C3.5 3.5 2.5 4 2.5 5.5V8.5C2.5 10 3.5 10.5 4.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

export const BringForwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"/>
    <rect x="5" y="2" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
)

export const SendBackwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"/>
    <rect x="2" y="5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
)

// КРИТИЧНО: Эту иконку ждет StickerLayer.jsx
export const SendToBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2.5v6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4.8 6.7 7 8.9l2.2-2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2.2" y="10.2" width="9.6" height="1.8" rx="0.9" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.9"/>
  </svg>
)

export const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4.5 6.5V4.5C4.5 3.11929 5.61929 2 7 2C8.38071 2 9.5 3.11929 9.5 4.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.8" fill="currentColor"/>
  </svg>
)

export const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4.5 6.5V4.5C4.5 3.11929 5.61929 2 7 2C8.38071 2 9.5 3.11929 9.5 4.5V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.8" fill="currentColor"/>
  </svg>
)

export const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M5.5 2H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M3.5 4V11C3.5 11.5523 3.94772 12 4.5 12H9.5C10.0523 12 10.5 11.5523 10.5 11V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M6 6.5V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

export const GrayscaleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M7 2C4.24 2 2 4.24 2 7s2.24 5 5 5" fill="currentColor" opacity="0.4"/>
  </svg>
)

export const RotateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 7a4 4 0 1 1-1.5-3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M11 2v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const FlipHorizontalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M4 4L2 7l2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 4l2 3-2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const FlipVerticalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M4 4L7 2l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 10l3 2 3-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)