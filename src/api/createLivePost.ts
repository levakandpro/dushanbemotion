// src/api/createLivePost.ts

import { supabase } from '../lib/supabaseClient'

export type PublishMode = 'bazar' | 'draft' | 'none'

export interface CreateLivePostParams {
  authorId: string // profiles.id
  projectId: string | null
  mediaUrl: string // ссылка на mp4 в R2
  thumbnailUrl: string | null // кадр / постер
  title: string
  description: string
  orientation: 'vertical' | 'horizontal'
  category: string // 'patriot' | 'music' | ...
  allowOpenProject: boolean
  publishMode: PublishMode // 'bazar' | 'draft' | 'none'
}

export async function createLivePost(params: CreateLivePostParams) {
  const status =
    params.publishMode === 'bazar'
      ? 'published'
      : params.publishMode === 'draft'
      ? 'draft'
      : null

  if (!status) {
    // Если publishMode = 'none' - ничего не создаём
    return null
  }

  const { data, error } = await supabase.from('live_posts').insert({
    author_id: params.authorId,
    project_id: params.projectId,
    media_url: params.mediaUrl,
    // Заглушка для Supabase, null не отправляем
    thumbnail_url: params.thumbnailUrl || '',
    title: params.title,
    description: params.description || null,
    orientation: params.orientation,
    category: params.category,
    views: 0,
    likes_count: 0,
    favorites_count: 0,
    comments_count: 0,
    allow_open_project: params.allowOpenProject,
    status,
    is_pinned: false,
    pin_order: null,
  }).select().single()

  if (error) {
    console.error('createLivePost error', error)
    throw error
  }

  return data
}


