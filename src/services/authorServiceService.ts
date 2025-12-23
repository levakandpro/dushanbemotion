// src/services/authorServiceService.ts
// Сервис для работы с услугами авторов

import { supabase } from '../lib/supabaseClient'

export interface AuthorService {
  id: string
  author_id: string
  title: string
  description: string
  emoji?: string
  price: number
  delivery_days: number
  youtube_url?: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  views_count: number
  orders_count: number
  rating: number
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CreateServiceData {
  title: string
  description: string
  price: number
  deliveryDays: number
  youtubeUrl?: string
  revisions?: number
  coverImage?: string
  images?: string[]
}

/**
 * Создаёт новую услугу автора
 */
export async function createAuthorService(
  authorId: string,
  data: CreateServiceData
): Promise<AuthorService> {
  const { data: service, error } = await supabase
    .from('author_services')
    .insert({
      author_id: authorId,
      title: data.title,
      description: data.description,
      price: data.price,
      delivery_days: data.deliveryDays,
      youtube_url: data.youtubeUrl || null,
      revisions: data.revisions || 2,
      cover_url: data.coverImage || null,
      images: data.images || [],
      status: 'active',
      published_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating service:', error)
    throw error
  }

  return service
}

/**
 * Получает все услуги автора
 */
export async function getAuthorServices(authorId: string): Promise<AuthorService[]> {
  const { data, error } = await supabase
    .from('author_services')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching author services:', error)
    throw error
  }

  return data || []
}

/**
 * Получает услугу по ID
 */
export async function getServiceById(serviceId: string): Promise<AuthorService | null> {
  const { data, error } = await supabase
    .from('author_services')
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', serviceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching service:', error)
    throw error
  }

  // Добавляем данные автора
  return {
    ...data,
    author_name: data.profiles?.display_name || data.profiles?.username || 'Автор',
    author_username: data.profiles?.username,
    author_avatar: data.profiles?.avatar_url
  }
}

/**
 * Обновляет услугу
 */
export async function updateAuthorService(
  serviceId: string,
  updates: Partial<CreateServiceData & { status: string }>
): Promise<AuthorService> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.price !== undefined) updateData.price = updates.price
  if (updates.deliveryDays !== undefined) updateData.delivery_days = updates.deliveryDays
  if (updates.youtubeUrl !== undefined) updateData.youtube_url = updates.youtubeUrl
  if (updates.images !== undefined) updateData.images = updates.images
  if (updates.status !== undefined) updateData.status = updates.status

  const { data, error } = await supabase
    .from('author_services')
    .update(updateData)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) {
    console.error('Error updating service:', error)
    throw error
  }

  return data
}

/**
 * Удаляет услугу
 */
export async function deleteAuthorService(serviceId: string): Promise<void> {
  const { error } = await supabase
    .from('author_services')
    .delete()
    .eq('id', serviceId)

  if (error) {
    console.error('Error deleting service:', error)
    throw error
  }
}

/**
 * Меняет статус услуги
 */
export async function toggleServiceStatus(
  serviceId: string,
  newStatus: 'active' | 'paused'
): Promise<AuthorService> {
  return updateAuthorService(serviceId, { status: newStatus })
}

/**
 * Получает все активные услуги для BAZAR
 */
export async function getActiveServices(): Promise<AuthorService[]> {
  const { data, error } = await supabase
    .from('author_services')
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active services:', error)
    throw error
  }

  // Добавляем данные автора к каждой услуге
  return (data || []).map(service => ({
    ...service,
    author_name: service.profiles?.display_name || service.profiles?.username || 'Автор',
    author_username: service.profiles?.username,
    author_avatar: service.profiles?.avatar_url
  }))
}
