// src/lib/projectTypes.ts

/**
 * Тип проекта для Supabase
 */
export type Project = {
  id: string | null
  title: string
  created_at?: string
  updated_at?: string
  thumbnail_url?: string | null
  tracks: any[]
  assets: any[]
  settings: any
}

/**
 * Создает пустой проект
 */
export function createEmptyProject(): Project {
  return {
    id: null,
    title: import.meta.env.VITE_DEFAULT_PROJECT_TITLE || "DM Project",
    tracks: [],
    assets: [],
    settings: {},
  }
}

