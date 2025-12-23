// src/services/workService.js

import { supabase } from '../lib/supabaseClient'
import { getCurrentUser } from './userService'

/**
 * Получает все работы автора
 */
export async function getAuthorWorks(userId) {
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .eq('author_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching author works:', error)
    throw error
  }

  return data || []
}

/**
 * Получает метрики работы
 */
export async function getWorkMetrics(workId) {
  const { data, error } = await supabase
    .from('work_metrics')
    .select('*')
    .eq('work_id', workId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Метрики не найдены - возвращаем пустые
      return {
        work_id: workId,
        views: 0,
        likes: 0,
        recommends: 0,
        stars: 0,
        updated_at: new Date().toISOString()
      }
    }
    console.error('Error fetching work metrics:', error)
    throw error
  }

  return data
}

/**
 * Получает метрики для нескольких работ
 */
export async function getWorksMetrics(workIds) {
  if (workIds.length === 0) return []

  const { data, error } = await supabase
    .from('work_metrics')
    .select('*')
    .in('work_id', workIds)

  if (error) {
    console.error('Error fetching works metrics:', error)
    throw error
  }

  return data || []
}

/**
 * Получает работы автора из коллекций (collection_items)
 */
export async function getAuthorBazarWorks(userId) {
  // Сначала получаем коллекции пользователя
  const { data: collections, error: colError } = await supabase
    .from('collections')
    .select('id, is_public')
    .eq('user_id', userId)

  if (colError) {
    console.error('Error fetching user collections:', colError)
    throw colError
  }

  if (!collections || collections.length === 0) {
    console.log('No collections found for user')
    return []
  }

  const collectionIds = collections.map(c => c.id)
  const publicCollectionIds = collections.filter(c => c.is_public).map(c => c.id)

  // Получаем все элементы из коллекций пользователя
  const { data: items, error: itemsError } = await supabase
    .from('collection_items')
    .select('*')
    .in('collection_id', collectionIds)
    .order('created_at', { ascending: false })

  if (itemsError) {
    console.error('Error fetching collection items:', itemsError)
    throw itemsError
  }

  console.log('Found collection items:', items?.length)

  // Собираем asset_id для загрузки данных из works
  const workAssetIds = (items || [])
    .filter(item => item.asset_type === 'work')
    .map(item => item.asset_id)

  // Загружаем данные работ из таблицы works
  let worksMap = {}
  if (workAssetIds.length > 0) {
    const { data: worksData } = await supabase
      .from('works')
      .select('id, title, description, category, thumbnail_url, media_url')
      .in('id', workAssetIds)

    if (worksData) {
      worksMap = Object.fromEntries(worksData.map(w => [w.id, w]))
    }
  }

  // Форматируем как работы
  return (items || []).map(item => {
    const isPublished = publicCollectionIds.includes(item.collection_id)
    const workData = worksMap[item.asset_id] || {}
    return {
      id: item.id,
      asset_id: item.asset_id,
      collection_id: item.collection_id,
      title: workData.title || 'Работа без названия',
      description: workData.description || '',
      category: workData.category || '',
      thumbnail_url: workData.thumbnail_url || workData.media_url,
      media_url: workData.media_url,
      status: isPublished ? 'published' : 'draft',
      published_at: isPublished ? item.created_at : null,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      stars: 0,
      recommends: 0,
      views: 0
    }
  })
}

/**
 * Получает работы для BAZAR (публичные)
 */
export async function getBazarWorks(limit, offset) {
  let query = supabase
    .from('bazar_works')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (limit) {
    query = query.limit(limit)
  }

  if (offset !== undefined && limit) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bazar works:', error)
    throw error
  }

  return data || []
}

/**
 * Публикует работу
 */
export async function publishWork(workId) {
  const { error } = await supabase.rpc('publish_work', {
    work_id: workId
  })

  if (error) {
    console.error('Error publishing work:', error)
    throw error
  }
}

/**
 * Снимает работу с публикации
 */
