import React, { useMemo } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../../lib/useAuth'
import StickerCategoriesRail from '../components/StickerCategoriesRail'
import Loader from '../../components/ui/Loader'
import './MusicPanel.css'

import musIcon from '../../../assets/iconmusic/mus.svg'
import starIcon from '../../../assets/iconmusic/star.svg'
import dowIcon from '../../../assets/iconmusic/dow.svg'
import playIcon from '../../../assets/iconmusic/play-svgrepo-com.svg'
import pauseIcon from '../../../assets/iconmusic/pause-svgrepo-com.svg'
import flamencoIcon from '../../../assets/iconmusic/flamenco-svgrepo-com.svg'
import rapperIcon from '../../../assets/iconmusic/rapper-hip-hop-svgrepo-com.svg'
import beIcon from '../../../assets/iconmusic/be-svgrepo-com.svg'
import skullLampIcon from '../../../assets/iconmusic/skull-lamp-svgrepo-com.svg'
import sadCircleIcon from '../../../assets/iconmusic/sad-circle-svgrepo-com.svg'

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']

const GENRE_NAME_OVERRIDES = {
  sad: 'ZINDAGI',
  dance: 'HARAKAT',
  epic: 'QISSA',
  horror: 'SHAB',
  tajrap: 'HIP HOP',
}

// Секции аудио библиотеки
const AUDIO_SECTIONS = [
  { id: 'music', label: 'МУЗЫКА' },
  { id: 'sounds', label: 'ЗВУКИ' },
  { id: 'premium', label: 'PREMIUM' },
]

// Категории для каждой секции
const SECTION_CATEGORIES = {
  music: [
    { id: 'sad', label: 'ZINDAGI' },
    { id: 'dance', label: 'HARAKAT' },
    { id: 'epic', label: 'QISSA' },
    { id: 'horror', label: 'SHAB' },
    { id: 'tajrap', label: 'HIP HOP' },
  ],
  sounds: [
    { id: 'zvuki/horror', label: 'Horror' },
    { id: 'zvuki/whoosh', label: 'Whoosh' },
  ],
  premium: [
    { id: 'soundtracks', label: 'Треки' },
    { id: 'Premium', label: 'Premium' },
  ],
}

