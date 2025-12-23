// src/services/favoritesService.ts
import { supabase } from '../lib/supabaseClient'

export type AssetType = 'images' | 'music' | 'sounds' | 'stickers' | 'icons' | 'fonts'

export interface FavoriteItem {
  id: string
  user_id: string
  asset_type: AssetType
  asset_id: string
  created_at: string
}

/**
 * Получить все избранные ассеты пользователя по типу
 */
export async function getFavoritesByType(userId: string, assetType: AssetType): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('asset_type', assetType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  return data || []
}

/**
 * Получить все избранные ассеты пользователя (все типы)
 */
export async function getAllFavorites(userId: string): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all favorites:', error)
    return []
  }

  return data || []
}

/**
 * Получить количество избранных по каждому типу
 */
export async function getFavoritesCounts(userId: string): Promise<Record<AssetType, number>> {
  const counts: Record<AssetType, number> = {
    images: 0,
    music: 0,
    sounds: 0,
    stickers: 0,
    icons: 0,
    fonts: 0
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('asset_type')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching favorites counts:', error)
    return counts
  }

  if (data) {
    data.forEach(item => {
      if (counts[item.asset_type as AssetType] !== undefined) {
        counts[item.asset_type as AssetType]++
      }
    })
  }

  return counts
}

/**
 * Добавить ассет в избранное
 */
export async function addToFavorites(userId: string, assetType: AssetType, assetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      asset_type: assetType,
      asset_id: assetId
    })

  if (error) {
    // Игнорируем ошибку дубликата (уже в избранном)
    if (error.code === '23505') {
      return true
    }
    console.error('Error adding to favorites:', error)
    return false
  }

  return true
}

/**
 * Удалить ассет из избранного
 */
export async function removeFromFavorites(userId: string, assetType: AssetType, assetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('asset_type', assetType)
    .eq('asset_id', assetId)

  if (error) {
    console.error('Error removing from favorites:', error)
    return false
  }

  return true
}

/**
 * Проверить, находится ли ассет в избранном
 */
export async function isFavorite(userId: string, assetType: AssetType, assetId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('asset_type', assetType)
    .eq('asset_id', assetId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

/**
 * Переключить статус избранного (добавить/удалить)
 */
export async function toggleFavorite(userId: string, assetType: AssetType, assetId: string): Promise<boolean> {
  const isCurrentlyFavorite = await isFavorite(userId, assetType, assetId)
  
  if (isCurrentlyFavorite) {
    return removeFromFavorites(userId, assetType, assetId)
  } else {
    return addToFavorites(userId, assetType, assetId)
  }
}
