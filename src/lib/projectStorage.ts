// src/lib/projectStorage.ts

import { supabase } from './supabaseClient'
import { Project } from './projectTypes'

/**
 * Сохраняет проект (insert или update)
 */
export async function saveProject(project: Project, userId: string): Promise<void> {
  // Проверяем, является ли project.id валидным UUID
  const isValidUUID = project.id && typeof project.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id)

  // Подготавливаем payload - всегда включаем data как JSONB
  const payload: any = {
    user_id: userId,
    title: project.title || "DM Project",
    data: project, // Сохраняем весь проект в поле data
    // Никогда не отправляем null в thumbnail_url, только пустую строку или реальное значение
    thumbnail_url: project.thumbnail_url || '',
  }

  if (project.id && isValidUUID) {
    // Update существующего проекта (только если это валидный UUID)
    const { error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', project.id)

    if (error) {
      console.error('Error updating project:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }
  } else {
    // Insert нового проекта (если id нет или это не UUID)
    // НЕ передаем id в payload - Supabase сгенерирует его автоматически
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating project:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Payload:', JSON.stringify(payload, null, 2))
      throw error
    }

    if (data && data.id) {
      project.id = data.id
    }
  }
}

/**
 * Загружает список проектов пользователя
 */
export async function loadProjectList(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, thumbnail_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading project list:', error)
    throw error
  }

  return data || []
}

/**
 * Загружает проект по ID
 */
export async function loadProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, data, thumbnail_url, created_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error loading project:', error)
    return null
  }

  if (!data || !data.data) {
    return null
  }

  // Восстанавливаем проект из data
  const project: Project = {
    ...data.data,
    id: data.id,
    title: data.title,
    thumbnail_url: data.thumbnail_url,
    created_at: data.created_at,
  }

  return project
}

/**
 * Удаляет проект
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

