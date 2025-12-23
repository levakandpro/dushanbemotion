// src/services/collectionService.js

import { supabase } from '../lib/supabaseClient'
import { getCurrentUser } from './userService'

/**
 * Получает все коллекции пользователя
 */
export async function getUserCollections(userId) {
  // userId может быть строкой или UUID - Supabase сам преобразует
  console.log('Fetching collections for user:', userId)
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collections:', error)
    throw error
  }

  console.log('Collections fetched:', data?.length || 0, 'items')
  return data || []
}

/**
 * Создает новую коллекцию
 */
export async function createCollection(userId, name, description) {
  // userId может быть строкой или UUID - Supabase сам преобразует
  const insertData = {
    user_id: userId,
    title: (name || 'Новая коллекция').trim(),
    is_public: true // Новые коллекции публичные по умолчанию
  }
  
  // Добавляем description только если он есть
  if (description && description.trim()) {
    insertData.description = description.trim()
  }

  console.log('Creating collection:', insertData)
  
  const { data, error } = await supabase
    .from('collections')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating collection:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    console.error('Insert data:', insertData)
    throw error
  }

  console.log('Collection created successfully:', data)
  return data
}

/**
 * Добавляет ассет в коллекцию
 */
export async function addAssetToCollection(collectionId, assetId, assetType) {
  // Проверяем, не добавлен ли уже ассет в эту коллекцию
  const { data: existing } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('asset_id', assetId)
    .eq('asset_type', assetType)
    .maybeSingle()

  if (existing) {
    // Ассет уже в коллекции
    return existing
  }

  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      asset_id: assetId,
      asset_type: assetType
    })
    .select()
    .single()

  if (error) {
    // Игнорируем ошибку уникальности (23505 - unique_violation)
    if (error.code === '23505') {
      // Дубликат - возвращаем существующую запись
      const { data: existingItem } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('asset_id', assetId)
        .eq('asset_type', assetType)
        .single()
      return existingItem
    }
    console.error('Error adding asset to collection:', error)
    throw error
  }

  return data
}

/**
 * Удаляет ассет из коллекции
 */
export async function removeAssetFromCollection(collectionId, assetId) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('asset_id', assetId)

  if (error) {
    console.error('Error removing asset from collection:', error)
    throw error
  }
}

/**
 * Получает ассеты из коллекции
 */
export async function getCollectionItems(collectionId) {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection items:', error)
    throw error
  }

  return data || []
}

/**
 * Получает или создает дефолтную коллекцию "D COLLECTION" для текущего пользователя
 */
export async function getOrCreateDefaultCollection() {
  const user = await getCurrentUser()
  if (!user) {
    console.warn('getOrCreateDefaultCollection: User not found')
    return null
  }

  try {
    // Ищем существующую дефолтную коллекцию
    const { data: existing, error: searchError } = await supabase
      .from('collections')
      .select('id, user_id, title, description, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('title', 'D COLLECTION')
      .maybeSingle()

    if (searchError) {
      console.error('Error searching for default collection:', searchError)
      // Не бросаем ошибку, пробуем создать
    }

    if (existing) {
      return existing
    }

    // Создаем дефолтную коллекцию
    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        title: 'D COLLECTION'
      })
      .select('id, user_id, title, description, created_at, updated_at')
      .single()

    if (createError) {
      // Если ошибка уникальности - значит коллекция уже создана другим запросом
      // Пытаемся получить её снова
      if (createError.code === '23505') {
        const { data: retryExisting, error: retryError } = await supabase
          .from('collections')
          .select('id, user_id, title, description, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('title', 'D COLLECTION')
          .maybeSingle()
        
        if (retryError) {
          console.error('Error retrying default collection:', retryError)
          return null
        }
      
        if (retryExisting) {
          return retryExisting
        }
      }
      console.error('Error creating default collection:', createError)
      return null
    }

    return newCollection
  } catch (err) {
    console.error('getOrCreateDefaultCollection error:', err)
    return null
  }
}

/**
 * Получает все коллекции текущего пользователя (включая дефолтную)
 * Гарантирует наличие дефолтной коллекции и удаляет дубликаты
 */