export async function unpublishWork(workId) {
  const { error } = await supabase.rpc('unpublish_work', {
    work_id: workId
  })

  if (error) {
    console.error('Error unpublishing work:', error)
    throw error
  }
}

/**
 * Увеличивает счетчик просмотров
 */
export async function incrementWorkView(workId) {
  const { error } = await supabase.rpc('increment_work_view', {
    work_id: workId
  })

  if (error) {
    console.error('Error incrementing work view:', error)
    throw error
  }
}

/**
 * Получает статистику автора (суммарные метрики всех работ)
 */
export async function getAuthorStats(userId) {
  // Получаем все работы автора
  const works = await getAuthorWorks(userId)
  const workIds = works.map(w => w.id)

  if (workIds.length === 0) {
    return {
      likesStars: 0,
      recommend: 0,
      orders: 0,
      balanceDmc: 0
    }
  }

  // Получаем метрики
  const metrics = await getWorksMetrics(workIds)

  // Считаем суммарные метрики
  const totalStars = metrics.reduce((sum, m) => sum + (m.stars || 0), 0)
  const totalRecommends = metrics.reduce((sum, m) => sum + (m.recommends || 0), 0)
  const totalViews = metrics.reduce((sum, m) => sum + (m.views || 0), 0)

  // TODO: orders и balanceDmc - нужно получать из других таблиц
  // Пока возвращаем 0
  return {
    likesStars: totalStars,
    recommend: totalRecommends,
    orders: 0, // TODO: получить из таблицы заказов
    balanceDmc: 0 // TODO: получить из таблицы балансов
  }
}

/**
 * Получает работы по списку ID
 */
export async function getWorksByIds(workIds) {
  if (!workIds || workIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('works')
    .select('*')
    .in('id', workIds)

  if (error) {
    console.error('Error fetching works by ids:', error)
    throw error
  }

  return data || []
}

/**
 * Обновляет работу (например, название)
 */
export async function updateWork(workId, updates) {
  const { data, error } = await supabase
    .from('works')
    .update(updates)
    .eq('id', workId)
    .select()
    .single()

  if (error) {
    console.error('Error updating work:', error)
    throw error
  }

  return data
}

/**
 * Поставить/убрать лайк работе
 * Триггер в БД автоматически обновит likes в work_metrics
 */
export async function likeWork(workId, userId) {
  // Проверяем, есть ли уже лайк
  const { data: existingLike } = await supabase
    .from('work_likes')
    .select('id')
    .eq('work_id', workId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingLike) {
    // Убираем лайк - триггер автоматически уменьшит счётчик
    await supabase
      .from('work_likes')
      .delete()
      .eq('work_id', workId)
      .eq('user_id', userId)

    // Небольшая задержка чтобы триггер успел отработать
    await new Promise(resolve => setTimeout(resolve, 100))

    // Получаем актуальный счётчик
    const { data: metrics } = await supabase
      .from('work_metrics')
      .select('likes')
      .eq('work_id', workId)
      .maybeSingle()

    return { likes: metrics?.likes || 0, isLiked: false }
  } else {
    // Ставим лайк - триггер автоматически увеличит счётчик
    const { error } = await supabase
      .from('work_likes')
      .insert({ work_id: workId, user_id: userId })

    if (error) {
      console.error('Error inserting work like:', error)
    }

    // Небольшая задержка чтобы триггер успел отработать
    await new Promise(resolve => setTimeout(resolve, 100))

    // Получаем актуальный счётчик
    const { data: metrics } = await supabase
      .from('work_metrics')
      .select('likes')
      .eq('work_id', workId)
      .maybeSingle()

    return { likes: metrics?.likes || 0, isLiked: true }
  }
}

/**
 * Проверить, лайкнул ли пользователь работу
 */
export async function checkWorkLiked(workId, userId) {
  const { data } = await supabase
    .from('work_likes')
    .select('id')
    .eq('work_id', workId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
}

