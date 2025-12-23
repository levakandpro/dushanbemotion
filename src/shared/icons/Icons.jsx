// src/shared/icons/Icons.jsx

import React from 'react'

export const IconOverview = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M2 2h4v4H2V2zm6 0h4v4H8V2zm-6 6h4v4H2V8zm6 0h4v4H8V8z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconProjects = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3 2h10v12H3V2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 5h10M3 8h10M3 11h7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconMedia = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <rect x="2" y="4" width="12" height="8" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M6 6l3 2-3 2V6z" fill={color}/>
  </svg>
)

export const IconAssets = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 2L3 7h3v5h4V7h3L8 2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconSubscriptions = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 2L10 6h4l-3 2 1 4-4-3-4 3 1-4-3-2h4L8 2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconProfile = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="6" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M3 14c0-2.5 2.5-4.5 5-4.5s5 2 5 4.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

export const IconSettings = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M8 1v2M8 13v2M15 8h-2M3 8H1M13.66 2.34l-1.41 1.41M3.75 12.25l-1.41 1.41M13.66 13.66l-1.41-1.41M3.75 3.75l-1.41-1.41" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconLogout = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M6 12H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M10 11l3-3-3-3M13 8H6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconEditor = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M2 2h12v12H2V2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6h6M5 9h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconPremium = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5l2-5z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconFree = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M8 5v3M8 11h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconStorage = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <rect x="2" y="4" width="12" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M2 7h12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconSupport = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M8 6a2 2 0 0 0-2 2v1h1v-1a1 1 0 0 1 2 0c0 .5-.5 1-1 1M8 11h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const IconArrowRight = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M6 3l5 5-5 5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconCheck = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3 8l3 3 7-7" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const IconLive = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="8" r="2" fill={color}/>
  </svg>
)