function titleizeFolderName(folder) {
  const raw = String(folder || '').trim()
  if (!raw) return '-'
  const key = raw.replace(/\/+$/, '').toLowerCase()
  if (GENRE_NAME_OVERRIDES[key]) return GENRE_NAME_OVERRIDES[key]
  // Простой дефолт: "lofi_beat" -> "Lofi Beat"
  return raw
    .replace(/\/+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function fileNameFromKey(key) {
  const last = String(key || '').split('/').pop() || ''
  return last.replace(/\.[a-z0-9]+$/i, '') || last || 'Трек'
}

function splitArtistTitle(name) {
  const raw = String(name || '').trim()
  if (!raw) return { artist: '', title: '' }
  // Common patterns: "ARTIST - Title" / "ARTIST - Title"
  const parts = raw.split(/\s[--]\s/)
  if (parts.length >= 2) {
    const artist = parts[0].trim()
    const title = parts.slice(1).join(' - ').trim()
    return { artist, title }
  }
  return { artist: '', title: raw }
}

function formatTime(sec) {
  const s = Number.isFinite(sec) ? Math.max(0, sec) : 0
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

function MaskIcon({ src, size = 16, label }) {
  return (
    <span
      aria-label={label}
      style={{
        width: size,
        height: size,
        display: 'block',
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  )
}

export default function MusicPanel() {
  const toast = useToast()
  const { profile } = useAuth()
  
  // Проверяем есть ли у пользователя активный PREMIUM
  const userHasPremium = useMemo(() => {
    if (!profile) return false;
    if (profile.is_lifetime) return true;
    if (!profile.current_plan || profile.current_plan === 'free') return false;
    if (!profile.plan_expires_at) return false;
    return new Date(profile.plan_expires_at) > new Date();
  }, [profile]);
  
  const [activeSection, setActiveSection] = React.useState('music')
  const [activeGenre, setActiveGenre] = React.useState(null)
  const [isGenresCollapsed, setIsGenresCollapsed] = React.useState(false)
  
  // Получаем категории для текущей секции
  const genres = SECTION_CATEGORIES[activeSection] || []

  const [tracks, setTracks] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState(null)

  const audioRef = React.useRef(null)
  const [playingKey, setPlayingKey] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)

  const workerUrl = React.useMemo(
    () => import.meta.env.VITE_WORKER_URL || 'https://stickers-manifest.natopchane.workers.dev',
    []
  )

  // In-memory cache for track lists: { [genre]: { ts, items } }
  const tracksCacheRef = React.useRef(new Map())
  const TRACKS_TTL_MS = 90_000

  // При смене секции устанавливаем первую категорию
  React.useEffect(() => {
    const cats = SECTION_CATEGORIES[activeSection] || []
    if (cats.length > 0) {
      setActiveGenre(cats[0].id)
    } else {
      setActiveGenre(null)
      setTracks([])
    }
  }, [activeSection])

  const fetchTracks = React.useCallback(
    async (genreId, opts = {}) => {
      const gid = String(genreId || '').trim()
      if (!gid) return
      const force = !!opts.force
      const now = Date.now()
      const cacheKey = `music:${gid}`
      const cached = tracksCacheRef.current.get(cacheKey)
      const hasCache = cached && Array.isArray(cached.items)
      const isFresh = hasCache && (now - cached.ts) < TRACKS_TTL_MS

      // Serve from cache instantly
      if (!force && isFresh) {
        setTracks(cached.items)
        return
      }

      // Stale-while-revalidate: keep old list visible, refresh in background
      if (!force && hasCache) {
        setTracks(cached.items)
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      try {
        const bust = force ? `&t=${now}` : ''
        const url = `${workerUrl}/api/music/tracks?genre=${encodeURIComponent(gid)}${bust}`
        const resp = await fetch(url, {
          cache: force ? 'no-store' : 'default',
          headers: { Accept: 'application/json' },
        })
        const text = await resp.text().catch(() => '')
        const data = text ? JSON.parse(text) : {}
        if (!resp.ok) {
          const detail = data?.error || text || `${resp.status} ${resp.statusText}`.trim()
          console.error('❌ Music tracks failed:', { url, status: resp.status, detail })
          throw new Error(detail || 'Failed to load tracks')
        }
        const items = Array.isArray(data?.items) ? data.items : []
        const next = items
          .map(it => ({
            key: it?.key,
            url: it?.url,
            name: it?.displayName || it?.name || fileNameFromKey(it?.key),
          }))
          .filter(t => t.key && t.url)
          .filter(t => AUDIO_EXTS.some(ext => String(t.key).toLowerCase().endsWith(ext)))

        // Keep server order stable (already sorted); don't re-sort here.
        setTracks(next)
        tracksCacheRef.current.set(cacheKey, { ts: now, items: next })
      } catch (e) {
        const msg = e?.message || 'Ошибка загрузки треков'
        setError(msg)
        // On refresh errors keep cached list; on cold load show empty
        if (!hasCache) setTracks([])
        toast?.show?.({ type: 'error', message: msg })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [workerUrl, toast]
  )

  React.useEffect(() => {
    if (activeGenre) {
      // Сбрасываем треки только когда начинаем загружать новый жанр
      // Это предотвращает показ старых треков при смене вкладки
      setTracks([])
      fetchTracks(activeGenre)
    } else {
      // Если жанр сброшен, очищаем треки
      setTracks([])
      setLoading(false)
    }
  }, [activeGenre, fetchTracks])

  // Сообщаем шапке о состоянии play/pause (только визуальная привязка)
  React.useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('dm:music:playback', { detail: { isPlaying: !!isPlaying } }))
    } catch {
      // ignore
    }
  }, [isPlaying])

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return audioRef.current
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime || 0))
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration || 0))
    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setPlayingKey(null)
      setCurrentTime(0)
    })
    audio.addEventListener('error', () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    })
    audioRef.current = audio
    return audio
  }, [])

  const togglePlay = React.useCallback(
    async (track) => {
      const a = ensureAudio()
      if (!track?.url || !track?.key) return

      // same track
      if (playingKey === track.key) {
        if (isPlaying) {
          a.pause()
          setIsPlaying(false)
        } else {
          try {
            await a.play()
            setIsPlaying(true)
          } catch {
            toast?.show?.({ type: 'error', message: 'Не удалось воспроизвести' })
          }
        }
        return
      }

      // new track
      try {
        a.pause()
        a.currentTime = 0
      } catch {
        // ignore
      }
      setCurrentTime(0)
      setDuration(0)
      setPlayingKey(track.key)
      a.src = track.url
      try {
        await a.play()
        setIsPlaying(true)

        // Optional prefetch next track (warm up cache)
        const idx = tracks.findIndex(t => t?.key === track.key)
        const next = idx >= 0 && idx + 1 < tracks.length ? tracks[idx + 1] : null
        if (next?.url) {
          fetch(next.url, { headers: { Range: 'bytes=0-1' } }).catch(() => {})
        }
      } catch {
        setIsPlaying(false)
        toast?.show?.({ type: 'error', message: 'Не удалось воспроизвести' })
      }
    },
    [ensureAudio, isPlaying, playingKey, toast, tracks]
  )

  const onSeek = React.useCallback((value) => {
    const a = audioRef.current
    if (!a) return
    const next = Math.max(0, Math.min(Number(value) || 0, a.duration || 0))
    a.currentTime = next
    setCurrentTime(next)
  }, [])

  const downloadTrack = React.useCallback(async (track) => {
    if (!track?.url) return
    try {
      const resp = await fetch(track.url)
      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${track.name || 'track'}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast?.show?.({ type: 'error', message: 'Не удалось скачать' })
    }
  }, [toast])

  return (
    <div className="dm-music-panel dm-music-panel-surface">
      <div className="dm-right-panel-header dm-music-panel-header">
        <h3 className="dm-music-panel-title">D MOTION · Audio Library</h3>
      </div>

      {/* Секции: МУЗЫКА | ЗВУКИ | PREMIUM */}
      <div className="dm-music-sections">
        {AUDIO_SECTIONS.map(sec => (
          <button
            key={sec.id}
            type="button"
            className={`dm-music-section-btn ${activeSection === sec.id ? 'dm-music-section-btn--active' : ''} ${sec.id === 'premium' ? 'dm-music-section-btn--premium' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="dm-music-tracks-empty" style={{ borderColor: 'rgba(255,120,120,0.25)' }}>
          {error}
        </div>
      )}

      <div className="dm-music-layout">
        <div className={`dm-music-genres ${isGenresCollapsed ? 'dm-music-genres-collapsed' : ''}`}>
          <StickerCategoriesRail
            title={activeSection === 'music' ? 'ПОДБОРКИ' : activeSection === 'sounds' ? 'КАТЕГОРИИ' : 'PREMIUM'}
            isVisible={true}
            isCollapsed={isGenresCollapsed}
            onToggleCollapse={() => setIsGenresCollapsed(v => !v)}
            expandedWidth={92}
            collapsedWidth={48}
            showTooltips={false}
            renderCollapsedIcon={(cat, isActive) => {
              const id = String(cat?.id || '').toLowerCase()
              const common = {
                style: { display: 'block', opacity: isActive ? 1 : 0.88 }
              }
              // Музыка
              if (id === 'sad') {
                return <span {...common}><MaskIcon src={sadCircleIcon} size={16} label="ZINDAGI" /></span>
              }
              if (id === 'dance') {
                return <span {...common}><MaskIcon src={flamencoIcon} size={16} label="HARAKAT" /></span>
              }
              if (id === 'epic') {
                return <span {...common}><MaskIcon src={beIcon} size={16} label="QISSA" /></span>
              }
              if (id === 'horror' || id === 'zvuki/horror') {
                return <span {...common}><MaskIcon src={skullLampIcon} size={16} label="Horror" /></span>
              }
              if (id === 'tajrap') {
                return <span {...common}><MaskIcon src={rapperIcon} size={16} label="HIP HOP" /></span>
              }
              // Звуки
              if (id === 'zvuki/whoosh') {
                return <span {...common} style={{ ...common.style, fontSize: '14px' }}>💨</span>
              }
              // Premium
              if (id === 'soundtracks') {
                return <span {...common}><MaskIcon src={musIcon} size={16} label="Soundtracks" /></span>
              }
              if (id === 'premium') {
                return <span {...common}><MaskIcon src={starIcon} size={16} label="Premium" /></span>
              }
              return <span className="dm-sticker-category-rail-icon">•</span>
            }}
            categories={genres}
            activeCategory={activeGenre}
            onCategoryChange={setActiveGenre}
            onPrefetchCategory={(genreId) => {
              // лёгкий prefetch списка треков на hover
              if (genreId && genreId !== activeGenre) fetchTracks(genreId)
            }}
          />
        </div>

        <div className="dm-music-tracks">
          {refreshing && !loading && tracks.length > 0 && (
            <div className="dm-music-refresh-indicator" aria-label="Обновление списка">
              Обновление…
            </div>
          )}
          {loading && (
            <Loader fullscreen={false} size="minimal" showText={false} />
          )}

          {!loading && tracks.length === 0 && (
            <div className="dm-music-tracks-empty">
              {activeGenre ? 'Пока нет треков в этом жанре' : 'Выберите жанр'}
            </div>
          )}

          {!loading && (
            <div className="dm-music-tracks-scroll">
              {tracks.map((t) => {
            const isRowPlaying = playingKey === t.key && isPlaying
            const isRowActive = playingKey === t.key
            const rowCurrent = isRowActive ? currentTime : 0
            const rowDuration = isRowActive ? duration : 0
            const pct = rowDuration ? Math.max(0, Math.min(100, (rowCurrent / rowDuration) * 100)) : 0
            const meta = splitArtistTitle(t.name)
            const isPremiumSection = activeSection === 'premium'

            return (
              <div
                key={t.key}
                className={`dm-music-track-row ${isRowActive ? 'dm-music-track-row--active' : ''}`}
              >
                <button
                  type="button"
                  className="dm-music-icon-btn dm-music-play-btn"
                  onClick={() => togglePlay(t)}
                  aria-label={isRowPlaying ? 'Пауза' : 'Играть'}
                >
                  <MaskIcon src={isRowPlaying ? pauseIcon : playIcon} size={16} />
                </button>

                <div className="dm-music-track-line">
                  <div
                    className="dm-music-track-name"
                    aria-label="Название трека"
                    data-artist={meta.artist || ''}
                  >
                    {meta.title || t.name}
                  </div>
                  <div className="dm-music-progress-wrap">
                    <input
                      className="dm-music-progress"
                      type="range"
                      min="0"
                      max={rowDuration > 0 ? rowDuration : 100}
                      step="0.1"
                      value={rowCurrent}
                      onChange={(e) => {
                        if (isRowActive) {
                          onSeek(Number(e.target.value))
                        }
                      }}
                      onClick={() => {
                        if (!isRowActive) {
                          togglePlay(t)
                        }
                      }}
                      style={{
                        background: rowDuration > 0 
                          ? `linear-gradient(to right, #5cffd4 0%, #5cffd4 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`
                          : 'rgba(255,255,255,0.15)'
                      }}
                    />
                    <span className="dm-music-time">
                      {formatTime(rowCurrent)} / {formatTime(rowDuration)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`dm-music-download-btn ${isPremiumSection && !userHasPremium ? 'dm-music-download-btn--premium' : ''}`}
                  onClick={() => {
                    if (isPremiumSection && !userHasPremium) {
                      window.location.href = '/pricing'
                    } else {
                      downloadTrack(t)
                    }
                  }}
                  aria-label="Скачать"
                >
                  <MaskIcon src={dowIcon} size={16} />
                </button>
              </div>
            )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


