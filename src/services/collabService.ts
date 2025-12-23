// src/services/collabService.ts
// Сервис для работы с коллабами — двусторонний контракт

import { supabase } from '../lib/supabaseClient'

// =====================================================
// ТИПЫ
// =====================================================

export type CollabStatus = 'draft' | 'pending' | 'active' | 'paused' | 'delete_requested' | 'archived'
export type MaterialStatus = 'pending' | 'approved' | 'rejected'

export interface Collab {
  id: string
  author1_id: string
  author2_id: string
  created_by: string
  title: string
  description: string | null
  cover_url: string | null
  status: CollabStatus
  paused_by: string | null
  delete_requested_by: string | null
  author1_share: number
  author2_share: number
  pending_author1_share: number | null
  pending_author2_share: number | null
  share_change_requested_by: string | null
  author1_confirmed: boolean
  author2_confirmed: boolean
  created_at: string
  updated_at: string
  confirmed_at: string | null
  archived_at: string | null
  // Joined data
  author1?: { id: string; display_name: string; avatar_url: string; username?: string }
  author2?: { id: string; display_name: string; avatar_url: string; username?: string }
}

export interface CollabMaterial {
  id: string
  collab_id: string
  owner_id: string
  service_id: string | null
  title: string
  description: string | null
  preview_url: string | null
  status: MaterialStatus
  pending_approval_from: string | null
  rejection_reason: string | null
  created_at: string
  approved_at: string | null
  rejected_at: string | null
  // Joined
  owner?: { id: string; display_name: string; avatar_url: string }
}

export interface CollabHistoryEntry {
  id: string
  collab_id: string
  actor_id: string
  action_type: string
  details: Record<string, any> | null
  created_at: string
  // Joined
  actor?: { id: string; display_name: string; avatar_url: string }
}

// =====================================================
// ПОЛУЧЕНИЕ КОЛЛАБОВ
// =====================================================

/**
 * Получить все коллабы пользователя
 */
