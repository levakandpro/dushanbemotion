// src/editorV2/components/TimelineIcons.jsx
import React from 'react'

export const AudioIcon = ({ className, style }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path 
      d="M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18Z" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 18V6L21 3V15" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M21 15C21 16.6569 19.6569 18 18 18C16.3431 18 15 16.6569 15 15C15 13.3431 16.3431 12 18 12C19.6569 12 21 13.3431 21 15Z" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

export const StickerIcon = ({ className, style }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <path 
      d="M4 4L16 4C17.1046 4 18 4.89543 18 6L18 18C18 19.1046 17.1046 20 16 20L4 20C2.89543 20 2 19.1046 2 18L2 6C2 4.89543 2.89543 4 4 4Z" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18 6L18 12L22 16L22 6C22 4.89543 21.1046 4 20 4L18 4" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18 12L22 16" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="9" cy="10" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="13" cy="14" r="1.5" fill="currentColor" opacity="0.6"/>
  </svg>
)

