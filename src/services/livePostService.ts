// src/services/livePostService.ts

import { supabase } from '../lib/supabaseClient'

export interface LivePost {
  id: string
  author_id: string
  media_url: string
  thumbnail_url: string | null
  title: string
  description: string | null
  orientation: 'vertical' | 'horizontal'
  category: string
  views: number
  likes_count: number
  favorites_count: number
  comments_count: number
  project_id: string | null
  allow_open_project: boolean
  status: 'draft' | 'published' | string
  is_pinned: boolean
  pin_order: number | null
  created_at: string
  updated_at: string
}

export interface CreateLivePostData {
  author_id: string
  media_url: string
  thumbnail_url?: string | null
  title: string
  description?: string | null
  orientation: 'vertical' | 'horizontal'
  category: string
  project_id?: string | null
  allow_open_project: boolean
  status: 'draft' | 'published'
}

/**
 * Создает новый пост в live_posts
 */
export async function createLivePost(data: CreateLivePostData): Promise<LivePost> {
  const { data: post, error } = await supabase
    .from('live_posts')
    .insert({
      author_id: data.author_id,
      media_url: data.media_url,
      // Никогда не шлём null, только строку
      thumbnail_url: data.thumbnail_url || '',
      title: data.title,
      description: data.description || null,
      orientation: data.orientation,
      category: data.category,
      views: 0,
      likes_count: 0,
      favorites_count: 0,
      comments_count: 0,
      project_id: data.project_id || null,
      allow_open_project: data.allow_open_project,
      status: data.status,
      is_pinned: false,
      pin_order: null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating live post:', error)
    throw error
  }

  return post
}

/**
 * Получает опубликованные посты для BAZAR
 */
export async function getPublishedPosts(options?: {
  category?: string
  sort?: 'new' | 'popular' | 'week' | 'vertical' | 'horizontal'
  limit?: number
  offset?: number
}): Promise<LivePost[]> {
  let query = supabase
    .from('live_posts')
    .select('*')
    .eq('status', 'published')

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category)
  }

  // Сортировка (vertical и horizontal - это визуальные режимы, не фильтры данных)
  if (options?.sort === 'popular') {
    query = query.order('likes_count', { ascending: false })
  } else if (options?.sort === 'week') {
    // За последнюю неделю
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('created_at', weekAgo.toISOString())
    query = query.order('likes_count', { ascending: false })
  } else {
    // По умолчанию: новые (или после фильтрации по orientation)
    query = query.order('created_at', { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching published posts:', error)
    throw error
  }

  return data || []
}

/**
 * Получает черновики пользователя
 */
export async function getDraftPosts(userId: string): Promise<LivePost[]> {
  const { data, error } = await supabase
    .from('live_posts')
    .select('*')
    .eq('author_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching draft posts:', error)
    throw error
  }

  return data || []
}

