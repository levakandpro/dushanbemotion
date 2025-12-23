// src/services/mediaService.ts

import { supabase } from './supabaseClient'

export interface MediaItem {
  id: string
  user_id: string
  file_name: string
  file_type: 'image' | 'video' | 'audio'
  file_size: number
  file_url: string
  created_at: string
}

/**
 * Получает список медиа пользователя
 */
export async function getUserMedia(
  userId: string,
  type?: 'image' | 'video' | 'audio'
): Promise<MediaItem[]> {
  let query = supabase
    .from('user_media')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('file_type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching media:', error)
    throw error
  }

  return data || []
}

/**
 * Загружает медиа файл
 */
export async function uploadMedia(
  userId: string,
  file: File
): Promise<MediaItem> {
  const fileType = file.type.startsWith('image/') ? 'image' :
                   file.type.startsWith('video/') ? 'video' :
                   file.type.startsWith('audio/') ? 'audio' : 'image'

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `media/${userId}/${fileName}`

  // Загружаем в storage
  const { error: uploadError } = await supabase.storage
    .from('user_media')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading media:', uploadError)
    throw uploadError
  }

  // Получаем публичный URL
  const { data: urlData } = supabase.storage
    .from('user_media')
    .getPublicUrl(filePath)

  // Сохраняем запись в БД
  const { data, error } = await supabase
    .from('user_media')
    .insert({
      user_id: userId,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      file_url: urlData.publicUrl,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving media record:', error)
    throw error
  }

  return data
}

/**
 * Удаляет медиа
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  // Получаем информацию о файле
  const { data: media, error: fetchError } = await supabase
    .from('user_media')
    .select('file_url')
    .eq('id', mediaId)
    .single()

  if (fetchError) {
    console.error('Error fetching media:', fetchError)
    throw fetchError
  }

  // Удаляем из storage (извлекаем путь из URL)
  if (media?.file_url) {
    const urlParts = media.file_url.split('/')
    const filePath = urlParts.slice(-2).join('/')
    
    await supabase.storage
      .from('user_media')
      .remove([filePath])
  }

  // Удаляем запись из БД
  const { error } = await supabase
    .from('user_media')
    .delete()
    .eq('id', mediaId)

  if (error) {
    console.error('Error deleting media:', error)
    throw error
  }
}

/**
 * Получает статистику использования хранилища
 */
export async function getStorageUsage(userId: string): Promise<{
  used: number
  limit: number
}> {
  const { data, error } = await supabase
    .from('user_media')
    .select('file_size')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching storage usage:', error)
    throw error
  }

  const used = (data || []).reduce((sum, item) => sum + (item.file_size || 0), 0)
  
  // Лимит получаем из тарифа (через billingService)
  // Пока возвращаем дефолтный лимит
  return {
    used,
    limit: 5 * 1024 * 1024 * 1024 // 5 GB по умолчанию
  }
}

