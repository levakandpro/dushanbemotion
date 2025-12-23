// src/services/assetsService.ts

import { supabase } from './supabaseClient'

// Убрали проверку существования таблицы, чтобы не делать лишние запросы
// Вместо этого полагаемся на обработку ошибок в функциях

export interface UserAsset {
  id: string
  user_id: string
  asset_type: 'font' | 'transition' | 'sticker' | 'effect' | 'background'
  asset_name: string
  asset_url: string
  is_favorite: boolean
  created_at: string
}

/**
 * Получает активы пользователя по типу
 */
export async function getUserAssets(
  userId: string,
  assetType: 'font' | 'transition' | 'sticker' | 'effect' | 'background'
): Promise<UserAsset[]> {
  try {
    console.log('📥 Fetching assets from Supabase:', { userId, assetType })
    const { data, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_type', assetType)
      .order('created_at', { ascending: false })

    if (error) {
      // Если таблица не существует (404 или другие ошибки отсутствия таблицы)
      const isTableNotFound = 
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.message?.includes('does not exist') || 
        error.message?.includes('relation') ||
        error.message?.includes('404') ||
        error.message?.includes('not found') ||
        error.message?.toLowerCase().includes('user_assets');
      
      if (isTableNotFound) {
        console.warn('⚠️ Table user_assets does not exist')
        return []
      }
      console.error('❌ Error fetching assets:', error)
      throw error
    }

    console.log('✅ Assets fetched successfully:', data?.length || 0, 'items')
    if (data && data.length > 0) {
      console.log('📋 Assets details:', data.map(a => ({ id: a.id, name: a.asset_name, is_favorite: a.is_favorite })))
    }
    return data || []
  } catch (err: any) {
    // Дополнительная проверка на 404 в catch блоке
    const isTableNotFound = 
      err?.code === 'PGRST116' || 
      err?.code === '42P01' ||
      err?.message?.includes('does not exist') || 
      err?.message?.includes('relation') || 
      err?.message?.includes('404') ||
      err?.message?.includes('not found') ||
      err?.message?.toLowerCase().includes('user_assets');
    
    if (isTableNotFound) {
      // Не логируем как ошибку, просто возвращаем пустой массив
      return []
    }
    console.error('Error fetching assets:', err)
    return [] // Возвращаем пустой массив вместо выброса ошибки
  }
}

/**
 * Получает избранные активы
 */
export async function getFavoriteAssets(userId: string): Promise<UserAsset[]> {
  try {
    const { data, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Если таблица не существует (404 или другие ошибки отсутствия таблицы)
      const isTableNotFound = 
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.message?.includes('does not exist') || 
        error.message?.includes('relation') ||
        error.message?.includes('404') ||
        error.message?.includes('not found') ||
        error.message?.toLowerCase().includes('user_assets');
      
      if (isTableNotFound) {
        return []
      }
      console.error('Error fetching favorite assets:', error)
      throw error
    }

    return data || []
  } catch (err: any) {
    // Дополнительная проверка на 404 в catch блоке
    const isTableNotFound = 
      err?.code === 'PGRST116' || 
      err?.code === '42P01' ||
      err?.message?.includes('does not exist') || 
      err?.message?.includes('relation') || 
      err?.message?.includes('404') ||
      err?.message?.includes('not found') ||
      err?.message?.toLowerCase().includes('user_assets');
    
    if (isTableNotFound) {
      return []
    }
    console.error('Error fetching favorite assets:', err)
    return [] // Возвращаем пустой массив вместо выброса ошибки
  }
}

/**
 * Добавляет актив
 */
export async function addAsset(
  userId: string,
  asset: {
    asset_type: 'font' | 'transition' | 'sticker' | 'effect' | 'background'
    asset_name: string
    asset_url: string
    is_favorite?: boolean
  }
): Promise<UserAsset | null> {
  try {
    const insertData = {
      user_id: userId,
      asset_type: asset.asset_type,
      asset_name: asset.asset_name,
      asset_url: asset.asset_url,
      is_favorite: asset.is_favorite === true // Явно проверяем true
    }
    
    console.log('📤 Inserting asset:', insertData)
    
    const { data, error } = await supabase
      .from('user_assets')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      // Если таблица не существует (404 или другие ошибки отсутствия таблицы)
      if (error.code === 'PGRST116' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('404')) {
        console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
        return null // Возвращаем null вместо выброса ошибки
      }
      console.error('Error adding asset:', error)
      throw error
    }

    console.log('✅ Asset inserted successfully:', data)
    console.log('✅ Asset is_favorite:', data?.is_favorite)
    return data
  } catch (err: any) {
    // Дополнительная проверка на 404 в catch блоке
    if (err?.code === 'PGRST116' || err?.message?.includes('does not exist') || err?.message?.includes('relation') || err?.message?.includes('404')) {
      console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
      return null
    }
    console.error('Error adding asset:', err)
    return null // Возвращаем null вместо выброса ошибки
  }
}

/**
 * Удаляет актив
 */
export async function deleteAsset(assetId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_assets')
      .delete()
      .eq('id', assetId)

    if (error) {
      // Если таблица не существует (404 или другие ошибки отсутствия таблицы)
      if (error.code === 'PGRST116' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('404')) {
        console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
        return // Не выбрасываем ошибку, просто возвращаемся
      }
      console.error('Error deleting asset:', error)
      throw error
    }
  } catch (err: any) {
    // Дополнительная проверка на 404 в catch блоке
    if (err?.code === 'PGRST116' || err?.message?.includes('does not exist') || err?.message?.includes('relation') || err?.message?.includes('404')) {
      console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
      return
    }
    console.error('Error deleting asset:', err)
    // Не выбрасываем ошибку, просто возвращаемся
  }
}

/**
 * Переключает избранное
 */
export async function toggleFavorite(assetId: string, isFavorite: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_assets')
      .update({ is_favorite: isFavorite })
      .eq('id', assetId)

    if (error) {
      // Если таблица не существует (404 или другие ошибки отсутствия таблицы)
      if (error.code === 'PGRST116' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('404')) {
        console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
        return // Не выбрасываем ошибку, просто возвращаемся
      }
      console.error('Error toggling favorite:', error)
      throw error
    }
  } catch (err: any) {
    // Дополнительная проверка на 404 в catch блоке
    if (err?.code === 'PGRST116' || err?.message?.includes('does not exist') || err?.message?.includes('relation') || err?.message?.includes('404')) {
      console.warn('Table user_assets does not exist. Please run migration: create_user_assets.sql')
      return
    }
    console.error('Error toggling favorite:', err)
    // Не выбрасываем ошибку, просто возвращаемся
  }
}