export async function getMyCollections() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('User not found')
  }

  // Гарантируем наличие дефолтной коллекции
  await getOrCreateDefaultCollection()

  // Получаем все коллекции
  const collections = await getUserCollections(user.id)
  console.log('getMyCollections: fetched', collections.length, 'collections')

  // Находим все "D COLLECTION"
  const defaultCollections = collections.filter(c => c.title === 'D COLLECTION')
  
  // Если есть дубликаты - удаляем лишние, оставляем самую старую
  if (defaultCollections.length > 1) {
    console.log('Found', defaultCollections.length, 'duplicate D COLLECTION, cleaning up...')
    // Сортируем по created_at (самая старая первая)
    defaultCollections.sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
      return dateA - dateB
    })
    
    // Оставляем только первую (самую старую)
    const toKeep = defaultCollections[0]
    const toDelete = defaultCollections.slice(1)
    
    // Удаляем дубликаты
    for (const dup of toDelete) {
      try {
        await supabase
          .from('collections')
          .delete()
          .eq('id', dup.id)
      } catch (error) {
        console.error('Error deleting duplicate collection:', error)
      }
    }
    
    // Перезагружаем коллекции из базы после удаления дубликатов
    const refreshedCollections = await getUserCollections(user.id)
    console.log('getMyCollections: after cleanup, returning', refreshedCollections.length, 'collections')
    return refreshedCollections
  }

  console.log('getMyCollections: returning', collections.length, 'collections')
  return collections
}

/**
 * Добавляет элемент в коллекцию (игнорирует дубликаты)
 * @param {string} collectionId - ID коллекции
 * @param {string} itemType - Тип элемента (work, background)
 * @param {string} itemId - ID или URL элемента
 */
export async function addItemToCollection(collectionId, itemType, itemId) {
  const { data: existing } = await supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', collectionId)
    .eq('asset_id', itemId)
    .eq('asset_type', itemType)
    .maybeSingle()

  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      asset_id: itemId,
      asset_type: itemType
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existingItem } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('asset_id', itemId)
        .eq('asset_type', itemType)
        .single()
      return existingItem
    }
    console.error('Error adding item to collection:', error)
    throw error
  }

  return data
}

/**
 * Получает ID работ из коллекции (все типы: work, background и др.)
 */
export async function getCollectionWorkIds(collectionId) {
  const { data, error } = await supabase
    .from('collection_items')
    .select('asset_id, asset_type')
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Error fetching collection work ids:', error)
    throw error
  }

  console.log('getCollectionWorkIds: raw data from DB:', data)
  // Берём все asset_id независимо от типа
  const ids = (data || []).map(item => item.asset_id).filter(Boolean)
  console.log('getCollectionWorkIds: extracted IDs:', ids)
  return ids
}

