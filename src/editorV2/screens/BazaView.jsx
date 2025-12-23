import React from 'react'
import MediaSearch from '../components/MediaSearch'

export default function BazaView({ onBack }) {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#0b0f10' }}>
      <MediaSearch onBack={onBack} />
    </div>
  )
}
