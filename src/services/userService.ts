// src/services/userService.ts

import { supabase } from '../lib/supabaseClient'

export interface UserProfile {
  id: string
  // email removed as it is not in profiles table
  display_name?: string
  username?: string
  country?: string
  account_type?: 'studio' | 'pro' | 'solo'
  terms_accepted?: boolean
  accepted_terms_at?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
  locale?: string
  current_plan?: string
  plan_expires_at?: string
  is_lifetime?: boolean
  storage_used_mb?: number
  storage_limit_mb?: number
  is_deleted?: boolean
  achievements?: string[]
  referral_code?: string
  referred_by?: string
  referral_bonus_days?: number
  social_instagram?: string
  social_tiktok?: string
  social_telegram?: string
  social_youtube?: string
  social_vk?: string
  social_mix?: string
  social_whatsapp?: string
  cover_theme?: string
  cover_images?: string[]
  gender?: 'male' | 'female' | null
  accepted_terms_at?: string
  avatar_gallery?: string[]
  avatar_slideshow_enabled?: boolean
  bio?: string
  role?: 'user' | 'author'
  is_author?: boolean
  author_onboarded?: boolean
  collab_enabled?: boolean
}

export interface UserSettings {
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  email_notifications?: boolean
  autosave_enabled?: boolean
}

/**
 * Получает текущего пользователя
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Получает профиль пользователя
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Обновляет профиль пользователя
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  // Фильтруем undefined значения, чтобы не перезаписывать существующие данные
  const cleanUpdates: any = {
    updated_at: new Date().toISOString()
  }
  
  Object.keys(updates).forEach(key => {
    const value = updates[key as keyof UserProfile]
    if (value !== undefined && value !== null) {
      cleanUpdates[key] = value
    }
  })

  const { error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('id', userId)

  if (error) {
    // Детальный вывод ошибки Supabase
    console.error('Error updating user profile:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error, null, 2)
    })
    throw error
  }
}

/**
 * Гарантированно создаёт или обновляет профиль пользователя (upsert)
 * Используется когда нужно убедиться что профиль существует перед обновлением
 */
export async function ensureProfileExists(
  userId: string,
  updates: Partial<UserProfile> = {}
): Promise<void> {
  const cleanUpdates: any = {
    id: userId,
    updated_at: new Date().toISOString()
  }
  
  Object.keys(updates).forEach(key => {
    const value = updates[key as keyof UserProfile]
    if (value !== undefined && value !== null) {
      cleanUpdates[key] = value
    }
  })

  const { error } = await supabase
    .from('profiles')
    .upsert(cleanUpdates, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })

  if (error) {
    console.error('Error ensuring profile exists:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error, null, 2)
    })
    throw error
  }
}

/**
 * Загружает аватар пользователя
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Получает настройки пользователя
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const profile = await getUserProfile(userId)
  return {
    language: profile?.language || 'ru',
    theme: profile?.theme || 'dark',
    email_notifications: profile?.email_notifications ?? true,
    autosave_enabled: profile?.autosave_enabled ?? true
  }
}

/**
 * Обновляет настройки пользователя
 */
export async function updateUserSettings(
  userId: string,
  settings: UserSettings
): Promise<void> {
  await updateUserProfile(userId, settings)
}

/**
 * Изменяет пароль пользователя
 */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

/**
 * Получить топ авторов по количеству подписчиков
 */
export async function getTopAuthorsBySubscribers(limit: number = 10): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, subscribers_count')
    .eq('is_author', true)
    .order('subscribers_count', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top authors:', error)
    return []
  }

  return data || []
}

/**
 * Переключить возможность принимать коллабы
 */
export async function toggleCollabEnabled(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ collab_enabled: enabled })
    .eq('id', userId)

  if (error) {
    console.error('Error toggling collab_enabled:', error)
    throw error
  }
}

/**
 * Логическое удаление аккаунта (устанавливает флаг deleted)
 */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error deleting account:', error)
    throw error
  }
}

