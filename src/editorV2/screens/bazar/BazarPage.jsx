import React from 'react'
import GalleryPanel from '../../components/gallery/GalleryPanel'

export default function BazarPage() {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      backgroundColor: '#0a0a0a'
    }}>
      <GalleryPanel
        title="BAZAR"
        items={[]}
        isLoading={false}
        isError={false}
        activeMode="all"
        onModeChange={() => {}}
        zoom={1}
        onZoomChange={() => {}}
        onSelect={() => {}}
        onToggleFav={() => {}}
        onDownload={() => {}}
        onOpenDetails={() => {}}
      />
    </div>
  )
}