export async function getUserCollabs(userId: string): Promise<Collab[]> {
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .or(`author1_id.eq.${userId},author2_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching collabs:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Собираем уникальные ID авторов
  const authorIds = new Set<string>()
  data.forEach(c => {
    authorIds.add(c.author1_id)
    authorIds.add(c.author2_id)
  })

  // Загружаем профили
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', Array.from(authorIds))

  // Присоединяем профили к коллабам
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  data.forEach(c => {
    c.author1 = profileMap.get(c.author1_id) || null
    c.author2 = profileMap.get(c.author2_id) || null
  })

  return data
}

/**
 * Получить коллаб по ID
 */
export async function getCollabById(collabId: string): Promise<Collab | null> {
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .eq('id', collabId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching collab:', error)
    throw error
  }

  // Загружаем профили авторов отдельно
  if (data) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', [data.author1_id, data.author2_id])

    if (profiles) {
      data.author1 = profiles.find(p => p.id === data.author1_id) || null
      data.author2 = profiles.find(p => p.id === data.author2_id) || null
    }
  }

  return data
}

// =====================================================
// СОЗДАНИЕ КОЛЛАБА
// =====================================================

export interface CreateCollabData {
  partnerId: string
  title: string
  description?: string
  author1Share?: number // По умолчанию 50
  coverUrl?: string
}

/**
 * Создать новый коллаб (статус: draft → pending после отправки)
 */
export async function createCollab(
  creatorId: string,
  data: CreateCollabData
): Promise<Collab> {
  // Проверяем что партнёр принимает коллабы
  const { data: partnerProfile } = await supabase
    .from('profiles')
    .select('collab_enabled')
    .eq('id', data.partnerId)
    .single()

  if (partnerProfile?.collab_enabled === false) {
    throw new Error('Автор запрещает создавать коллабы')
  }

  const author1Share = data.author1Share ?? 50
  const author2Share = 100 - author1Share

  const { data: collab, error } = await supabase
    .from('collabs')
    .insert({
      author1_id: creatorId,
      author2_id: data.partnerId,
      created_by: creatorId,
      title: data.title,
      description: data.description || null,
      cover_url: data.coverUrl || null,
      status: 'pending', // Сразу отправляем на подтверждение
      author1_share: author1Share,
      author2_share: author2Share,
      author1_confirmed: true, // Создатель автоматически подтверждает
      author2_confirmed: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating collab:', error)
    throw error
  }

  // Записываем в историю
  await addHistoryEntry(collab.id, creatorId, 'created', {
    title: data.title,
    partner_id: data.partnerId,
    shares: { author1: author1Share, author2: author2Share }
  })

  return collab
}

// =====================================================
// ПОДТВЕРЖДЕНИЕ КОЛЛАБА
// =====================================================

/**
 * Подтвердить участие в коллабе (вторая сторона)
 * Использует RPC accept_collab с SECURITY DEFINER
 */
export async function confirmCollab(collabId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error confirming collab:', error)
    throw error
  }
}

/**
 * Отклонить приглашение в коллаб
 */
export async function rejectCollab(collabId: string, userId: string): Promise<void> {
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')

  // Можно отклонить только pending коллаб
  if (collab.status !== 'pending') {
    throw new Error('Можно отклонить только ожидающий коллаб')
  }

  // Удаляем коллаб при отклонении
  const { error } = await supabase
    .from('collabs')
    .delete()
    .eq('id', collabId)

  if (error) {
    console.error('Error rejecting collab:', error)
    throw error
  }
}

// =====================================================
// ПАУЗА
// =====================================================

/**
 * Поставить коллаб на паузу
 * Использует RPC pause_collab с логированием в collab_history
 */
export async function pauseCollab(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('pause_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error pausing collab:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

/**
 * Снять коллаб с паузы
 * Использует RPC resume_collab с логированием в collab_history
 */
export async function resumeCollab(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('resume_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error resuming collab:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

// =====================================================
// УДАЛЕНИЕ (ДВУСТОРОННЕЕ)
// =====================================================

/**
 * Запросить удаление коллаба
 * Использует RPC request_delete_collab с логированием в collab_history
 */
export async function requestDeleteCollab(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('request_delete_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error requesting delete:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

/**
 * Подтвердить удаление коллаба (вторая сторона)
 * Использует RPC confirm_delete_collab с логированием в collab_history
 */
export async function confirmDeleteCollab(collabId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_delete_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error confirming delete:', error)
    throw new Error(error.message)
  }
}

/**
 * Отменить запрос на удаление
 * Использует RPC cancel_delete_collab с логированием в collab_history
 */
export async function cancelDeleteRequest(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('cancel_delete_collab', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error cancelling delete:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

// =====================================================
// ИЗМЕНЕНИЕ ПРОЦЕНТОВ (ДВУСТОРОННЕЕ)
// =====================================================

/**
 * Запросить изменение процентов
 * Использует RPC request_share_change с логированием в collab_history
 */
export async function requestShareChange(
  collabId: string,
  userId: string,
  newAuthor1Share: number
): Promise<Collab> {
  const { error } = await supabase.rpc('request_share_change', {
    p_collab_id: collabId,
    p_new_author1_share: newAuthor1Share
  })

  if (error) {
    console.error('Error requesting share change:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

/**
 * Подтвердить изменение процентов
 * Использует RPC confirm_share_change с логированием в collab_history
 */
export async function confirmShareChange(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('confirm_share_change', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error confirming share change:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

/**
 * Отклонить изменение процентов
 * Использует RPC reject_share_change с логированием в collab_history
 */
export async function rejectShareChange(collabId: string, userId: string): Promise<Collab> {
  const { error } = await supabase.rpc('reject_share_change', {
    p_collab_id: collabId
  })

  if (error) {
    console.error('Error rejecting share change:', error)
    throw new Error(error.message)
  }

  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  return collab
}

// =====================================================
// МАТЕРИАЛЫ
// =====================================================

export interface AddMaterialData {
  title: string
  description?: string
  previewUrl?: string
  serviceId?: string
}

/**
 * Добавить материал в коллаб
 */
export async function addMaterial(
  collabId: string,
  ownerId: string,
  data: AddMaterialData
): Promise<CollabMaterial> {
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')

  if (collab.status !== 'active') {
    throw new Error('Добавлять материалы можно только в активный коллаб')
  }

  // Определяем партнёра для подтверждения
  const partnerId = collab.author1_id === ownerId ? collab.author2_id : collab.author1_id

  const { data: material, error } = await supabase
    .from('collab_materials')
    .insert({
      collab_id: collabId,
      owner_id: ownerId,
      title: data.title,
      description: data.description || null,
      preview_url: data.previewUrl || null,
      service_id: data.serviceId || null,
      status: 'pending',
      pending_approval_from: partnerId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding material:', error)
    throw error
  }

  await addHistoryEntry(collabId, ownerId, 'material_added', {
    material_id: material.id,
    title: data.title
  })

  return material
}

/**
 * Подтвердить материал (партнёр)
 * Использует RPC approve_material с логированием в collab_history
 */
export async function approveMaterial(materialId: string, userId: string): Promise<CollabMaterial> {
  const { error } = await supabase.rpc('approve_material', {
    p_material_id: materialId
  })

  if (error) {
    console.error('Error approving material:', error)
    throw new Error(error.message)
  }

  // Получаем обновлённый материал
  const { data, error: fetchError } = await supabase
    .from('collab_materials')
    .select('*')
    .eq('id', materialId)
    .single()

  if (fetchError || !data) {
    throw new Error('Материал не найден')
  }

  return data
}

/**
 * Отклонить материал (партнёр)
 * Использует RPC reject_material с логированием в collab_history
 */
export async function rejectMaterial(
  materialId: string,
  userId: string,
  reason?: string
): Promise<CollabMaterial> {
  const { error } = await supabase.rpc('reject_material', {
    p_material_id: materialId,
    p_reason: reason || null
  })

  if (error) {
    console.error('Error rejecting material:', error)
    throw new Error(error.message)
  }

  // Получаем обновлённый материал
  const { data, error: fetchError } = await supabase
    .from('collab_materials')
    .select('*')
    .eq('id', materialId)
    .single()

  if (fetchError || !data) {
    throw new Error('Материал не найден')
  }

  return data
}

/**
 * Удалить материал (любой участник коллаба может удалить)
 */
export async function deleteMaterial(
  materialId: string,
  userId: string,
  collabId: string
): Promise<void> {
  // Проверяем что пользователь участник коллаба
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  
  if (collab.author1_id !== userId && collab.author2_id !== userId) {
    throw new Error('Вы не участник этого коллаба')
  }

  const { error } = await supabase
    .from('collab_materials')
    .delete()
    .eq('id', materialId)
    .eq('collab_id', collabId)

  if (error) {
    console.error('Error deleting material:', error)
    throw error
  }

  await addHistoryEntry(collabId, userId, 'material_deleted', { material_id: materialId })
}

/**
 * Установить материал как обложку коллаба
 */
export async function setMaterialAsCover(
  materialId: string,
  userId: string,
  collabId: string
): Promise<void> {
  // Проверяем что пользователь участник коллаба
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  
  if (collab.author1_id !== userId && collab.author2_id !== userId) {
    throw new Error('Вы не участник этого коллаба')
  }

  // Получаем материал
  const { data: material, error: matError } = await supabase
    .from('collab_materials')
    .select('preview_url')
    .eq('id', materialId)
    .eq('collab_id', collabId)
    .single()

  if (matError || !material?.preview_url) {
    throw new Error('Материал не найден или не имеет изображения')
  }

  // Обновляем обложку коллаба
  const { error } = await supabase
    .from('collabs')
    .update({ cover_url: material.preview_url })
    .eq('id', collabId)

  if (error) {
    console.error('Error setting cover:', error)
    throw error
  }

  await addHistoryEntry(collabId, userId, 'cover_changed', { material_id: materialId })
}

/**
 * Обновить название коллаба
 */
export async function updateCollabTitle(
  collabId: string,
  userId: string,
  title: string
): Promise<void> {
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  
  if (collab.author1_id !== userId && collab.author2_id !== userId) {
    throw new Error('Вы не участник этого коллаба')
  }

  const { error } = await supabase
    .from('collabs')
    .update({ title })
    .eq('id', collabId)

  if (error) {
    console.error('Error updating title:', error)
    throw error
  }

  await addHistoryEntry(collabId, userId, 'title_updated', { title })
}

/**
 * Обновить описание коллаба
 */
export async function updateCollabDescription(
  collabId: string,
  userId: string,
  description: string
): Promise<void> {
  // Проверяем что пользователь участник коллаба
  const collab = await getCollabById(collabId)
  if (!collab) throw new Error('Коллаб не найден')
  
  if (collab.author1_id !== userId && collab.author2_id !== userId) {
    throw new Error('Вы не участник этого коллаба')
  }

  const { error } = await supabase
    .from('collabs')
    .update({ description })
    .eq('id', collabId)

  if (error) {
    console.error('Error updating description:', error)
    throw error
  }

  await addHistoryEntry(collabId, userId, 'description_updated', { description })
}

/**
 * Получить материалы коллаба
 */
export async function getCollabMaterials(collabId: string): Promise<CollabMaterial[]> {
  const { data, error } = await supabase
    .from('collab_materials')
    .select('*')
    .eq('collab_id', collabId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching materials:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Загружаем профили владельцев отдельно
  const ownerIds = [...new Set(data.map(m => m.owner_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ownerIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  
  return data.map(m => ({
    ...m,
    owner: profileMap.get(m.owner_id) || null
  }))
}

// =====================================================
// ИСТОРИЯ
// =====================================================

/**
 * Добавить запись в историю
 */
async function addHistoryEntry(
  collabId: string,
  actorId: string,
  actionType: string,
  details: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('collab_history')
    .insert({
      collab_id: collabId,
      actor_id: actorId,
      action_type: actionType,
      details
    })

  if (error) {
    console.error('Error adding history entry:', error)
    // Не бросаем ошибку, история не критична
  }
}

/**
 * Получить историю коллаба
 */
export async function getCollabHistory(collabId: string): Promise<CollabHistoryEntry[]> {
  const { data, error } = await supabase
    .from('collab_history')
    .select('*')
    .eq('collab_id', collabId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Загружаем профили акторов отдельно
  const actorIds = [...new Set(data.map(h => h.actor_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', actorIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  
  return data.map(h => ({
    ...h,
    actor: profileMap.get(h.actor_id) || null
  }))
}

// =====================================================
// УТИЛИТЫ
// =====================================================

/**
 * Получить роль пользователя в коллабе
 */
export function getUserRole(collab: Collab, userId: string): 'author1' | 'author2' | null {
  if (collab.author1_id === userId) return 'author1'
  if (collab.author2_id === userId) return 'author2'
  return null
}

/**
 * Получить партнёра в коллабе
 */
export function getPartner(collab: Collab, userId: string): { id: string; display_name: string; avatar_url: string } | null {
  if (collab.author1_id === userId) return collab.author2 || null
  if (collab.author2_id === userId) return collab.author1 || null
  return null
}

/**
 * Получить долю пользователя
 */
export function getUserShare(collab: Collab, userId: string): number {
  if (collab.author1_id === userId) return collab.author1_share
  if (collab.author2_id === userId) return collab.author2_share
  return 0
}

/**
 * Проверить, нужно ли пользователю подтвердить что-то
 */
export function getPendingActions(collab: Collab, userId: string): string[] {
  const actions: string[] = []
  const role = getUserRole(collab, userId)
  if (!role) return actions

  // Подтверждение участия
  if (collab.status === 'pending') {
    if (role === 'author1' && !collab.author1_confirmed) actions.push('confirm_participation')
    if (role === 'author2' && !collab.author2_confirmed) actions.push('confirm_participation')
  }

  // Подтверждение удаления
  if (collab.status === 'delete_requested' && collab.delete_requested_by !== userId) {
    actions.push('confirm_delete')
  }

  // Подтверждение изменения процентов
  if (collab.share_change_requested_by && collab.share_change_requested_by !== userId) {
    actions.push('confirm_share_change')
  }

  return actions
}

/**
 * Человекочитаемый статус
 */
export function getStatusLabel(status: CollabStatus): string {
  const labels: Record<CollabStatus, string> = {
    draft: 'Черновик',
    pending: 'Ожидает подтверждения',
    active: 'Активен',
    paused: 'Пауза',
    delete_requested: 'Запрос на удаление',
    archived: 'Архив'
  }
  return labels[status] || status
}

/**
 * Человекочитаемое действие в истории
 */
export function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    created: 'создал коллаб',
    confirmed: 'подтвердил участие',
    material_added: 'добавил материал',
    material_approved: 'подтвердил материал',
    material_rejected: 'отклонил материал',
    paused: 'поставил на паузу',
    resumed: 'снял с паузы',
    delete_requested: 'запросил удаление',
    delete_confirmed: 'подтвердил удаление',
    delete_cancelled: 'отменил запрос удаления',
    share_change_requested: 'запросил изменение процентов',
    share_change_approved: 'подтвердил изменение процентов',
    share_change_rejected: 'отклонил изменение процентов',
    archived: 'архивировал'
  }
  return labels[actionType] || actionType
}

/**
 * Получить количество уведомлений для коллабов пользователя
 * Считает: confirm_participation, confirm_delete, confirm_share_change, pending material approvals
 */
export async function getCollabNotificationsCount(userId: string): Promise<number> {
  let count = 0

  // Загружаем коллабы пользователя (не архивные)
  const { data: collabs, error: collabsError } = await supabase
    .from('collabs')
    .select('*')
    .or(`author1_id.eq.${userId},author2_id.eq.${userId}`)
    .neq('status', 'archived')

  if (collabsError) {
    console.error('Error fetching collabs for notifications:', collabsError)
    return 0
  }

  if (collabs) {
    for (const collab of collabs) {
      const actions = getPendingActions(collab as Collab, userId)
      count += actions.length
    }
  }

  // Загружаем материалы, ожидающие подтверждения от пользователя
  const { data: pendingMaterials, error: materialsError } = await supabase
    .from('collab_materials')
    .select('id')
    .eq('pending_approval_from', userId)
    .eq('status', 'pending')

  if (materialsError) {
    console.error('Error fetching pending materials:', materialsError)
  } else if (pendingMaterials) {
    count += pendingMaterials.length
  }

  return count
}

// =====================================================
// ЛАЙКИ КОЛЛАБОВ
// =====================================================

/**
 * Поставить лайк коллабу
 * Триггер в БД автоматически обновит likes_count
 */
export async function likeCollab(collabId: string, userId: string): Promise<{ likes: number; isLiked: boolean }> {
  // Проверяем, есть ли уже лайк
  const { data: existingLike } = await supabase
    .from('collab_likes')
    .select('id')
    .eq('collab_id', collabId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingLike) {
    // Убираем лайк - триггер автоматически уменьшит счётчик
    await supabase
      .from('collab_likes')
      .delete()
      .eq('collab_id', collabId)
      .eq('user_id', userId)

    // Небольшая задержка чтобы триггер успел отработать
    await new Promise(resolve => setTimeout(resolve, 100))

    // Получаем актуальный счётчик
    const { data: collab } = await supabase
      .from('collabs')
      .select('likes_count')
      .eq('id', collabId)
      .single()

    return { likes: collab?.likes_count || 0, isLiked: false }
  } else {
    // Ставим лайк - триггер автоматически увеличит счётчик
    const { error } = await supabase
      .from('collab_likes')
      .insert({ collab_id: collabId, user_id: userId })

    if (error) {
      console.error('Error inserting collab like:', error)
    }

    // Небольшая задержка чтобы триггер успел отработать
    await new Promise(resolve => setTimeout(resolve, 100))

    // Получаем актуальный счётчик
    const { data: collab } = await supabase
      .from('collabs')
      .select('likes_count')
      .eq('id', collabId)
      .single()

    return { likes: collab?.likes_count || 0, isLiked: true }
  }
}

/**
 * Проверить, лайкнул ли пользователь коллаб
 */
export async function checkCollabLiked(collabId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('collab_likes')
    .select('id')
    .eq('collab_id', collabId)
    .eq('user_id', userId)
    .single()

  return !!data
}

// =====================================================
// ПУБЛИЧНЫЕ КОЛЛАБЫ ДЛЯ BAZAR
// =====================================================

/**
 * Получить активные коллабы для отображения в BAZAR
 */
export async function getPublicCollabs(limit: number = 20): Promise<Collab[]> {
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching public collabs:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Собираем уникальные ID авторов
  const authorIds = new Set<string>()
  data.forEach(c => {
    authorIds.add(c.author1_id)
    authorIds.add(c.author2_id)
  })

  // Загружаем профили
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', Array.from(authorIds))

  // Присоединяем профили к коллабам (cover_url уже есть в данных)
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  data.forEach(c => {
    c.author1 = profileMap.get(c.author1_id) || null
    c.author2 = profileMap.get(c.author2_id) || null
  })

  return data
}