/**
 * Проверяет, нужен ли онбординг
 * Онбординг нужен, если профиля нет или не заполнены обязательные поля
 */
export async function needsOnboarding(userId: string, userMetadata?: any): Promise<boolean> {
  const profile = await getUserProfile(userId)
  
  if (!profile) {
    // Профиля нет - создаем с данными из Google (если есть)
    try {
      const profileData: any = {
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Получаем данные пользователя из auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Email хранится в auth.users, не в profiles
        
        // Данные из user_metadata (Google OAuth)
        // Используем переданные userMetadata или user.user_metadata
        const metadata = userMetadata || user.user_metadata || {}
        
        if (metadata.full_name || metadata.name) {
          profileData.display_name = metadata.full_name || metadata.name
        }
        
        // Avatar может быть в разных местах в зависимости от провайдера
        // Google обычно использует 'picture', другие провайдеры могут использовать 'avatar_url'
        if (metadata.picture) {
          profileData.avatar_url = metadata.picture
        } else if (metadata.avatar_url) {
          profileData.avatar_url = metadata.avatar_url
        }
      }

      await supabase
        .from('profiles')
        .insert(profileData)
    } catch (err) {
      // Игнорируем ошибку, если профиль уже существует
      console.log('Profile might already exist:', err)
    }
    return true
  }
  
  // Проверяем обязательные поля
  if (
    !profile.display_name ||
    !profile.username ||
    !profile.country ||
    !profile.account_type ||
    !profile.accepted_terms_at
  ) {
    return true
  }
  
  return false
}

/**
 * Проверяет уникальность username
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking username:', error)
    throw error
  }

  return !data // Если данных нет, username свободен
}

/**
 * Создает или обновляет профиль пользователя (онбординг)
 */
/**
 * Получает профили нескольких пользователей по массиву ID
 */
export async function getProfilesByIds(userIds: string[]): Promise<Record<string, UserProfile>> {
  if (!userIds.length) return {}
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, display_name')
    .in('id', userIds)

  if (error) {
    console.error('Error fetching profiles by ids:', error)
    return {}
  }

  return (data || []).reduce((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {} as Record<string, UserProfile>)
}

export async function createOrUpdateProfile(
  userId: string,
  profileData: {
    display_name: string
    username: string
    country: string
    account_type: 'studio' | 'pro' | 'solo'
    gender: 'male' | 'female' | null
    is_author?: boolean
    author_onboarded?: boolean
  }
): Promise<void> {
  // Проверяем уникальность username
  const existingProfile = await getUserProfile(userId)
  const normalizedUsername = profileData.username.toLowerCase()
  
  // Проверяем, не занят ли username другим пользователем
  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .maybeSingle()
  
  if (existingUsername && existingUsername.id !== userId) {
    throw new Error('Такой URL уже занят')
  }

  // Получаем данные пользователя из auth для email и avatar_url
  const { data: { user } } = await supabase.auth.getUser()
  
  const profileUpdate: any = {
    display_name: profileData.display_name,
    username: normalizedUsername,
    country: profileData.country,
    account_type: profileData.account_type,
    gender: profileData.gender,
    accepted_terms_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Добавляем is_author и author_onboarded если переданы
  if (profileData.is_author !== undefined) {
    profileUpdate.is_author = profileData.is_author
  }
  if (profileData.author_onboarded !== undefined) {
    profileUpdate.author_onboarded = profileData.author_onboarded
  }

  // Добавляем avatar_url из Google, если он есть и его еще нет в профиле
  if (user) {
    // Avatar может быть в разных местах в зависимости от провайдера
    if (!existingProfile?.avatar_url) {
      if (user.user_metadata?.avatar_url) {
        profileUpdate.avatar_url = user.user_metadata.avatar_url
      } else if (user.user_metadata?.picture) {
        profileUpdate.avatar_url = user.user_metadata.picture
      }
    }
  }

  if (existingProfile) {
    // Обновляем существующий профиль
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  } else {
    // Создаем новый профиль
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileUpdate,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  }
}