export async function getCollectionsWithCounts(userId) {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        user_id,
        title,
        description,
        created_at,
        updated_at,
        is_public,
        published_at,
        collection_items(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching collections with counts:', error)
      // Пробуем без is_public и published_at (если поля ещё не добавлены)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('collections')
        .select(`
          id,
          user_id,
          title,
          description,
          created_at,
          updated_at,
          collection_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        return []
      }
      
      return (fallbackData || []).map(col => ({
        ...col,
        is_public: false,
        published_at: null,
        items_count: col.collection_items?.[0]?.count || 0
      }))
    }

    return (data || []).map(col => ({
      ...col,
      items_count: col.collection_items?.[0]?.count || 0
    }))
  } catch (err) {
    console.error('getCollectionsWithCounts error:', err)
    return []
  }
}

export async function renameCollection(collectionId, newTitle) {
  const { data: collection, error: fetchError } = await supabase
    .from('collections')
    .select('title')
    .eq('id', collectionId)
    .single()

  if (fetchError) {
    console.error('Error fetching collection:', fetchError)
    throw fetchError
  }

  if (collection.title === 'D COLLECTION') {
    throw new Error('Нельзя переименовать дефолтную коллекцию')
  }

  const { data, error } = await supabase
    .from('collections')
    .update({ title: newTitle.trim() })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error renaming collection:', error)
    throw error
  }

  return data
}

export async function deleteCollection(collectionId) {
  const { data: collection, error: fetchError } = await supabase
    .from('collections')
    .select('title')
    .eq('id', collectionId)
    .single()

  if (fetchError) {
    console.error('Error fetching collection:', fetchError)
    throw fetchError
  }

  if (collection.title === 'D COLLECTION') {
    throw new Error('Нельзя удалить дефолтную коллекцию')
  }

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)

  if (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

export async function updateCollectionCover(collectionId, coverUrl) {
  const { data, error } = await supabase
    .from('collections')
    .update({ cover_url: coverUrl })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating collection cover:', error)
    throw error
  }

  return data
}

export async function getPublicCollections(limit = 20) {
  // Показываем все коллекции
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_items(count)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching public collections:', error)
    throw error
  }

  // Загружаем данные авторов отдельно
  const userIds = [...new Set((data || []).map(col => col.user_id).filter(Boolean))];
  let authorsMap = {};
  
  if (userIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);
    
    if (authors) {
      authorsMap = authors.reduce((acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {});
    }
  }

  return (data || []).map(col => {
    const author = authorsMap[col.user_id];
    return {
      ...col,
      items_count: col.collection_items?.[0]?.count || 0,
      author_name: author?.display_name || author?.username || 'Автор',
      author_username: author?.username,
      author_avatar: author?.avatar_url
    };
  });
}

export async function getCollectionCovers(collectionId, limit = 5) {
  // Получаем все элементы коллекции (любого типа)
  const { data, error } = await supabase
    .from('collection_items')
    .select('asset_id, asset_type')
    .eq('collection_id', collectionId)
    .limit(limit)

  if (error) {
    console.error('Error fetching collection covers:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // UUID паттерн для проверки
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Разделяем на works (UUID) и backgrounds (URL)
  const workItems = data.filter(item => item.asset_type === 'work' && uuidPattern.test(item.asset_id));
  const backgroundItems = data.filter(item => item.asset_type === 'background');

  let covers = [];

  // Для background - asset_id это уже URL картинки
  if (backgroundItems.length > 0) {
    covers = [...covers, ...backgroundItems.map(item => item.asset_id)];
  }

  // Для works - загружаем из БД
  if (workItems.length > 0) {
    const workIds = workItems.map(item => item.asset_id);
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('thumbnail_url, media_url')
      .in('id', workIds);

    if (!worksError && works) {
      const workCovers = works
        .map(work => work.thumbnail_url || work.media_url)
        .filter(Boolean);
      covers = [...covers, ...workCovers];
    }
  }

  return covers.slice(0, limit);
}

export async function toggleCollectionPublic(collectionId, isPublic) {
  const { data, error } = await supabase
    .from('collections')
    .update({ is_public: isPublic })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling collection public:', error)
    throw error
  }

  return data
}

/**
 * Закрепить/открепить коллекцию на странице автора
 */
export async function toggleCollectionPinned(collectionId, isPinned) {
  const { data, error } = await supabase
    .from('collections')
    .update({ is_pinned: isPinned })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling collection pinned:', error)
    throw error
  }

  return data
}

/**
 * Получить количество закреплённых коллекций пользователя
 */
export async function getPinnedCollectionsCount(userId) {
  const { count, error } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_pinned', true)

  if (error) {
    console.error('Error counting pinned collections:', error)
    return 0
  }

  return count || 0
}

/**
 * Делает все коллекции пользователя публичными
 */
export async function makeAllCollectionsPublic(userId) {
  const { data, error } = await supabase
    .from('collections')
    .update({ is_public: true })
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error making collections public:', error)
    throw error
  }

  return data
}

/**
 * Оновлює позицію item в колекції (для reorder)
 */
export async function updateItemPosition(itemId, position) {
  const { data, error } = await supabase
    .from('collection_items')
    .update({ position })
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating item position:', error)
    throw error
  }

  return data
}

/**
 * Видаляє item з колекції
 */
export async function removeItemFromCollection(collectionId, assetId) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('asset_id', assetId)

  if (error) {
    console.error('Error removing item from collection:', error)
    throw error
  }
}

/**
 * Видаляє кілька items з колекції
 */
export async function removeItemsFromCollection(collectionId, assetIds) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .in('asset_id', assetIds)

  if (error) {
    console.error('Error removing items from collection:', error)
    throw error
  }
}

/**
 * Очищає всі items з колекції
 */
export async function clearCollection(collectionId) {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Error clearing collection:', error)
    throw error
  }
}

/**
 * Оновлює обкладинку колекції
 */
export async function updateCollectionCoverItem(collectionId, coverItemId, coverItemType) {
  const { data, error } = await supabase
    .from('collections')
    .update({ 
      cover_item_id: coverItemId,
      cover_item_type: coverItemType
    })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating collection cover:', error)
    throw error
  }

  return data
}

/**
 * Оновлює Ч/Б режим обкладинки
 */
export async function toggleCollectionCoverBW(collectionId, isBW) {
  const { data, error } = await supabase
    .from('collections')
    .update({ cover_is_bw: isBW })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling cover BW:', error)
    throw error
  }

  return data
}

/**
 * Публикует коллекцию в BAZAR (делает публичной)
 */
export async function publishCollectionToBazar(collectionId) {
  const { data, error } = await supabase
    .from('collections')
    .update({ 
      is_public: true,
      published_at: new Date().toISOString()
    })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error publishing collection:', error)
    throw error
  }

  return data
}

/**
 * Снимает коллекцию с публикации в BAZAR
 */
export async function unpublishCollectionFromBazar(collectionId) {
  const { data, error } = await supabase
    .from('collections')
    .update({ 
      is_public: false
    })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    console.error('Error unpublishing collection:', error)
    throw error
  }

  return data
}

